# MonLoyer — MVP

Gérez vos loyers en toute simplicité. Application de gestion locative pour les petits propriétaires (2 à 20 logements), pensée pour la Côte d'Ivoire et l'Afrique francophone.

## Fonctionnalités du MVP

- **Compte propriétaire** (local à l'appareil, sans mot de passe pour cette V1)
- **Immeubles & logements** : création, modification, suppression
- **Locataires** : rattachement à un logement, téléphone pour les rappels
- **Tableau de bord** : revenus du mois, revenu potentiel, impayés, échéances à venir (5 jours)
- **Alertes d'échéance** avec bouton de rappel **WhatsApp** pré-rempli
- **Paiements** : enregistrement + génération automatique d'un **reçu PDF** téléchargeable
- **Historique des paiements** par locataire
- **Sauvegarde / restauration** des données (export-import JSON), car tout est stocké **localement** dans le navigateur (aucune donnée envoyée à un serveur — adapté à une connexion limitée et à la confidentialité)

## Ce qui n'est PAS dans ce MVP (prévu en V2/V3)

- Paiement réel par Mobile Money (le bouton WhatsApp ouvre juste un message pré-rempli, il n'envoie rien automatiquement)
- Envoi automatique de SMS (nécessite une passerelle SMS payante à intégrer plus tard)
- Espace locataire séparé, signature électronique, gestion des cautions, multi-utilisateurs

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre ensuite `http://localhost:5173`.

## Déployer sur Netlify (comme pour Lueur)

1. Créer un nouveau dépôt GitHub (ex. `monloyer-app`) et y pousser ce dossier.
2. Sur Netlify : **Add new site → Import an existing project → GitHub** → choisir le dépôt.
3. Netlify détecte automatiquement `netlify.toml` (commande `npm run build`, dossier `dist`, `NODE_VERSION=20`).
4. Cliquer sur **Deploy**.

```bash
git init
git add .
git commit -m "MonLoyer MVP"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/monloyer-app.git
git push -u origin main
```

## Sauvegarder ses données

Le stockage est local à l'appareil et au navigateur utilisé. Pense à faire un export régulier :
**Paramètres → Télécharger une sauvegarde**. En cas de changement de téléphone ou de navigateur,
utilise **Paramètres → Importer une sauvegarde** pour tout récupérer.
