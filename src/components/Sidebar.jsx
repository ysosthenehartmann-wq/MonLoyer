import { NavLink } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function Sidebar() {
  const { state } = useData();
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <img src="/logo.png" alt="MonLoyer" style={{ width: "28px", height: "28px" }} />
        </span>
        MonLoyer
      </div>
      <div className="tagline">Gérez vos loyers en toute simplicité</div>
      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          📊 Tableau de bord
        </NavLink>
        <NavLink to="/immeubles" className={({ isActive }) => (isActive ? "active" : "")}>
          🏢 Immeubles
        </NavLink>
        <NavLink to="/locataires" className={({ isActive }) => (isActive ? "active" : "")}>
          👤 Locataires
        </NavLink>
        <NavLink to="/paiements" className={({ isActive }) => (isActive ? "active" : "")}>
          💳 Paiements
        </NavLink>
        <NavLink to="/parametres" className={({ isActive }) => (isActive ? "active" : "")}>
          ⚙️ Paramètres
        </NavLink>
      </nav>
      <div className="footer-note">
        {state.proprietaire?.nom ? `Connecté : ${state.proprietaire.nom}` : ""}
        <br />
        Données stockées sur cet appareil.
      </div>
    </aside>
  );
}
