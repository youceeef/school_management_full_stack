🎓 API de Gestion Scolaire - Laravel

API RESTful basée sur Laravel pour la gestion des ressources scolaires. Ce projet constitue le backend d'un portail de gestion scolaire, développé comme projet de fin d'études.

📝 À propos du projet

Cette API fournit les fonctionnalités suivantes :

Authentification : Élèves, enseignants, responsables de laboratoire et administrateurs

Documents : Téléversement, téléchargement, consultation et suppression

Réservations : Création, approbation, rejet et historique des réservations

Gestion des permissions : Rôles et accès hiérarchisés

Infrastructure : Gestion des salles et équipements

Notifications : Notifications en temps réel

🚀 Installation

Clonez le projet et installez les dépendances :

# Cloner le dépôt

git clone https://github.com/votre-utilisateur/votre-repo.git
cd votre-repo

# Installer les dépendances backend

composer install

# Installer les dépendances frontend (si applicable)

npm install

# Configuration de l'environnement

cp .env.example .env
php artisan key:generate

# Migration des tables de la base de données

php artisan migrate

# Lancer le serveur local

php artisan serve

## Déploiement de production

Le service Render est géré par le Blueprint racine `render.yaml`. Il suit la
branche `main`, mais `autoDeployTrigger` est volontairement `off` (D015) : le
déploiement de l'API reste une action explicite de l'opérateur sur le SHA
approuvé, effectuée après la réussite des contrôles CI.

Après convergence de Vercel et Render, le workflow Production Smoke est lancé
manuellement; il reste également planifié chaque jour pour détecter une dérive.

### Vérification d'un déploiement

Contrôlez l'image réellement servie avant de lancer la recette authentifiée :

    curl -s https://eduspace-api-dhn4.onrender.com/health
    git rev-parse HEAD

`version` doit correspondre au commit déployé, `build_time` doit être postérieur
au dernier changement du backend, et les contrôles `database`, `profile_storage`
et `document_storage` doivent répondre `ok`.

### Règle de parité des versions

Vercel reconstruit le frontend à chaque push sur `main`, alors que l'API n'est
plus déployée automatiquement (D015). Après chaque release, déployez donc
explicitement le SHA de `main` sur Render : c'est le seul moyen de conserver des
SHA identiques côté frontend et API, condition exigée par le workflow Production
Smoke.
