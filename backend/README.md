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
