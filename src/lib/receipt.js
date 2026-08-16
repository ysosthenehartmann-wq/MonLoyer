import { jsPDF } from "jspdf";
import { formatMoney, periodLabel, formatDate } from "./dates";

const NAVY = "#14324D";
const CLAY = "#C2703D";
const INK = "#2A2A28";
const MUTED = "#6B6B63";

export function genererRecuPDF({ proprietaire, immeuble, logement, locataire, paiement }) {
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // Bandeau supérieur
  doc.setFillColor(NAVY);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MonLoyer", M, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Reçu de paiement de loyer", M, 60);

  let y = 100;
  doc.setTextColor(INK);

  // Numéro / date
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(`Reçu n° ${paiement.id.toUpperCase()}`, M, y);
  doc.text(`Émis le ${formatDate(paiement.date)}`, W - M, y, { align: "right" });
  y += 26;

  doc.setDrawColor(CLAY);
  doc.setLineWidth(1.2);
  doc.line(M, y, W - M, y);
  y += 26;

  function row(label, value, bold = false) {
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text(label, M, y);
    doc.setTextColor(INK);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(String(value), W - M, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 20;
  }

  row("Propriétaire", proprietaire?.nom || "—");
  row("Bailleur / Immeuble", immeuble?.nom || "—");
  row("Logement", logement?.nom || "—");
  row("Locataire", locataire?.nom || "—");
  row("Période", periodLabel(paiement.periode));
  row("Mode de paiement", paiement.methode);

  y += 10;
  doc.setFillColor("#F1E9DC");
  doc.roundedRect(M, y, W - 2 * M, 46, 6, 6, "F");
  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Montant payé", M + 16, y + 29);
  doc.setFontSize(15);
  doc.text(formatMoney(paiement.montant), W - M - 16, y + 29, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 80;

  // Cachet / signature
  doc.setDrawColor(CLAY);
  doc.setLineWidth(1);
  doc.circle(W - M - 38, y + 20, 30, "S");
  doc.setFontSize(7.5);
  doc.setTextColor(CLAY);
  doc.text("PAYÉ", W - M - 38, y + 17, { align: "center" });
  doc.text(periodLabel(paiement.periode), W - M - 38, y + 27, { align: "center" });

  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text("Document généré par MonLoyer — à conserver comme preuve de paiement.", M, doc.internal.pageSize.getHeight() - 30);

  return doc;
}

export function telechargerRecu(payload) {
  const doc = genererRecuPDF(payload);
  const nomFichier = `recu-${(payload.locataire?.nom || "locataire").replace(/\s+/g, "-").toLowerCase()}-${payload.paiement.periode}.pdf`;
  doc.save(nomFichier);
}
