# Portfolio de Tehua Yann Ivann

Le portfolio complet, avec son code source et une version **déjà compilée pour GitHub Pages**. Le design, les quatre projets, les onze formations et certifications et le parcours sont inclus.

Site en ligne : https://16blo.github.io/portfolio/

Les coordonnées personnelles (e-mail, téléphone et adresse) sont absentes du site et de ses fichiers publics. La photo et le CV ne sont pas publiés. Le contact se fait par LinkedIn. Le CV nettoyé est conservé séparément dans l’archive privée remise au propriétaire.

## Mettre le site en ligne sans terminal

1. Décompresse `portfolio-tehua-yann-ivann-github.zip` sur ton ordinateur.
2. Sur [GitHub](https://github.com/new), crée un dépôt nommé `portfolio`. Choisis **Public**, ajoute un README pour initialiser le dépôt, puis clique sur **Create repository**.
3. Dans ce dépôt, choisis **Add file → Upload files**. Glisse **le contenu du dossier décompressé** : `docs`, `public`, `src`, les fichiers `package…`, etc. Le dossier `docs` doit apparaître directement à la racine du dépôt, sans dossier parent supplémentaire. Valide avec **Commit changes**.
4. Ouvre **Settings → Pages**. Sous **Build and deployment**, sélectionne **Deploy from a branch**, puis **main** et **/docs**. Clique sur **Save**.
5. Attends la fin de la publication. Le lien indiqué dans cette page sera de la forme `https://16blo.github.io/portfolio/`. Clique sur **Visit site** pour le vérifier et partage ce lien.

Tu n’as pas besoin de Node.js pour cette première publication : les fichiers prêts à héberger sont dans `docs`. Ne sélectionne pas `/ (root)` comme dossier de publication : le fichier HTML à la racine est une entrée de développement.

GitHub Pages peut prendre quelques minutes à publier les changements. Le dépôt et le site sont deux adresses différentes : partage l’adresse `github.io` pour montrer le portfolio.

## Ajouter des projets et certificats : atelier local uniquement

L’atelier a été retiré du site public. Pour utiliser les formulaires sur ton ordinateur :

1. Ouvre le projet dans VSCodium et lance `npm ci`, puis `npm run dev`.
2. Ouvre l’adresse locale affichée par Vite, puis `/editeur.html` sur cette adresse.
3. Prépare tes fiches, sauvegarde-les et vérifie leur aperçu local.
4. Exporte la mise à jour pour GitHub et décompresse le ZIP.
5. Connecte-toi à ton compte GitHub autorisé, dépose les dossiers `docs` et `public` dans le dépôt et valide avec « Commit changes ».

Les visiteurs du site ne disposent d’aucun formulaire de modification. Le code et les données publiées restent lisibles car le dépôt est public ; cela ne confère aucun droit de publication.

Conserve tes sauvegardes privées sur ton appareil, en dehors du dépôt public. L’atelier ne contient aucun mot de passe ni jeton GitHub. Il conserve les préparations dans le navigateur de ton ordinateur et exclut les brouillons de l’export public.

## Connexion et sécurité

Le bouton **Accès propriétaire · GitHub** mène à la publication sur GitHub. La connexion, la session et les droits d’écriture sont vérifiés par GitHub sur ses serveurs. Aucun formulaire du portfolio ne demande ton mot de passe ou un jeton GitHub. Si tu es déjà connecté à GitHub, il peut ne pas te redemander de mot de passe.

L’atelier est uniquement accessible sur le serveur de développement local, pas sur GitHub Pages. Il est exclu de la compilation publique. Le bouton « Accès propriétaire · GitHub » ne donne pas de droits : GitHub vérifie la connexion et l’autorisation d’écriture.

Le site publié charge seulement ses scripts et ses données depuis sa propre origine. La politique CSP bloque les scripts en ligne, les scripts externes, les objets embarqués et les envois de formulaires. Les pièces jointes sont limitées en taille et leur signature est vérifiée lors de l’ajout et de l’import. Les textes sont rendus par React sans insertion de HTML arbitraire.

Protège ton compte GitHub par une passkey ou la double authentification. N’ajoute un collaborateur que s’il doit réellement pouvoir publier. Les sauvegardes privées ne sont pas chiffrées : conserve-les sur ton appareil personnel, en dehors du dépôt public.

Le détail de la revue et ses limites se trouvent dans [SECURITE.md](SECURITE.md).

## Travailler sur le code avec VSCodium

Installe Node.js 22.13 ou une version plus récente, ouvre ce dossier dans VSCodium, puis lance :

```sh
npm ci
npm run dev
```

Ouvre l’adresse affichée par Vite. Pour vérifier les types et régénérer les fichiers publiés après une modification du design :

```sh
npm run build
```

Cette commande remplace `docs` à partir du code et de `public`. Envoie ensuite les fichiers modifiés sur GitHub. Le fichier `package-lock.json` fixe les versions des dépendances.

Si tu utilises Git en ligne de commande après avoir créé ton dépôt :

```sh
git init -b main
git add .
git commit -m "Ajouter mon portfolio"
git remote add origin https://github.com/16blo/portfolio.git
git push -u origin main
```

`16blo` est le compte propriétaire de ce dépôt. Si le dépôt contient déjà des fichiers ou des commits, clone-le d’abord et copie ce dossier dedans pour conserver son historique.

## Où se trouve chaque élément ?

| Élément | Fichier ou dossier |
| --- | --- |
| Site prêt à héberger | `docs/` |
| Contenu de référence : profil, projets, certifications, parcours, compétences | `public/portfolio.json` |
| Contenu actuellement publié | `docs/portfolio.json` |
| Photo, CV, pièces jointes | `public/images`, `public/cv`, `public/uploads` et leurs copies dans `docs` |
| Interface du portfolio | `src/portfolio.tsx` |
| Styles, thèmes clair et sombre, version mobile | `src/style.css` |
| Atelier local, absent du site public | `src/editor.tsx`, `src/editor-main.tsx`, `editeur.html` |
| Sauvegarde locale et import | `src/workspace.ts` |
| Export ZIP pour GitHub | `src/zip.ts` |
| Validation du contenu et filtrage des brouillons | `src/validation.ts` |
| Compilation et chemins relatifs | `vite.config.ts` |

Pour ajouter une étape de parcours ou modifier les compétences, édite `public/portfolio.json`, puis lance `npm run build`. Pour ces deux sections, les champs ne sont pas encore exposés dans les formulaires de l’atelier.

## Choix techniques

React, TypeScript, Vite et Lucide. Le portfolio charge un fichier JSON ; les liens locaux utilisent des chemins relatifs compatibles avec un dépôt `portfolio` ou un domaine GitHub Pages à la racine. Les thèmes, les filtres, les fiches détaillées, la recherche et le menu mobile fonctionnent sans serveur applicatif. Le téléchargement du CV est désactivé dans la version publique actuelle.

Cette version a été adaptée à GitHub Pages à partir du portfolio initial. L’ancien stockage serveur et la connexion ChatGPT ont été remplacés par une préparation locale et un export de fichiers. Aucun compte ChatGPT, base de données, clé API ou jeton GitHub n’est requis pour visiter le site.

## Documentation officielle

- [Présentation de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Choisir la branche et le dossier de publication](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Créer un site GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

Le contenu personnel appartient à Tehua Yann Ivann. Les bibliothèques utilisées conservent leurs licences respectives.
