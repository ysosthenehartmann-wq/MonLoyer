import { useRef, useState } from "react";
import { useData } from "../context/DataContext";
import { exportBackup, importBackup } from "../lib/storage";

export default function Parametres() {
  const { state, saveProprietaire, setState } = useData();
  const [nom, setNom] = useState(state.proprietaire?.nom || "");
  const [telephone, setTelephone] = useState(state.proprietaire?.telephone || "");
  const [entreprise, setEntreprise] = useState(state.proprietaire?.entreprise || "");
  const fileInput = useRef(null);
  const [message, setMessage] = useState("");

  function submit(e) {
    e.preventDefault();
    saveProprietaire({ nom: nom.trim(), telephone: telephone.trim(), entreprise: entreprise.trim() });
    setMessage("Profil mis à jour.");
    setTimeout(() => setMessage(""), 2500);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    importBackup(file, (data, err) => {
      if (err || !data) {
        alert("Fichier de sauvegarde invalide.");
        return;
      }
      if (confirm("Cela remplacera toutes les données actuelles par celles du fichier importé. Continuer ?")) {
        setState(data);
      }
    });
    e.target.value = "";
  }

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h1>Paramètres</h1>
          <div className="subtitle">Profil, sauvegarde et gestion des données.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Profil propriétaire</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
          <div className="field">
            <label>Nom de l'activité</label>
            <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
          {message && <span style={{ marginLeft: 12, color: "var(--green)", fontSize: 13.5 }}>{message}</span>}
        </form>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Sauvegarde des données</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
          Vos données sont stockées uniquement sur cet appareil. Téléchargez une sauvegarde régulièrement,
          surtout avant de changer de téléphone ou de vider le cache du navigateur.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => exportBackup(state)}>⬇️ Télécharger une sauvegarde</button>
          <button className="btn btn-secondary" onClick={() => fileInput.current.click()}>⬆️ Importer une sauvegarde</button>
          <input type="file" accept="application/json" ref={fileInput} style={{ display: "none" }} onChange={handleImport} />
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, marginBottom: 10, color: "var(--red)" }}>Zone sensible</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
          Cette action supprime définitivement tous les immeubles, logements, locataires et paiements enregistrés.
        </p>
        <button
          className="btn"
          style={{ background: "var(--red-bg)", color: "var(--red)" }}
          onClick={() => {
            if (confirm("Supprimer TOUTES les données ? Cette action est irréversible.")) {
              setState({ proprietaire: state.proprietaire, immeubles: [], logements: [], locataires: [], paiements: [] });
            }
          }}
        >
          🗑️ Réinitialiser toutes les données
        </button>
      </div>
    </div>
  );
}
