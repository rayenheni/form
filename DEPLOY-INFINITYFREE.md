# Héberger le site sur InfinityFree

Guide pas à pas pour publier **Forma Business Lex** sur InfinityFree (hébergement
mutualisé Apache + PHP). Le site est une application React **compilée en une seule
page statique** : aucune base de données locale, aucun PHP, aucun Node.js côté serveur.
InfinityFree convient donc parfaitement — à condition de compiler **sur votre machine**
(ou via GitHub), car InfinityFree **n'exécute pas Node.js**.

---

## 1. Comment ça marche

```
votre machine (Node 22)                  InfinityFree (Apache)
┌──────────────────────────┐            ┌──────────────────────┐
│ npm ci                   │            │ htdocs/              │
│ npm run build:hosting    │  ── FTP ──▶│   index.html  830 Ko │
│   → dist/index.html      │            │   .htaccess          │
│   → dist/.htaccess       │            └──────────────────────┘
└──────────────────────────┘
```

`index.html` contient **tout** le CSS, tout le JavaScript et tout le contenu du site
(français + arabe). Il n'y a donc aucun fichier `assets/` à téléverser, et aucune
configuration serveur particulière : l'administration utilise des adresses de la forme
`…/#/admin-fbl`, qui ne dépendent pas du serveur.

| Élément | Sur InfinityFree |
|---|---|
| PHP / MySQL | inutiles ici (le site ne les utilise pas) |
| Node.js | **non disponible** → compiler avant d'envoyer |
| `.htaccess` | supporté (cache, en-têtes, redirection HTTPS) |
| SSL | gratuit (Let's Encrypt), à activer dans cPanel |
| Envoi de fichiers | File Manager du cPanel ou FTP (FileZilla) |

---

## 2. Compiler le site

### 2.1 Sur votre ordinateur

Prérequis : [Node.js 22](https://nodejs.org) (version LTS).

```bash
git clone https://github.com/rayenheni/form.git
cd form
npm ci
npm run build:hosting
```

La commande produit `dist/index.html` + `dist/.htaccess`, puis affiche un **rapport de
contrôle** : build mono-fichier, présence de Supabase, chemin d'admin, taille, fichiers à
déposer. Si un point est rouge, corrigez avant de téléverser.

### 2.2 Activer l'administration en ligne (optionnel mais recommandé)

Sans configuration, le site s'affiche **très bien** (contenu intégré au build, sept
matières ENA incluses), mais l'administration travaille en **mode local** : « Publier »
n'enregistre que dans *votre* navigateur.

Pour que les publications soient réellement visibles par tous, créez un fichier
`.env.local` à la racine du projet (il n'est jamais envoyé sur Git) :

```ini
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_ADMIN_PATH=admin-fbl-un-chemin-long-et-aleatoire
```

Puis relancez `npm run build:hosting`. Les variables `VITE_*` sont **gravées dans le
fichier au moment de la compilation** : les modifier après coup n'a aucun effet, il faut
recompiler.

> Équivalent en ligne de commande, si vous préférez ne rien écrire sur le disque :
>
> **macOS / Linux**
> ```bash
> VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… VITE_ADMIN_PATH=… npm run build:hosting
> ```
> **Windows PowerShell**
> ```powershell
> $env:VITE_SUPABASE_URL="https://xxxx.supabase.co"
> $env:VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
> $env:VITE_ADMIN_PATH="admin-fbl-un-chemin-long"
> npm run build:hosting
> ```

### 2.3 Sans Node.js sur votre poste

Laissez GitHub compiler :

1. onglet **Actions** → workflow **Deploy to GitHub Pages** → dernier run réussi ;
2. en bas de la page, section **Artifacts** → télécharger **github-pages** ;
3. dézipper : vous obtenez `index.html` (+ `.htaccess` selon la version de `main`).

---

## 3. Créer le compte et le domaine

1. Créez un compte sur [infinityfree.com](https://infinityfree.com) et validez l'e-mail.
2. **Create Account** → choisissez un sous-domaine gratuit (`votre-nom.infinityfreeapp.com`
   ou `infinityfree.com`, `rf.gd`, `wuaze.com`…) **ou** un domaine que vous possédez.
3. Attendez l'activation (généralement quelques minutes ; la propagation DNS peut prendre
   jusqu'à 72 h pour un domaine externe).
4. Notez les informations FTP affichées dans le cPanel :
   - **hôte** : `ftpupload.net`
   - **port** : `21`
   - **identifiant** : du type `epiz_XXXXXXXX`
   - **mot de passe** : celui du compte cPanel

---

## 4. Téléverser les fichiers

### Option A — File Manager (aucun logiciel)

1. cPanel → **Online File Manager** (ou *Files → File Manager*).
2. Ouvrir le dossier **`htdocs/`** — c'est la racine publique du site.
3. Supprimer les fichiers par défaut (`index2.html`, `default.php`…) s'il y en a.
4. **Upload** → sélectionner `dist/index.html` → attendre la fin du transfert.
5. Activer l'affichage des fichiers cachés (icône ⚙ → *Show hidden files*), puis envoyer
   également `dist/.htaccess`.

### Option B — FTP (FileZilla, recommandé pour les mises à jour)

| Champ | Valeur |
|---|---|
| Hôte | `ftpupload.net` |
| Port | `21` |
| Chiffrement | *Use explicit FTP over TLS if available* |
| Identifiant | `epiz_XXXXXXXX` |
| Mot de passe | mot de passe cPanel |

Glissez `index.html` et `.htaccess` dans **`htdocs/`**, en remplaçant les fichiers existants.

> `.htaccess` commence par un point : de nombreux gestionnaires de fichiers le cachent.
> Sans lui, le site fonctionne quand même, mais `index.html` peut rester en cache chez les
> visiteurs (tout le site est dans ce seul fichier).

---

## 5. Activer le HTTPS

1. cPanel → **SSL Certificates** (ou *Let's Encrypt SSL*).
2. Émettre le certificat gratuit pour votre domaine, puis attendre l'état *active*.
3. Ouvrir `.htaccess` (File Manager → *Edit*) et **décommenter** le bloc HTTPS :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
</IfModule>
```

> Ne l'activez qu'**après** l'émission du certificat : avant, la redirection peut créer
> une boucle si SSL n'est pas encore prêt.

---

## 6. Vérifier la mise en ligne

1. Ouvrez `https://votre-sous-domaine.infinityfreeapp.com/`.
2. Rechargez avec **Ctrl/Cmd + Maj + R** (le navigateur garde volontiers l'ancien fichier).
3. Contrôlez trois points :
   - l'onglet **Concours ENA** affiche bien les **sept matières** ;
   - le sélecteur de langue FR / **العربية** fonctionne ;
   - l'administration répond sur `…/#/<VITE_ADMIN_PATH>` (ou `…/#/admin-fbl` par défaut).

Si Supabase est configuré, l'écran de connexion de l'administration demande
**e-mail + mot de passe**. S'il ne demande qu'un mot de passe, le build est en mode local.

---

## 7. Mettre le site à jour

InfinityFree ne se connecte pas à GitHub : chaque modification doit être recompilée puis
renvoyée.

```bash
git pull
npm ci                 # seulement si les dépendances ont changé
npm run build:hosting
```

Puis remplacez `htdocs/index.html` (et `.htaccess` s'il a changé) par les nouveaux
fichiers. C'est la seule contrainte de cet hébergement ; un hébergement connecté à Git
(Cloudflare Pages, Netlify) publie automatiquement.

---

## 8. Limites d'InfinityFree à connaître

| Limite | Conséquence pour ce site |
|---|---|
| **Pas de Node.js** | compilation obligatoire en local ou via GitHub Actions |
| **Challenge anti-bot `aes.js`** (`?i=1`, cookie `__test`) | imposé à tous les comptes gratuits : il exige JavaScript et les cookies. Le site s'affiche normalement, mais la **première** requête de statistiques peut être retardée ou refusée. La collecte échoue toujours en silence : le site ne casse pas. |
| **En-têtes personnalisés limités** | `netlify.toml` et `public/_headers` sont ignorés ; `.htaccess` couvre le minimum (anti-cache, `nosniff`, `Referrer-Policy`). La CSP complète n'est pas garantie. |
| **Taille d'upload** | ~10 Mo par fichier : `index.html` fait ~830 Ko, aucun souci. |
| **Inodes** | 30 000 maximum : ce site n'en utilise que deux. |
| **Pas d'e-mail** | le formulaire de contact n'envoie pas de mail par lui-même : il enregistre la demande dans Supabase (table `site_reservations`) ou ouvre la messagerie du visiteur. |
| **Sans SSH ni cron** | pas de sauvegarde automatique : conservez une copie de `index.html` et exportez `published_content` depuis Supabase. |

### Le challenge anti-bot peut-il gêner les visiteurs ?

En pratique, un visiteur avec un navigateur normal ne voit rien : la vérification est
transparente (redirection invisible `?i=1`). Le risque existe pour les scripts, les
prévisualisations de liens (WhatsApp, Facebook) et certains robots.

---

## 9. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Page blanche, code HTML visible | fichier envoyé en `.txt` ou mauvais dossier | vérifier `htdocs/index.html` (nom exact, minuscules) |
| « This site requires Javascript » en boucle | challenge `aes.js` + cookies bloqués | autoriser les cookies pour le domaine, désactiver un bloqueur agressif |
| Ancien contenu affiché | cache navigateur ou `index.html` non remplacé | `Ctrl+Maj+R`, vérifier la date du fichier dans File Manager |
| Les 7 matières n'apparaissent pas | ancien fichier encore en ligne, ou base Supabase prioritaire | comparer la taille de `index.html` (~830 Ko) ; si Supabase est configuré, vérifier `select * from published_content` |
| L'admin ne publie rien | build sans `VITE_SUPABASE_*` (mode local) | recompiler avec `.env.local`, renvoyer `index.html` |
| Erreur 403 à l'ouverture du site | fichiers/dossier avec permissions incorrectes | dossiers `755`, fichiers `644` |
| Le certificat SSL reste « pending » | validation DNS en cours | attendre, puis relancer l'émission |

---

## 10. Alternative recommandée

Pour un site vitrine, **Cloudflare Pages** ou **Netlify** offrent gratuitement HTTPS,
déploiement automatique à chaque `push`, aucun challenge anti-bot et des en-têtes de
sécurité réels — sans compilation manuelle. InfinityFree reste un bon choix si vous voulez
un hébergement de type cPanel, une adresse gratuite propre, ou si vous gérez déjà plusieurs
sites sur ce compte.

Dans les deux cas, la configuration du projet est déjà prête :

- `netlify.toml` + `public/_headers` → Netlify / Cloudflare Pages ;
- `.github/workflows/deploy-pages.yml` → GitHub Pages ;
- `public/.htaccess` + ce guide → InfinityFree et tout Apache mutualisé.
