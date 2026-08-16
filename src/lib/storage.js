// Toutes les données restent sur l'appareil du propriétaire (localStorage).
// Aucune donnée n'est envoyée à un serveur : adapté à une connexion limitée
// et à la confidentialité des informations locatives.

const KEY = "monloyer_v1";

const emptyState = {
  proprietaire: null, // { nom, telephone, entreprise }
  immeubles: [], // { id, nom, adresse }
  logements: [], // { id, immeubleId, nom, loyer, jourEcheance }
  locataires: [], // { id, logementId, nom, telephone }
  paiements: [], // { id, locataireId, periode: 'YYYY-MM', montant, date, methode }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...emptyState };
    const parsed = JSON.parse(raw);
    return { ...emptyState, ...parsed };
  } catch (e) {
    console.error("Erreur de lecture des données locales", e);
    return { ...emptyState };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Erreur d'enregistrement des données locales", e);
  }
}

export function exportBackup(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `monloyer-sauvegarde-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      onDone({ ...emptyState, ...parsed });
    } catch (e) {
      onDone(null, e);
    }
  };
  reader.readAsText(file);
}
