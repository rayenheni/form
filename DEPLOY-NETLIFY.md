# Déployer sur Netlify + brancher Supabase

Guide complet pour mettre **Forma Business Lex** en production sur Netlify avec un contenu
éditable stocké dans Supabase. Les deux services ont un plan gratuit suffisant pour un site
vitrine (Netlify : 100 Go de bande passante/mois ; Supabase : 500 Mo de base, 50 000
utilisateurs actifs/mois).

Résultat attendu :

```
GitHub (main)  ──push──▶  Netlify (npm run build)  ──▶  https://votre-site.netlify.app
                                    │
                                    └── lit le contenu publié ──▶  Supabase (Postgres + Auth)
```

---

## 0. Ce qu'il faut comprendre avant de commencer

Le site est une application React **compilée en un seul fichier** `index.html`. Il ne lit le
contenu de Supabase que si les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
sont présentes **au moment du build**. Ces valeurs sont gravées dans le fichier : les
modifier dans Netlify sans relancer un déploiement ne change rien.

Sans ces variables, le site fonctionne quand même (contenu intégré au code, sept matières
ENA incluses) mais l'administration reste en **mode local** : « Publier » n'écrit que dans
le navigateur de celui qui publie.

---

## 1. Préparer Supabase (10 minutes)

### 1.1 Créer le projet

1. [supabase.com](https://supabase.com) → **New project**.
2. Nom, mot de passe de base de données (conservez-le), région la plus proche : **Europe
   (Frankfurt ou Paris)** pour la Tunisie.
3. Attendre la fin du provisionnement (~2 min).

### 1.2 Créer les tables

**SQL Editor → New query** → coller tout le contenu de
[`supabase/schema.sql`](../supabase/schema.sql) → **Run**.

Cela crée cinq tables et les règles de sécurité :

| Table | Rôle |
|---|---|
| `published_content` | contenu publié lu par le site public (une ligne par langue) |
| `content_drafts` | brouillons de l'administration (invisibles du public) |
| `content_revisions` | historique des publications, avec restauration |
| `site_pageviews` | statistiques de visites (anonymes) |
| `site_reservations` | demandes du formulaire de contact |
| `admin_users` | liste blanche des comptes autorisés à publier |

### 1.3 Fermer les inscriptions publiques

**Authentication → Sign In / Providers** → désactiver **« Allow new users to sign up »**.

Sans cette étape, n'importe qui peut créer un compte — il ne pourrait rien modifier (la
liste blanche `admin_users` s'en charge), mais autant fermer la porte.

### 1.4 Créer le compte administrateur

**Authentication → Users → Add user → Create new user** :

- e-mail : votre adresse ;
- mot de passe : long et unique ;
- cocher **Auto Confirm User** (sinon il faudra confirmer par e-mail).

### 1.5 Autoriser ce compte à publier

**SQL Editor** :

```sql
insert into public.admin_users (id)
select id from auth.users where email = 'votre-compte@exemple.com';
```

> Sans cette ligne, la connexion réussit mais **toute publication est refusée** par les
> règles RLS. C'est la cause n°1 des « Publier ne fait rien ».

### 1.6 Récupérer les clés

**Project Settings → API** :

- **Project URL** → `https://xxxxxxxxxxxx.supabase.co`
- **anon / public key** → longue chaîne `eyJhbGciOi…`

La clé `anon` est **publique par conception** : elle ne permet que ce que les politiques RLS
autorisent. Ne confondez jamais avec la clé **`service_role`**, qui contourne toute la
sécurité et ne doit jamais apparaître dans le site, dans Netlify ou dans Git.

### 1.7 Configurer les URLs d'authentification

**Authentication → URL Configuration** :

- **Site URL** : `https://votre-site.netlify.app`
- **Redirect URLs** : ajouter `https://votre-site.netlify.app/**` et, pour les aperçus,
  `https://*.netlify.app/**`.

Sans cela, les liens de confirmation ou de réinitialisation de mot de passe renvoient vers
`localhost:3000`.

---

## 2. Créer le site Netlify

### 2.1 Importer le dépôt

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. **GitHub** → autoriser → choisir `rayenheni/form`.
3. Netlify lit `netlify.toml` :

| Réglage | Valeur (déjà dans le fichier) |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node | `22` |

4. **Ne cliquez pas encore sur Deploy** : ajoutez les variables d'abord (étape 2.2). Sinon
   le premier build partira sans Supabase.

### 2.2 Ajouter les variables d'environnement

**Site configuration → Environment variables → Add a variable** :

| Clé | Valeur | Portée |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` | All deploys / Production |
| `VITE_SUPABASE_ANON_KEY` | la clé `anon` | All deploys / Production |
| `VITE_ADMIN_PATH` | ex. `admin-fbl-7k2m9x` (long et aléatoire) | All deploys / Production |
| `VITE_LEADS_ENDPOINT` | *(facultatif)* webhook recevant les demandes | Production |

Trois précautions :

- **aucun espace** avant ou après la valeur (un espace casse l'URL) ;
- ne jamais coller la clé `service_role` ;
- le préfixe `VITE_` est obligatoire : Vite n'expose que ces variables au navigateur.

> `VITE_ADMIN_PATH` n'est **pas** un secret : il est visible dans le bundle. C'est une
> simple commodité. La vraie protection est Supabase Auth + les politiques RLS.

### 2.3 Déployer

**Deploys → Trigger deploy → Clear cache and deploy site**.

Le premier build prend 1 à 3 minutes. L'URL publique apparaît ensuite
(`https://nom-aleatoire.netlify.app`) ; elle se personnalise dans
**Domain management** (`https://votre-domaine.tn`).

---

## 3. Vérifier que Supabase est bien branché

### 3.1 Le test décisif

Ouvrez `https://votre-site.netlify.app/#/<VITE_ADMIN_PATH>` :

| Écran de connexion | Conclusion |
|---|---|
| champs **E-mail + Mot de passe** | Supabase est branché ✅ |
| **un seul champ** « Créer l'accès administrateur » | build sans variables → retour à l'étape 2.2, puis **Clear cache and deploy** |

### 3.2 Publier le contenu

Connectez-vous à l'administration, choisissez **Français**, puis **Publier**. Répétez en
**العربية**. Tant qu'aucune ligne n'existe dans `published_content`, le site affiche son
contenu intégré — ce qui est déjà correct, mais les modifications faites dans l'admin ne
seront visibles qu'après publication.

Contrôle côté base :

```sql
select lang, version, updated_at from public.published_content order by lang;
```

Deux lignes (`fr`, `ar`) attendues.

### 3.3 Vérifier le tableau de bord

Ouvrez le site public, naviguez un peu, puis **Admin → Tableau de bord** : les visites
doivent apparaître. Si le tableau reste vide :

- la collecte échoue en silence par conception (elle ne casse jamais le site) ;
- vérifiez que `schema.sql` a bien créé les politiques d'insertion anonyme sur
  `site_pageviews` ;
- F12 → **Console** : une erreur `row-level security` indique un schéma incomplet.

---

## 3 bis. Diagnostic express : « mes modifications ne sont pas en ligne »

Ouvrez l'URL avec le paramètre de diagnostic :

```
https://votre-site.netlify.app/?diagnostic=1
```

Un panneau s'affiche en bas à gauche et répond aux trois questions qui comptent :

| Ligne | Lecture |
|---|---|
| **Version du build** | repère du bundle réellement servi (permet de distinguer un vieux déploiement d'un cache) |
| **Supabase** | « projet ‹ref› » = branché ; « non configuré » = build sans variables |
| **Source du contenu** | « base Supabase (live) » ou « code intégré au build » |
| **Contenu FR / AR** | `v<n> · <date> — ENA : 7 matière(s)` ; en rouge si ce n'est pas 7 |

Trois combinaisons typiques :

| Diagnostic | Cause | Correction |
|---|---|---|
| Supabase **non configuré** | variables absentes au build | ajouter les variables, puis **Clear cache and deploy** |
| Supabase OK + « code intégré » | aucune ligne publiée n'est lue | exécuter `supabase/reset-content-complet.sql`, ou publier depuis l'admin |
| Supabase OK + `ENA : 5 matière(s)` en rouge | la base contient l'ancien programme | exécuter `supabase/reset-content-complet.sql` |

Le panneau ne s'affiche que sur demande (`?diagnostic=1` ou `#diagnostic`) et n'expose jamais
la clé `anon` : seulement l'identifiant public du projet.

### Remettre la base exactement en phase avec le site

`supabase/reset-content-complet.sql` écrit dans `published_content` le contenu **complet**
(français + arabe) tel qu'il est dans le code : toutes les rubriques, programme ENA à sept
matières, carte formation, tarifs, FAQ, actualité, méta-description.

- sauvegarde intégrale avant écriture (`published_content_backup_20261031`) ;
- une révision d'historique par langue ;
- rejouable sans risque.

À exécuter quand la base contient une ligne partielle (par exemple issue d'un correctif
antérieur) ou quand le site affiche encore l'ancien programme.

---

## 4. Modifier le contenu ou le code

| Vous changez… | Procédure |
|---|---|
| un texte, un tarif, une FAQ | **Admin → rubrique → Publier** (aucun redéploiement) |
| l'ordre des formations, une langue | Admin, puis Publier la langue concernée |
| le code, les styles, la structure | `git push` sur `main` → Netlify reconstruit seul (~2 min) |
| une variable d'environnement | Netlify → Environment variables, puis **Clear cache and deploy** |

Astuce : les variables `VITE_*` ne sont lues qu'au build. Si vous changez le projet
Supabase, il faut **impérativement** redéployer.

---

## 5. Repartir du contenu du code (amorçage)

Si la base est vide et que vous voulez y déposer le contenu actuel du dépôt :

```bash
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
npm run seed:content
```

- la clé `service_role` se prend dans **Project Settings → API** ;
- elle contourne RLS : à exécuter depuis votre machine uniquement, jamais dans Netlify ;
- la commande crée la version 1 et une révision d'historique.

---

## 6. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le site affiche l'ancien contenu | `index.html` en cache, ou build d'avant la modif | `Ctrl/Cmd + Maj + R` ; vérifier le commit affiché dans Netlify → Deploys |
| Écran admin avec un seul champ mot de passe | variables absentes au build | ajouter les variables, **Clear cache and deploy** |
| « Invalid API key » à la connexion | clé `anon` tronquée ou espace en trop | recopier la clé depuis Supabase, recréer la variable, redéployer |
| La connexion réussit mais « Publier » échoue | compte absent de `admin_users` | exécuter l'`insert` de l'étape 1.5 |
| Aucune visite dans le tableau de bord | schéma incomplet ou collecte bloquée | relancer `schema.sql` ; inspecter la console |
| Le formulaire n'enregistre aucune demande | `site_reservations` absente ou RLS trop stricte | relancer `schema.sql` |
| Erreurs CSP en console | `VITE_LEADS_ENDPOINT` pointe un domaine bloqué | la CSP de `netlify.toml` autorise déjà `https:` en `connect-src` |
| Build Netlify en échec | dépendances ou Node | vérifier `NODE_VERSION = "22"` et les logs `npm ci` |

### Réinitialiser un accès administrateur

```sql
-- lister les comptes autorisés
select u.email, a.added_at
from public.admin_users a join auth.users u on u.id = a.id;

-- révoquer un compte
delete from public.admin_users
where id = (select id from auth.users where email = 'ancien@exemple.com');
```

Le mot de passe se change dans **Authentication → Users → … → Reset password**.

---

## 7. Sauvegarde

Le contenu vit dans Supabase, pas dans Git. Une fois par mois :

**SQL Editor** :

```sql
copy (select * from public.published_content) to stdout;
```

ou, plus simple, **Database → Backups** pour les sauvegardes automatiques du plan gratuit
(7 jours de rétention). Le code, lui, est déjà versionné sur GitHub.

---

## 8. Récapitulatif des fichiers de configuration

| Fichier | Rôle |
|---|---|
| `netlify.toml` | build, anti-cache sur `index.html`, en-têtes de sécurité, repli SPA |
| `public/_headers` | mêmes en-têtes pour Cloudflare Pages (ignoré par Netlify) |
| `public/.htaccess` | équivalent pour Apache/InfinityFree |
| `supabase/schema.sql` | tables + politiques RLS, à exécuter une fois |
| `.env.example` | modèle des variables, pour le développement local |
| `DEPLOY-INFINITYFREE.md` | variante hébergement mutuel (sans Git) |
