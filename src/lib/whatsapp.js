import { formatMoney, periodLabel } from "./dates";

export function lienRappelWhatsApp({ locataire, logement, periode, jours }) {
  const tel = (locataire.telephone || "").replace(/[^\d+]/g, "");
  const delai = jours > 0 ? `dans ${jours} jour${jours > 1 ? "s" : ""}` : "aujourd'hui";
  const message =
    `Bonjour ${locataire.nom}, ceci est un rappel amical : le loyer de ${formatMoney(logement.loyer)} ` +
    `pour ${logement.nom} (${periodLabel(periode)}) est à régler ${delai}. Merci !`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${tel.replace("+", "")}?text=${encoded}`;
}
