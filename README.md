# MyAgenda

Bienvenue sur le projet **MyAgenda**.

## Configuration

Pour configurer l'application, vous devez créer un fichier `.env` à la racine du projet. Ce fichier contiendra les variables d'environnement nécessaires pour connecter la base de données.

### Étape 1 : Création du fichier .env

Copiez le fichier `.env.exemple` et renommez-le en `.env` :

```bash
cp .env.exemple .env
```

### Étape 2 : Configuration

#### Pour le développement Local

Dans votre fichier `.env`, utilisez la configuration suivante (assurez-vous d'avoir une base de données MySQL locale lancée) :

```ini
# Configuration Local
DB_NAME=my-agenda-database
DB_USER=root
DB_PASSWORD=root
DB_HOST=localhost
DB_DIALECT=mysql
DB_PORT=3306
PORT=8080
```

#### Pour la Production (Azure)

Si vous déployez sur Azure (Azure Database for MySQL), utilisez cette configuration dans les "Application Settings" de votre App Service ou dans le fichier `.env` si vous testez la connexion distant :

```ini
# Configuration Production Azure
DB_NAME=my-agenda-database
DB_USER=jkvekirniz
DB_PASSWORD=NouveauMotDePasse123!
DB_HOST=my-agenda-server.mysql.database.azure.com
DB_DIALECT=mysql
DB_PORT=3306
PORT=8080
```

> **Note :** Sur Azure App Service, il est recommandé de définir ces variables directement dans l'interface du portail Azure (Configuration > Application settings) plutôt que de commiter un fichier `.env`.

## Lancement avec Docker Compose

Pour lancer la base de données MySQL localement sans installation manuelle, utilisez Docker Compose.

1.  Assurez-vous d'avoir Docker et Docker Compose installés.
2.  Lancez la commande suivante à la racine du projet :

```bash
docker-compose up --build
```

Cela va :
*   Démarrer un conteneur MySQL (accessible sur le port 3307 depuis votre machine).

*Note : La base de données sera automatiquement configurée pour fonctionner avec l'application.*

