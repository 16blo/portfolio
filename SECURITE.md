# Revue de sécurité du portfolio

Revue du 25 octobre 2026. Périmètre : code du site statique, préparation locale, import de sauvegardes et export des fichiers de publication. Ce document décrit les protections effectivement présentes ; il ne constitue pas une certification ni un audit de l’infrastructure GitHub.

## Qui peut publier ?

Le portfolio est public. **GitHub assure l’authentification et contrôle les droits d’écriture sur le dépôt `16blo/portfolio`.** Le bouton « Accès propriétaire · GitHub » ouvre la page de publication sur le domaine officiel GitHub. Le propriétaire et les éventuels collaborateurs disposant du droit d’écriture peuvent publier. Un visiteur public peut lire le code ou proposer une contribution ; cela ne lui donne pas le droit de modifier la branche publiée.

L’atelier `editeur.html` est un outil de préparation locale, accessible publiquement. Il ne comporte aucun endpoint d’écriture vers le site et ne détient aucun jeton. Modifier sa copie locale ou contourner son interface ne permet donc pas de publier. La vérification des droits a lieu sur les serveurs GitHub, au moment du dépôt des fichiers et de la validation du commit.

Un dépôt public rend son contenu et son historique consultables : aucun secret ni brouillon privé ne doit y être ajouté. Les exportations de publication excluent les fiches en brouillon et leurs nouvelles pièces jointes. Un document déjà publié peut rester dans l’historique même après son retrait du site.

## Corrections apportées

| Point contrôlé | Protection |
| --- | --- |
| Connexion et publication | Passage par `github.com`, avec contrôle des droits par GitHub ; aucune fausse connexion dans le navigateur |
| Mots de passe, jetons et sessions | Aucun mot de passe, jeton personnel, secret OAuth ou cookie d’authentification manipulé par le portfolio |
| Scripts injectés | React rend les textes comme du texte ; pas de `dangerouslySetInnerHTML`. CSP de production : scripts limités à la même origine, sans `unsafe-inline` ni `unsafe-eval` |
| Requêtes réseau | La CSP limite les connexions à la même origine. Aucun service externe ne reçoit les préparations locales |
| Images et documents | PNG, JPEG, WebP et PDF uniquement, 5 Mo maximum par fichier ; signature vérifiée lors de l’ajout et de l’import. SVG et HTML refusés comme pièces jointes |
| Import de sauvegarde | Schéma et limites contrôlés, version vérifiée, chemins relatifs imposés, doublons et incohérences extension/signature refusés |
| Liens | HTTPS requis pour les liens externes ; identifiants et mots de passe intégrés à une URL refusés. Les liens ouvrant un nouvel onglet utilisent `noopener noreferrer` |
| Fuites par le référent | Politique `no-referrer` sur les pages compilées |
| Formulaires et objets embarqués | CSP `form-action 'none'`, `object-src 'none'`, `frame-src 'none'` ; les formulaires de préparation restent traités localement |
| Brouillons et pièces jointes privées | Conservation dans le navigateur et la sauvegarde privée ; exclusion de l’export public |

Les styles en ligne restent autorisés pour le rendu de l’interface. L’autorisation ne s’étend pas aux scripts en ligne. La CSP est injectée dans les pages de production compilées ; le serveur Vite de développement utilise son propre fonctionnement de rechargement.

## Limites à connaître

- La connexion s’effectue sur GitHub. Le portfolio n’a pas sa propre session utilisateur et n’enregistre pas les ajouts directement sur un serveur.
- La préparation IndexedDB et le fichier de sauvegarde privée ne sont pas chiffrés par l’application. Utilise ton appareil personnel et conserve les sauvegardes en dehors du dépôt.
- Le contrôle de signature détecte le format d’une pièce jointe ; il ne remplace pas un antivirus ni une analyse complète des PDF. Publie des documents de confiance.
- GitHub Pages contrôle les en-têtes HTTP. Une directive `frame-ancestors` ne fonctionne pas dans une balise meta ; ce projet ne prétend donc pas imposer une protection complète contre l’intégration dans un iframe.
- La sécurité de publication dépend aussi du compte GitHub, de ses collaborateurs, de ses clés et des applications auxquelles il donne accès. Une passkey ou la double authentification est recommandée. Aucun paramètre de sécurité de ton compte n’a été modifié automatiquement.

## Résultat des contrôles locaux

La compilation TypeScript et Vite a réussi. Les 14 tests de sécurité ont réussi. La dépendance Zod a été mise à jour de 3.25.76 à 4.6.7 pour corriger l’avis [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).

L’outil de compilation Vite a également été mis à jour de 8.0.13 à 8.3.5 après le signalement de son ancienne version par npm audit.

L’analyse finale `npm audit` ne signale aucune vulnérabilité connue, y compris dans les dépendances de développement, au moment de cette vérification. Les formulaires ont aussi été vérifiés dans le navigateur avec la politique CSP de production active.

## Vérifications reproductibles

```sh
npm ci
npm test
npm run build
npm audit --omit=dev
```

Les tests couvrent les liens dangereux, les chemins de fichiers, les imports falsifiés, le rendu des textes, les brouillons et les protections présentes dans le résultat compilé. La connexion réelle et l’activation de GitHub Pages doivent aussi être vérifiées sur GitHub après la création du dépôt.

## Références

- [Permissions d’un dépôt personnel](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository)
- [Double authentification GitHub](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication)
- [HTTPS pour GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)
- [Limite de frame-ancestors dans une balise meta](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
