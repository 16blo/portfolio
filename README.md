# Portfolio de Tehua Yann Ivann

Le portfolio complet, avec son code source et une version **déjà compilée pour GitHub Pages**. Le design, les quatre projets, les onze formations et certifications, le parcours, la photo et le CV sont inclus.

## Mettre le site en ligne sans terminal

1. Décompresse `portfolio-tehua-yann-ivann-github.zip` sur ton ordinateur.
2. Sur [GitHub](https://github.com/new), crée un dépôt nommé `portfolio`. Choisis **Public**, ajoute un README pour initialiser le dépôt, puis clique sur **Create repository**.
3. Dans ce dépôt, choisis **Add file → Upload files**. Glisse **le contenu du dossier décompressé** : `docs`, `public`, `src`, les fichiers `package…`, etc. Le dossier `docs` doit apparaître directement à la racine du dépôt, sans dossier parent supplémentaire. Valide avec **Commit changes**.
4. Ouvre **Settings → Pages**. Sous **Build and deployment**, sélectionne **Deploy from a branch**, puis **main** et **/docs**. Clique sur **Save**.
5. Attends la fin de la publication. Le lien indiqué dans cette page sera de la forme `https://16blo.github.io/portfolio/`. Clique sur **Visit site** pour le vérifier et partage ce lien.

Tu n’as pas besoin de Node.js pour cette première publication : les fichiers prêts à héberger sont dans `docs`. Ne sélectionne pas `/ (root)` comme dossier de publication : le fichier HTML à la racine est une entrée de développement.

GitHub Pages peut prendre quelques minutes à publier les changements. Le dépôt et le site sont deux adresses différentes : partage l’adresse `github.io` pour montrer le portfolio.

## Ajouter des projets, des certificats ou un nouveau CV

1. Sur ton portfolio publié, clique sur **Préparer une fiche**, en bas de page. L’atelier est aussi accessible à l’adresse `…/portfolio/editeur.html`.
2. Ajoute ou modifie tes fiches. Tu peux joindre une image de projet, une attestation ou un PDF, et remplacer la photo ou le CV dans **Mon profil**. Les pièces jointes acceptées font au maximum 5 Mo chacune.
3. Clique sur **Enregistrer**. La préparation reste dans ce navigateur. **Aperçu de ma préparation** permet de la vérifier.
4. Clique sur **Exporter pour GitHub**. Décompresse `mise-a-jour-portfolio.zip`.
5. Clique sur **Se connecter sur GitHub pour publier** et connecte-toi avec ton compte **16blo**. Dans ton dépôt GitHub, utilise **Add file → Upload files** et dépose les dossiers **docs** et **public** de cette mise à jour à la racine, en conservant leurs noms. Valide avec **Commit changes**. Pages publiera les nouveaux fichiers.

L’export met à jour les données et les pièces jointes des deux dossiers. **Aucune compilation n’est nécessaire pour ces ajouts de contenu.** Le code du design reste en place.

L’atelier ne possède aucun accès à ton compte GitHub. Il prépare une copie dans le navigateur de la personne qui l’ouvre ; seuls les utilisateurs autorisés sur ton dépôt peuvent publier des changements. Il ne s’agit pas d’un espace d’administration connecté à un serveur.

### Sauvegardes et brouillons

**Sauvegarde privée** télécharge un fichier JSON contenant toute la préparation, les pièces jointes ajoutées et les brouillons. **Importer une sauvegarde** permet de la reprendre sur un autre appareil. Garde ce fichier sur ton ordinateur ; ne le dépose pas dans le dépôt public.

Les modifications sont conservées avec IndexedDB dans le navigateur utilisé. Effacer les données du navigateur, utiliser la navigation privée ou changer d’appareil peut les faire perdre. Télécharge ta sauvegarde avant de changer d’appareil.

Les fiches décochées **Visible** et leurs nouvelles pièces jointes sont exclues de l’export de publication. Un fichier déjà publié peut rester dans le dépôt et dans son historique : le passer ensuite en brouillon ne rend pas rétroactivement ce fichier privé.

## Connexion et sécurité

Le bouton **Accès propriétaire · GitHub** mène à la publication sur GitHub. La connexion, la session et les droits d’écriture sont vérifiés par GitHub sur ses serveurs. Aucun formulaire du portfolio ne demande ton mot de passe ou un jeton GitHub. Si tu es déjà connecté à GitHub, il peut ne pas te redemander de mot de passe.

L’atelier reste un outil de préparation locale accessible publiquement. L’ouvrir ne donne aucun droit de publication. Chaque visiteur prépare sa propre copie ; il ne peut pas modifier le site de Yann sans droit d’écriture sur le dépôt.

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

Remplace `16blo` par ton vrai identifiant. Si le dépôt contient déjà des fichiers ou des commits, clone-le d’abord et copie ce dossier dedans pour conserver son historique.

## Où se trouve chaque élément ?

| Élément | Fichier ou dossier |
| --- | --- |
| Site prêt à héberger | `docs/` |
| Contenu de référence : profil, projets, certifications, parcours, compétences | `public/portfolio.json` |
| Contenu actuellement publié | `docs/portfolio.json` |
| Photo, CV, pièces jointes | `public/images`, `public/cv`, `public/uploads` et leurs copies dans `docs` |
| Interface du portfolio | `src/portfolio.tsx` |
| Styles, thèmes clair et sombre, version mobile | `src/style.css` |
| Atelier de mise à jour | `src/editor.tsx` |
| Sauvegarde locale et import | `src/workspace.ts` |
| Export ZIP pour GitHub | `src/zip.ts` |
| Validation du contenu et filtrage des brouillons | `src/validation.ts` |
| Compilation et chemins relatifs | `vite.config.ts` |

Pour ajouter une étape de parcours ou modifier les compétences, édite `public/portfolio.json`, puis lance `npm run build`. Pour ces deux sections, les champs ne sont pas encore exposés dans les formulaires de l’atelier.

## Choix techniques

React, TypeScript, Vite et Lucide. Le portfolio charge un fichier JSON ; les liens locaux utilisent des chemins relatifs compatibles avec un dépôt `portfolio` ou un domaine GitHub Pages à la racine. Les thèmes, les filtres, les fiches détaillées, la recherche, le menu mobile et le téléchargement du CV fonctionnent sans serveur applicatif.

Cette version a été adaptée à GitHub Pages à partir du portfolio initial. L’ancien stockage serveur et la connexion ChatGPT ont été remplacés par une préparation locale et un export de fichiers. Aucun compte ChatGPT, base de données, clé API ou jeton GitHub n’est requis pour visiter le site.

## Documentation officielle

- [Présentation de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Choisir la branche et le dossier de publication](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Créer un site GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

Le contenu personnel appartient à Tehua Yann Ivann. Les bibliothèques utilisées conservent leurs licences respectives.
