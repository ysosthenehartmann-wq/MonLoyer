import { useState } from "react";
import { useData } from "../context/DataContext";
import { currentPeriod, formatMoney, formatDate, periodLabel } from "../lib/dates";
import { telechargerRecu } from "../lib/receipt";
import Modal from "../components/Modal";

const METHODES = ["Espèces", "Mobile Money", "Virement", "Chèque"];

export default function Paiements() {
  const { state, addPaiement, deletePaiement, getLogement, getImmeuble, getLocataire } = useData();
  const [modal, setModal] = useState(false);

  const paiementsTries = [...state.paiements].sort((a, b) => new Date(b.date) - new Date(a.date));

  function handleSave(data) {
    const rec = addPaiement(data);
    const locataire = getLocataire(data.locataireId);
    const logement = getLogement(locataire.logementId);
    const immeuble = getImmeuble(logement.immeubleId);
    telechargerRecu({ proprietaire: state.proprietaire, immeuble, logement, locataire, paiement: rec });
    setModal(false);
  }

  function reimprimer(p) {
    const locataire = getLocataire(p.locataireId);
    if (!locataire) return;
    const logement = getLogement(locataire.logementId);
    const immeuble = getImmeuble(logement?.immeubleId);
    telechargerRecu({ proprietaire: state.proprietaire, immeuble, logement, locataire, paiement: p });
  }

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h1>Paiements</h1>
          <div className="subtitle">Enregistrez un paiement pour générer automatiquement un reçu PDF.</div>
        </div>
        <button className="btn btn-primary" disabled={state.locataires.length === 0} onClick={() => setModal(true)}>
          + Enregistrer un paiement
        </button>
      </div>

      {state.locataires.length === 0 && (
        <div className="empty-state card">
          <h3>Ajoutez d'abord un locataire</h3>
          <p>Vous pourrez ensuite enregistrer ses paiements ici.</p>
        </div>
      )}

      {paiementsTries.length === 0 && state.locataires.length > 0 && (
        <div className="empty-state card">
          <p style={{ margin: 0 }}>Aucun paiement enregistré pour l'instant.</p>
        </div>
      )}

      {paiementsTries.map((p) => {
        const locataire = getLocataire(p.locataireId);
        const logement = locataire ? getLogement(locataire.logementId) : null;
        return (
          <div className="list-row" key={p.id}>
            <div>
              <div className="name">{locataire?.nom || "Locataire supprimé"}</div>
              <div className="meta">{logement?.nom || "—"} · {periodLabel(p.periode)} · {p.methode} · {formatDate(p.date)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--navy)" }}>{formatMoney(p.montant)}</span>
              <button className="btn btn-secondary" onClick={() => reimprimer(p)}>🧾 Reçu</button>
              <button className="btn btn-danger" onClick={() => { if (confirm("Supprimer ce paiement ?")) deletePaiement(p.id); }}>🗑️</button>
            </div>
          </div>
        );
      })}

      {modal && (
        <PaiementForm
          state={state}
          getLogement={getLogement}
          getImmeuble={getImmeuble}
          onClose={() => setModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function PaiementForm({ state, getLogement, getImmeuble, onClose, onSave }) {
  const [locataireId, setLocataireId] = useState(state.locataires[0]?.id || "");
  const logementDuLocataire = state.locataires.find((t) => t.id === locataireId)
    ? getLogement(state.locataires.find((t) => t.id === locataireId).logementId)
    : null;
  const [periode, setPeriode] = useState(currentPeriod());
  const [montant, setMontant] = useState(logementDuLocataire?.loyer || "");
  const [methode, setMethode] = useState("Espèces");

  function onChangeLocataire(id) {
    setLocataireId(id);
    const t = state.locataires.find((x) => x.id === id);
    const l = t ? getLogement(t.logementId) : null;
    setMontant(l?.loyer || "");
  }

  function submit(e) {
    e.preventDefault();
    if (!locataireId || !montant) return;
    onSave({ locataireId, periode, montant: Number(montant), methode });
  }

  return (
    <Modal title="Enregistrer un paiement" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Locataire</label>
          <select value={locataireId} onChange={(e) => onChangeLocataire(e.target.value)} required>
            {state.locataires.map((t) => {
              const l = getLogement(t.logementId);
              return (
                <option key={t.id} value={t.id}>
                  {t.nom} — {l?.nom} ({getImmeuble(l?.immeubleId)?.nom})
                </option>
              );
            })}
          </select>
        </div>
        <div className="field">
          <label>Période concernée</label>
          <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} required />
        </div>
        <div className="field">
          <label>Montant payé (FCFA)</label>
          <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} required />
        </div>
        <div className="field">
          <label>Mode de paiement</label>
          <select value={methode} onChange={(e) => setMethode(e.target.value)}>
            {METHODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer & générer le reçu</button>
        </div>
      </form>
    </Modal>
  );
}
