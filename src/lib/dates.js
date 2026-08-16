export const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function currentPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function periodLabel(periode) {
  const [y, m] = periode.split("-").map(Number);
  return `${MOIS[m - 1]} ${y}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatMoney(n) {
  // Formatage manuel avec espace normal (U+0020) plutôt que l'espace fine
  // insécable utilisée par Intl.NumberFormat("fr-FR"), que la police du PDF
  // (helvetica/WinAnsi) n'affiche pas correctement.
  const rounded = Math.round(n || 0);
  const withSpaces = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return withSpaces + " FCFA";
}

// Nombre de jours avant la prochaine échéance (jourEcheance = jour du mois, 1-28)
export function joursAvantEcheance(jourEcheance, today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  let echeance = new Date(year, month, jourEcheance);
  if (echeance < new Date(year, month, today.getDate())) {
    echeance = new Date(year, month + 1, jourEcheance);
  }
  const diff = Math.ceil((echeance - today) / (1000 * 60 * 60 * 24));
  return diff;
}
