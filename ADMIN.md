# Administration du site

Une interface d'administration permet de modifier **tout le contenu** du site (français et
arabe) sans toucher au code : formations, programmes phares, page d'accueil, actualités,
tarifs, FAQ, avantages, contact, menu et référencement.

## Accès

L'administration est une page de la même application, sur un **chemin secret** :

```
https://votre-site/#/<VITE_ADMIN_PATH>
```

Exemple : si `VITE_ADMIN_PATH=admin-fbl-7k2`, l'adresse est `https://votre-site/#/admin-fbl-7k2`.
Sans cette variable, l'administration est **fermée** (aucune route ne l'ouvre).

Trois façons d'ouvrir l'administration :

| Adresse | Usage |
|---|---|
| `https://votre-site/#/<VITE_ADMIN_PATH>` | forme normale (le chemin reste secret) |
| `https://votre-site/?admin=1` | quand l'adresse est recopiée ou qu'un outil ne conserve pas le `#/…` |
| `https://votre-site/` | **aperçu uniquement** : si `VITE_PREVIEW_ADMIN=1`, l'administration est la vue par défaut et le site public se rejoint avec `?site=1` |

Sans `VITE_ADMIN_PATH`, ces trois entrées sont fermées.

> ⚠️ `VITE_PREVIEW_ADMIN=1` ne doit **jamais** être activé en production : l'administration
> s'afficherait pour tous les visiteurs à la racine du site (les données resteraient protégées
> par les règles Supabase, mais l'écran de connexion serait public).

Le chemin secret n'est qu'une première barrière : il faut ensuite un **mot de passe**.

## Configuration

1. Copiez `.env.example` vers `.env.local` (fichier jamais commité).
2. Renseignez `VITE_ADMIN_PATH` (long et aléatoire), puis `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY`.
3. Relancez le serveur de développement (`npm run dev`) ou reconstruisez (`npm run build`) :
   les variables `VITE_*` sont figées dans le bundle au moment de la construction.

Sur Netlify : *Project configuration > Environment variables*. Sur GitHub Pages : ajoutez les
variables au workflow `.github/workflows/deploy-pages.yml`.

## Deux modes de fonctionnement

| | **Mode local** (sans Supabase) | **Mode Supabase** |
|---|---|---|
| Déclenché par | `VITE_SUPABASE_URL` absent | `VITE_SUPABASE_URL` + clé renseignés |
| Stockage | `localStorage` de votre navigateur | base Postgres Supabase |
| Visible par le public | non | oui, dès la publication |
| Authentification | mot de passe créé à la première ouverture (haché localement) | utilisateur Supabase Auth |
| Usage | essais, démonstration, travail hors ligne | production |

Le site public lit toujours le contenu **publié**. S'il est inaccessible (réseau coupé, base
vide), il retombe sur le contenu intégré au build : la page ne peut pas s'afficher vide.

## Mise en place de Supabase (production)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → collez `supabase/schema.sql` → *Run*. Cela crée les cinq tables
   (`published_content`, `content_drafts`, `content_revisions`, `site_pageviews`,
   `site_reservations`), la liste blanche `admin_users` et les politiques de sécurité :
   - lecture publique du contenu publié uniquement ;
   - écriture du contenu réservée aux comptes inscrits dans `admin_users` (liste blanche) ;
   - analytique : dépôt anonyme limité en taille (insert), lecture réservée à l'administrateur.
3. **Authentication → Sign In / Providers** : désactivez « Allow new users to sign up ».
   Personne ne pourra créer de compte de lui-même.
4. **Authentication** → *Users* → *Add user* : c'est le compte administrateur
   (désactivez « Auto Confirm » si vous voulez valider l'e-mail).
5. Toujours dans **SQL Editor**, autorisez ce compte à publier :

```sql
insert into public.admin_users (id)
  select id from auth.users where email = 'votre-compte@exemple.com';
```

   Sans cette étape, la connexion réussit mais toute publication est refusée
   (la base ne reconnaît pas le compte comme administrateur).
6. Récupérez l'URL et la clé `anon` (*Project Settings > API*) dans `.env.local`.
7. Facultatif, pour amorcer la base avec le contenu actuel du dépôt :

```bash
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
npm run seed:content
```

La clé `service_role` contourne les règles de sécurité : elle ne doit **jamais** se retrouver
dans le site ni dans Git.

### Mettre à jour un contenu déjà publié

Le site lit `published_content` : dès qu'une ligne existe, c'est elle qui est affichée, et le
contenu intégré au build n'est plus visible. Après une mise à jour du dépôt, commencez par :

```sql
select lang, version, updated_at from public.published_content order by lang;
```

- **aucune ligne** : rien à faire, le nouveau contenu intégré est déjà affiché ;
- **des lignes** : publiez depuis l'administration (corrigez la rubrique concernée, puis
  *Publier*, en français **puis** en arabe) — ou exécutez le correctif SQL livré avec la mise
  à jour (par exemple `supabase/patch-ena-sept-matieres.sql`) dans le SQL Editor. Un correctif
  ne modifie que les champs annoncés, incrémente `version` et écrit une ligne dans
  `content_revisions` : un retour en arrière reste possible par *Historique > Restaurer*.

## Utilisation

- **Tableau de bord** : trafic, sources et réservations (voir la section dédiée ci-dessous).
- **Langue** : basculez Français / العربية en haut à droite. Chaque langue a son propre
  contenu, son brouillon et son historique.
- **Brouillon** : « Enregistrer le brouillon » conserve votre travail sans le publier.
- **Publier** : envoie le contenu sur le site et crée une version numérotée.
- **Historique** : liste les versions publiées, avec restauration en un clic.
- **Formations** : rubrique *Formations* — ajout, modification, réordonnancement, duplication,
  suppression, icône, mots-clés, badge, mise en avant. Le champ « Sujet du formulaire de
  contact » alimente la liste déroulante du formulaire.

## Tableau de bord : trafic et réservations

L'écran **Tableau de bord** (ouvert par défaut à la connexion) regroupe :

- **Indicateurs** : visites, visiteurs uniques, réservations, taux de conversion,
  avec la variation par rapport à la période précédente ;
- **Trafic quotidien** : histogramme sur 7, 30 ou 90 jours, et jour de pic ;
- **Sources** : Google, Facebook, LinkedIn, WhatsApp, `utm_source` de campagne,
  domaine référant brut, ou « Direct » ;
- **Pages les plus vues** et **langue des visiteurs** (FR / AR) ;
- **Réservations** : chaque demande du formulaire, avec suivi du statut
  (Nouvelle → Contactée → Réservée / Archivée) et **export CSV**.

### Comment les données arrivent

| Donnée | Déclencheur | Table |
| --- | --- | --- |
| Visite | chaque page/section vue sur le site public | `site_pageviews` |
| Réservation | envoi du formulaire de contact | `site_reservations` |

Un **visiteur** est un identifiant aléatoire conservé dans son navigateur : aucune donnée
personnelle n'est collectée (ni adresse IP, ni empreinte, ni cookie tiers). La collecte
échoue toujours en silence : elle ne peut pas casser le site public.

> **Mode local** : sans Supabase, les statistiques proviennent de *votre* navigateur
> uniquement — pratique pour tester, insuffisant en production. L'indicateur
> « Brouillon local » / « En ligne » en bas de la barre latérale le rappelle discrètement.

## Sécurité : ce qui protège réellement les données

Le mot de passe de l'interface n'est qu'un contrôle d'accès côté navigateur. La protection
réelle est côté serveur :

- **Supabase** : les politiques RLS de `supabase/schema.sql` refusent toute écriture
  d'un compte absent de la liste blanche `admin_users` — même un compte authentifié
  créé par un intrus ne peut rien modifier. Les inscriptions publiques doivent être
  désactivées (étape 3 de la mise en place). L'anonyme ne peut que *déposer* une
  visite ou une réservation, dans la limite de tailles maximales ;
- **mode local** : rien n'est partagé, les données restent dans le navigateur.

Mesures intégrées côté interface :

- mot de passe : 8 caractères minimum, 128 maximum, mots de passe triviaux refusés,
  stocké uniquement sous forme de haché **PBKDF2-SHA256** (210 000 itérations, sel
  aléatoire) ; les anciens hachés sont modernisés automatiquement à la connexion ;
- **verrouillage** : après 5 essais erronés, nouvelle tentative refusée 30 s, puis
  1 min, 2 min… (doublement, plafonné à 32 min) — protection contre le devin
  systématique du mot de passe ;
- **session** : fermeture automatique après 12 heures d'inactivité ;
- **formulaire public** : champ piège invisible + délai minimal de remplissage
  contre les robots, longueurs maximales alignées sur la base de données ;
- **en-têtes HTTP** (Netlify / Cloudflare Pages, via `netlify.toml` et `public/_headers`) :
  CSP, anti-clic-transport (`X-Frame-Options: DENY`), `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`. GitHub Pages n'accepte pas d'en-têtes personnalisés : la
  balise `<meta name="referrer">` de `index.html` couvre le minimum là-bas.

Recommandations : mot de passe long, `VITE_ADMIN_PATH` aléatoire, et un seul compte
administrateur créé dans Supabase.

## Développement

```bash
npm run dev            # site + admin sur http://localhost:5173/#/<VITE_ADMIN_PATH>
npm test               # les trois suites (contenu, rendu admin, analytique)
npm run test:store     # couche contenu : magasins, fusion, session, historique
npm run test:admin     # rendu réel des écrans admin et du tableau de bord
npm run test:analytics # calculs analytique, export CSV, magasins local et Supabase
npm run typecheck      # vérification des types
npm run build          # bundle statique dans dist/
```

Le contenu est stocké en **JSON** : les icônes sont des noms (`Scale`, `GraduationCap`…)
résolus par le registre `src/constants/icons.ts`. Un nom inconnu en base retombe sur l'icône
par défaut au lieu de casser la page.
