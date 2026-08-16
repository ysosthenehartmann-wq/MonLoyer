import { useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney, formatDate, periodLabel } from "../lib/dates";
import Modal from "../components/Modal";

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
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-secondary" onClick={() => setHistoryFor(historyFor === t.id ? null : t.id)}>
                  {historyFor === t.id ? "Masquer historique" : "Historique"}
                </button>
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

  function submit(e) {
    e.preventDefault();
    if (!nom.trim() || !logementId) return;
    onSave({ nom: nom.trim(), telephone: telephone.trim(), logementId });
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
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
