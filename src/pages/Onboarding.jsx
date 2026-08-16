import { useState } from "react";
import { useData } from "../context/DataContext";

export default function Onboarding() {
  const { saveProprietaire } = useData();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [entreprise, setEntreprise] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim()) return;
    saveProprietaire({ nom: nom.trim(), telephone: telephone.trim(), entreprise: entreprise.trim() });
  }

  return (
    <div className="onboarding-screen">
      <div className="onboarding-card">
        <div className="mark">🏠</div>
        <h1>Bienvenue sur MonLoyer</h1>
        <p className="lead">Créez votre profil propriétaire pour commencer à gérer vos immeubles, vos locataires et vos loyers.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Votre nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Sosthène Yavo" required />
          </div>
          <div className="field">
            <label>Téléphone (optionnel)</label>
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Ex : +225 07 00 00 00 00" />
          </div>
          <div className="field">
            <label>Nom de l'activité (optionnel)</label>
            <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="Ex : Yavo Immobilier" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            Commencer
          </button>
        </form>
      </div>
    </div>
  );
}
