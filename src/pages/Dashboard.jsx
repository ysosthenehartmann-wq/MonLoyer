import { useData } from "../context/DataContext";
import { formatMoney, periodLabel } from "../lib/dates";
import { lienRappelWhatsApp } from "../lib/whatsapp";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { dashboard, state } = useData();
  const d = dashboard();

  const auMoinsUnLogement = state.logements.length > 0;

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <div className="subtitle">{periodLabel(d.periode)} · vue d'ensemble de votre portefeuille locatif</div>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="stat-label">Revenus encaissés ce mois</div>
          <div className="stat-value">{formatMoney(d.revenusDuMois)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Revenu potentiel mensuel</div>
          <div className="stat-value">{formatMoney(d.revenusPotentielMensuel)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Logements</div>
          <div className="stat-value">{d.totalLogements}</div>
        </div>
        <div className="card stat-card accent">
          <div className="stat-label">Impayés ce mois</div>
          <div className="stat-value">{d.impayes.length}</div>
        </div>
      </div>

      {!auMoinsUnLogement && (
        <div className="empty-state card" style={{ marginTop: 28 }}>
          <h3>Ajoutez votre premier immeuble</h3>
          <p>Commencez par créer un immeuble et un logement pour voir apparaître vos données ici.</p>
          <Link to="/immeubles" className="btn btn-primary">Aller vers Immeubles</Link>
        </div>
      )}

      {auMoinsUnLogement && (
        <>
          <div className="section-title">🔔 Échéances à venir (5 prochains jours)</div>
          {d.alertes.length === 0 && (
            <div className="empty-state card">
              <p style={{ margin: 0 }}>Aucune échéance urgente pour le moment.</p>
            </div>
          )}
          {d.alertes.map(({ locataire, logement, jours }) => (
            <div className="list-row" key={locataire.id}>
              <div>
                <div className="name">{locataire.nom}</div>
                <div className="meta">{logement.nom} · {formatMoney(logement.loyer)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-clay">
                  {jours <= 0 ? "Échéance aujourd'hui" : `Dans ${jours} j`}
                </span>
                {locataire.telephone && (
                  <a
                    className="btn btn-secondary"
                    target="_blank"
                    rel="noreferrer"
                    href={lienRappelWhatsApp({ locataire, logement, periode: d.periode, jours })}
                  >
                    💬 Rappel WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}

          <div className="section-title">⚠️ Locataires en impayé ce mois</div>
          {d.impayes.length === 0 && (
            <div className="empty-state card">
              <p style={{ margin: 0 }}>Tout le monde est à jour. Excellent travail !</p>
            </div>
          )}
          {d.impayes.map(({ locataire, logement }) => (
            <div className="list-row" key={locataire.id}>
              <div>
                <div className="name">{locataire.nom}</div>
                <div className="meta">{logement.nom} · {formatMoney(logement.loyer)}</div>
              </div>
              <span className="badge badge-red">Impayé</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
