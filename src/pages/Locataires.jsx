import { useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney, formatDate, periodLabel } from "../lib/dates";
import Modal from "../components/Modal";
import { genererBail } from "../lib/bail";

export default function Locataires() {
  const { state, addLocataire, updateLocataire, deleteLocataire, getLogement, getImmeuble, getPaiementsByLocataire } = useData();
  const [modal, setModal] = useState(null); // null | 'new' | locataire
  const [historyFor, setHistoryFor] = useState(null);

  function handleSave(data) {
    if (modal === "new") addLocataire(data);
    else updateLocataire(modal.id, data);
    setModal(null);
  }

  const logementsLibres = state.logements; // could filter to unassigned only, but allow multi for simplicity

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h1>Locataires</h1>
          <div className="subtitle">Gérez vos locataires et leur rattachement aux logements.</div>
        </div>
        <button
          className="btn btn-primary"
          disabled={state.logements.length === 0}
          title={state.logements.length === 0 ? "Ajoutez d'abord un logement" : ""}
          onClick={() => setModal("new")}
        >
          + Ajouter un locataire
        </button>
      </div>

      {state.logements.length === 0 && (
        <div className="empty-state card">
          <h3>Créez d'abord un logement</h3>
          <p>Un locataire doit être rattaché à un logement existant.</p>
        </div>
      )}

      {state.locataires.length === 0 && state.logements.length > 0 && (
        <div className="empty-state card">
          <h3>Aucun locataire pour l'instant</h3>
          <p>Ajoutez votre premier locataire pour commencer le suivi des paiements.</p>
        </div>
      )}

      {state.locataires.map((t) => {
        const logement = getLogement(t.logementId);
        const immeuble = logement ? getImmeuble(logement.immeubleId) : null;
        return (
          <div key={t.id}>
            <div className="list-row">
              <div>
                <div className="name">{t.nom}</div>
                <div className="meta">
                  {logement ? `${logement.nom} — ${immeuble?.nom}` : "Logement introuvable"} {t.telephone ? `· ${t.telephone}` : ""}
                </div>                {(t.cautionMontant > 0 || t.avanceMontant > 0 || t.dateEntree) && (   // seulement s'il y a quelque chose à montrer
                  <div className="meta">
                    {t.dateEntree ? `Entrée le ${formatDate(t.dateEntree)}` : ""}
                    {t.cautionMontant > 0 ? ` · Caution ${formatMoney(t.cautionMontant)} (${t.cautionStatut === "restituee" ? "restituée" : "conservée"})` : ""}
                    {t.avanceMontant > 0 ? ` · Avance ${formatMoney(t.avanceMontant)}` : ""}
                  </div>
                )} 
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-secondary" onClick={() => setHistoryFor(historyFor === t.id ? null : t.id)}>
                  {historyFor === t.id ? "Masquer historique" : "Historique"}
                </button>
                <button className="btn btn-secondary" onClick={() => genererBail({ proprietaire: state.proprietaire, immeuble, logement, locataire: t })}>Bail</button>
                <button className="btn btn-ghost" onClick={() => setModal(t)}>✏️</button>
                <button className="btn btn-danger" onClick={() => { if (confirm(`Supprimer ${t.nom} ?`)) deleteLocataire(t.id); }}>🗑️</button>
              </div>
            </div>
            {historyFor === t.id && (
              <div className="card" style={{ marginBottom: 14, marginTop: -4 }}>
                {getPaiementsByLocataire(t.id).length === 0 && <p style={{ margin: 0, color: "var(--muted)" }}>Aucun paiement enregistré.</p>}
                {getPaiementsByLocataire(t.id).map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--sand-deep)" }}>
                    <span>{periodLabel(p.periode)} · {p.methode}</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{formatMoney(p.montant)}</span>
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>{formatDate(p.date)}</span>
                  </div>
              ))}
            </div>
          )}
        </div>
      );
    })}
    
      {modal && (
        <LocataireForm
          initial={modal === "new" ? null : modal}
          logements={logementsLibres}
          getImmeuble={getImmeuble}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function LocataireForm({ initial, logements, getImmeuble, onClose, onSave }) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [telephone, setTelephone] = useState(initial?.telephone || "");
  const [logementId, setLogementId] = useState(initial?.logementId || logements[0]?.id || "");
  const [dateEntree, setDateEntree] = useState(initial?.dateEntree || "");
  const [cautionMontant, setCautionMontant] = useState(initial?.cautionMontant || "");
  const [avanceMontant, setAvanceMontant] = useState(initial?.avanceMontant || "");
  const [cautionStatut, setCautionStatut] = useState(initial?.cautionStatut || "conservee");

  function submit(e) {
    e.preventDefault();                                  // empêche le rechargement de la page
    if (!nom.trim() || !logementId) return;              // nom et logement obligatoires
    onSave({
      nom: nom.trim(),
      telephone: telephone.trim(),
      logementId,
      dateEntree,
      cautionMontant: Number(cautionMontant || 0),       // texte → nombre
      avanceMontant: Number(avanceMontant || 0),
      cautionStatut,                                     // "conservee" ou "restituee"
    });
  }

  return (
    <Modal title={initial ? "Modifier le locataire" : "Nouveau locataire"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Nom du locataire</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Awa Koffi" required autoFocus />
        </div>
        <div className="field">
          <label>Téléphone (pour les rappels WhatsApp)</label>
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Ex : +225 07 00 00 00 00" />
        </div>
        <div className="field">
          <label>Logement</label>
          <select value={logementId} onChange={(e) => setLogementId(e.target.value)} required>
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} — {getImmeuble(l.immeubleId)?.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date d'entrée (optionnel)</label>
          <input type="date" value={dateEntree} onChange={(e) => setDateEntree(e.target.value)} />
        </div>
        <div className="field">
          <label>Caution versée en FCFA (optionnel)</label>
          <input type="number" min="0" value={cautionMontant} onChange={(e) => setCautionMontant(e.target.value)} placeholder="Ex : 200000" />
        </div>
        <div className="field">
          <label>Avance versée en FCFA (optionnel)</label>
          <input type="number" min="0" value={avanceMontant} onChange={(e) => setAvanceMontant(e.target.value)} placeholder="Ex : 100000" />
        </div>
        <div className="field">
          <label>Statut de la caution</label>
          <select value={cautionStatut} onChange={(e) => setCautionStatut(e.target.value)}>
            <option value="conservee">Conservée</option>
            <option value="restituee">Restituée</option>
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}