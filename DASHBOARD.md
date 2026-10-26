# Dashboard propriétaire

Le code est prêt à être hébergé sur un serveur Node.js 24. Il n'est pas actif sur GitHub Pages. Le site public reste dans `docs`, sans formulaire d'administration. Le dashboard est compilé séparément dans `admin-dist`, non suivi par Git.

## Fonctionnement

- Connexion OAuth GitHub avec `state` signé et PKCE. Aucune permission de dépôt n'est demandée par la connexion.
- Le serveur accepte uniquement l'identifiant GitHub numérique `201839768` (compte `16blo`), y compris si le nom du compte change.
- Session signée, durée d'une heure, cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Chaque écriture exige l'origine exacte et un jeton CSRF. La déconnexion efface le cookie ; une copie volée d'une session reste valide jusqu'à son expiration.
- Un jeton de publication distinct, conservé uniquement sur le serveur, doit être limité au dépôt `16blo/portfolio`, permission **Contents: Read and write**, sans autre permission d'écriture.
- Validation des données et des signatures des fichiers côté serveur ; 5 Mo par fichier, 16 Mo par envoi. Cette vérification ne remplace pas une analyse antivirus et ne supprime pas les métadonnées des documents.
- Publication dans `public/portfolio.json` et `docs/portfolio.json`, avec les pièces jointes référencées, en un seul commit. Aucun push forcé : si le dépôt a changé, la publication est refusée.
- Seules les fiches visibles sont envoyées. Les brouillons restent en mémoire dans la page ; télécharger une sauvegarde avant de recharger ou de se déconnecter. Les brouillons ne sont pas synchronisés entre appareils.
- Les coordonnées personnelles, le CV et la photo restent exclus de cette publication. Vérifier les pièces jointes avant publication : elles deviennent publiques, y compris dans l'historique GitHub. Retirer une fiche ne purge pas les anciens fichiers ni l'historique.

## Activation sur Render

1. Connecter Render à GitHub et créer le service à partir de `render.yaml`. Ne choisir aucun service payant sans accord du propriétaire.
2. Récupérer l'URL HTTPS réelle du service. `RENDER_EXTERNAL_HOSTNAME` fournit automatiquement l'origine ; hors Render, définir `APP_ORIGIN` avec cette URL HTTPS, sans barre finale.
3. Dans GitHub → Settings → Developer settings → OAuth Apps, enregistrer une application personnelle avec cette URL comme Homepage et **cette même URL suivie de `/auth/callback`** comme Authorization callback URL.
4. Dans les variables secrètes du service Render, renseigner `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`. Ne jamais les envoyer dans un chat ni les enregistrer dans le dépôt.
5. Créer un personal access token **fine-grained**, avec expiration, propriétaire `16blo`, dépôt sélectionné **portfolio uniquement**, et Contents en lecture/écriture. Le placer dans `GITHUB_CONTENT_TOKEN` sur Render. Il est distinct du jeton utilisé par ChatGPT et ne doit pas être partagé dans un chat. Si le jeton expire, le remplacer dans Render.
6. `SESSION_SECRET` est généré par Render ; hors Render, utiliser un secret de 32 octets aléatoires, encodé sur au moins 43 caractères (le générateur Render convient). Le serveur reste fermé tant que sa configuration est incomplète.
7. Déployer, tester la connexion propriétaire, vérifier le refus d'un autre compte puis publier une vraie fiche et contrôler le résultat sur GitHub Pages. Ne pas annoncer l'activation avant ces vérifications.

La création de l'application et des identifiants doit être effectuée par le propriétaire dans les interfaces sécurisées. L'URL finale du dashboard sera ajoutée au portfolio uniquement après activation vérifiée.

## Commandes

```sh
npm ci
npm run build:admin
npm run test:admin
npm run start:admin
```

Les variables serveur se définissent dans l'hébergeur. Aucun `.env` n'est nécessaire. L'interface n'utilise aucun jeton dans le navigateur, aucune clé dans `localStorage` et aucun mot de passe à inventer. La connexion GitHub doit conserver la double authentification du compte.

## Vérifications

`npm run test:admin` vérifie notamment les sessions falsifiées et expirées, l'identité propriétaire, les requêtes sans connexion, l'origine et le CSRF, l'état OAuth et PKCE, la déconnexion, les chemins sensibles et le verrouillage sans configuration. Les tests ne remplacent pas une validation du parcours OAuth réel après déploiement.
