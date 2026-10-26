# Maintenance du portfolio

## Développement local

Node.js 22.13 ou plus récent est nécessaire.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse locale indiquée par Vite.

## Ajouter ou modifier une fiche

L’atelier de préparation est disponible **uniquement en local**, au chemin `/editeur.html` de l’adresse affichée par Vite. Il n’est pas publié sur GitHub Pages.

1. Ajouter les projets ou certifications dans les formulaires.
2. Vérifier l’aperçu et conserver une sauvegarde locale.
3. Utiliser « Exporter pour GitHub » et décompresser le ZIP.
4. Se connecter à un compte autorisé sur ce dépôt.
5. Déposer les dossiers `docs` et `public` de la mise à jour à la racine du dépôt, puis valider le commit.

Les données peuvent également être modifiées dans `public/portfolio.json`. Pour une modification sans compilation, reporter les mêmes changements dans `docs/portfolio.json`.

## Modifier le site et compiler

```sh
npm run build
npm test
```

La compilation produit le site de consultation dans `docs`. Elle exclut l’atelier local et le stockage des préparations. Publier le code modifié et le dossier compilé après vérification.

## Hébergement

GitHub Pages utilise la branche `main` et le dossier `/docs`, avec HTTPS.

## Organisation

| Emplacement | Rôle |
| --- | --- |
| `src/portfolio.tsx`, `src/main.tsx` | Interface publique |
| `src/style.css` | Styles, thèmes et mise en page |
| `public/portfolio.json` | Données de référence |
| `docs/` | Site compilé et données publiées |
| `editeur.html`, `src/editor-main.tsx`, `src/editor.tsx` | Atelier local |
| `src/workspace.ts`, `src/zip.ts` | Sauvegardes et export des mises à jour |
| `src/validation.ts`, `src/assets.ts` | Validation du contenu et des fichiers |

## Confidentialité et publication

Les coordonnées personnelles ne doivent pas être ajoutées aux données publiques. Les sauvegardes privées et documents contenant des coordonnées restent en dehors du dépôt.

Un visiteur ne peut pas modifier le site publié depuis le portfolio. La publication exige une connexion GitHub et des droits d’écriture sur le dépôt. Les fichiers publics et leur historique restent consultables.

Les pièces jointes acceptées par l’atelier sont les images PNG, JPEG et WebP et les PDF, avec une limite de 5 Mo par fichier. Vérifier leur contenu avant toute publication.

Le détail technique des protections se trouve dans [SECURITE.md](SECURITE.md).

## Fichiers locaux et secrets

Aucun fichier `.env` ni aucune clé API n’est nécessaire au fonctionnement de ce portfolio. Le chargement des fichiers d’environnement et l’exposition des variables personnalisées dans Vite sont désactivés.

Les fichiers `.env*`, clés privées, identifiants locaux, bases et sauvegardes sont exclus du suivi Git. Ils ne doivent jamais être placés dans `public` ou `docs`.

`npm run security:files` inspecte les fichiers suivis et le contenu des dossiers publics. Cette vérification s’exécute aussi avant `npm run build`. Sur GitHub, le workflow de sécurité examine les fichiers et l’historique à chaque push ou proposition de modification, avec des permissions en lecture seule.

Une règle `.gitignore` ne retire pas un secret déjà publié. Si une clé est exposée, la révoquer auprès du fournisseur, la remplacer et traiter l’historique. Le contrôle reconnaît certains formats de secrets ; il ne garantit pas la détection de tout contenu confidentiel. Un contrôle CI intervient après un envoi et ne remplace pas la vigilance avant publication.

## Dashboard avec connexion GitHub

Un dashboard serveur est préparé dans `admin.html`, `src/admin-main.tsx` et `server/`. Il est séparé du site public et de l'atelier local. Son activation et ses limites sont décrites dans [DASHBOARD.md](DASHBOARD.md). Il ne faut pas publier `editeur.html` sur GitHub Pages pour l'activer.
