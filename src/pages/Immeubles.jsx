import { useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney } from "../lib/dates";
import Modal from "../components/Modal";

export default function Immeubles() {
  const { state, addImmeuble, updateImmeuble, deleteImmeuble, addLogement, updateLogement, deleteLogement, getLogementsByImmeuble, getLocatairesByLogement } = useData();

  const [modalImmeuble, setModalImmeuble] = useState(null); // null | 'new' | immeuble object
  const [modalLogement, setModalLogement] = useState(null); // { immeubleId, logement? }
  const [expanded, setExpanded] = useState({});

  function toggle(id) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function handleSaveImmeuble(data) {
    if (modalImmeuble === "new") addImmeuble(data);
    else updateImmeuble(modalImmeuble.id, data);
    setModalImmeuble(null);
  }

  function handleSaveLogement(data) {
    if (modalLogement.logement) updateLogement(modalLogement.logement.id, data);
    else addLogement({ ...data, immeubleId: modalLogement.immeubleId });
    setModalLogement(null);
  }

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h1>Immeubles & logements</h1>
          <div className="subtitle">Organisez votre patrimoine par immeuble, puis ajoutez vos logements.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModalImmeuble("new")}>+ Ajouter un immeuble</button>
      </div>

      {state.immeubles.length === 0 && (
        <div className="empty-state card">
          <h3>Aucun immeuble pour l'instant</h3>
          <p>Créez votre premier immeuble pour commencer à y ajouter des logements.</p>
          <button className="btn btn-primary" onClick={() => setModalImmeuble("new")}>+ Ajouter un immeuble</button>
        </div>
      )}

      {state.immeubles.map((immeuble) => {
        const logements = getLogementsByImmeuble(immeuble.id);
        const isOpen = expanded[immeuble.id] ?? true;
        return (
          <div className="card" key={immeuble.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggle(immeuble.id)}>
              <div>
                <div className="name" style={{ fontSize: 17 }}>{immeuble.nom}</div>
                <div className="meta">{immeuble.adresse || "Adresse non renseignée"} · {logements.length} logement{logements.length > 1 ? "s" : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-ghost" onClick={() => setModalImmeuble(immeuble)}>✏️ Modifier</button>
                <button className="btn btn-danger" onClick={() => { if (confirm(`Supprimer l'immeuble "${immeuble.nom}" et tous ses logements ?`)) deleteImmeuble(immeuble.id); }}>🗑️</button>
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 18 }}>
                {logements.map((logement) => {
                  const locataires = getLocatairesByLogement(logement.id);
                  return (
                    <div className="list-row" key={logement.id}>
                      <div>
                        <div className="name">{logement.nom}</div>
                        <div className="meta">
                          {formatMoney(logement.loyer)} / mois · échéance le {logement.jourEcheance} ·{" "}
                          {locataires.length > 0 ? locataires.map((t) => t.nom).join(", ") : "sans locataire"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost" onClick={() => setModalLogement({ immeubleId: immeuble.id, logement })}>✏️</button>
                        <button className="btn btn-danger" onClick={() => { if (confirm(`Supprimer le logement "${logement.nom}" ?`)) deleteLogement(logement.id); }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
                <button className="btn btn-secondary" style={{ marginTop: 6 }} onClick={() => setModalLogement({ immeubleId: immeuble.id })}>
                  + Ajouter un logement
                </button>
              </div>
            )}
          </div>
        );
      })}

      {modalImmeuble && (
        <ImmeubleForm
          initial={modalImmeuble === "new" ? null : modalImmeuble}
          onClose={() => setModalImmeuble(null)}
          onSave={handleSaveImmeuble}
        />
      )}

      {modalLogement && (
        <LogementForm
          initial={modalLogement.logement || null}
          onClose={() => setModalLogement(null)}
          onSave={handleSaveLogement}
        />
      )}
    </div>
  );
}

function ImmeubleForm({ initial, onClose, onSave }) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [adresse, setAdresse] = useState(initial?.adresse || "");

  function submit(e) {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), adresse: adresse.trim() });
  }

  return (
    <Modal title={initial ? "Modifier l'immeuble" : "Nouvel immeuble"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Nom de l'immeuble</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Résidence Les Palmiers" required autoFocus />
        </div>
        <div className="field">
          <label>Adresse (optionnel)</label>
          <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Ex : Agboville, Quartier Résidentiel" />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}

function LogementForm({ initial, onClose, onSave }) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [loyer, setLoyer] = useState(initial?.loyer || "");
  const [jourEcheance, setJourEcheance] = useState(initial?.jourEcheance || 5);

  function submit(e) {
    e.preventDefault();
    if (!nom.trim() || !loyer) return;
    onSave({ nom: nom.trim(), loyer: Number(loyer), jourEcheance: Number(jourEcheance) });
  }

  return (
    <Modal title={initial ? "Modifier le logement" : "Nouveau logement"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Nom / numéro du logement</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Appartement 2B" required autoFocus />
        </div>
        <div className="field">
          <label>Loyer mensuel (FCFA)</label>
          <input type="number" min="0" value={loyer} onChange={(e) => setLoyer(e.target.value)} placeholder="Ex : 75000" required />
        </div>
        <div className="field">
          <label>Jour d'échéance du mois</label>
          <input type="number" min="1" max="28" value={jourEcheance} onChange={(e) => setJourEcheance(e.target.value)} required />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
