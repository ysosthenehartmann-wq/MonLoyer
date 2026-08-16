import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadState, saveState } from "../lib/storage";
import { currentPeriod, joursAvantEcheance } from "../lib/dates";

const DataContext = createContext(null);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const api = useMemo(() => {
    return {
      state,
      setState,

      // ---------- Propriétaire ----------
      saveProprietaire(p) {
        setState((s) => ({ ...s, proprietaire: p }));
      },

      // ---------- Immeubles ----------
      addImmeuble(immeuble) {
        setState((s) => ({ ...s, immeubles: [...s.immeubles, { id: uid(), ...immeuble }] }));
      },
      updateImmeuble(id, patch) {
        setState((s) => ({ ...s, immeubles: s.immeubles.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
      },
      deleteImmeuble(id) {
        setState((s) => {
          const logementIds = s.logements.filter((l) => l.immeubleId === id).map((l) => l.id);
          const locataireIds = s.locataires.filter((t) => logementIds.includes(t.logementId)).map((t) => t.id);
          return {
            ...s,
            immeubles: s.immeubles.filter((i) => i.id !== id),
            logements: s.logements.filter((l) => l.immeubleId !== id),
            locataires: s.locataires.filter((t) => !logementIds.includes(t.logementId)),
            paiements: s.paiements.filter((p) => !locataireIds.includes(p.locataireId)),
          };
        });
      },

      // ---------- Logements ----------
      addLogement(logement) {
        setState((s) => ({ ...s, logements: [...s.logements, { id: uid(), ...logement }] }));
      },
      updateLogement(id, patch) {
        setState((s) => ({ ...s, logements: s.logements.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
      },
      deleteLogement(id) {
        setState((s) => {
          const locataireIds = s.locataires.filter((t) => t.logementId === id).map((t) => t.id);
          return {
            ...s,
            logements: s.logements.filter((l) => l.id !== id),
            locataires: s.locataires.filter((t) => t.logementId !== id),
            paiements: s.paiements.filter((p) => !locataireIds.includes(p.locataireId)),
          };
        });
      },

      // ---------- Locataires ----------
      addLocataire(locataire) {
        setState((s) => ({ ...s, locataires: [...s.locataires, { id: uid(), ...locataire }] }));
      },
      updateLocataire(id, patch) {
        setState((s) => ({ ...s, locataires: s.locataires.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
      },
      deleteLocataire(id) {
        setState((s) => ({
          ...s,
          locataires: s.locataires.filter((t) => t.id !== id),
          paiements: s.paiements.filter((p) => p.locataireId !== id),
        }));
      },

      // ---------- Paiements ----------
      addPaiement(paiement) {
        const rec = { id: uid(), date: new Date().toISOString(), methode: "Espèces", ...paiement };
        setState((s) => ({ ...s, paiements: [...s.paiements, rec] }));
        return rec;
      },
      deletePaiement(id) {
        setState((s) => ({ ...s, paiements: s.paiements.filter((p) => p.id !== id) }));
      },

      // ---------- Sélecteurs dérivés ----------
      getLogementsByImmeuble(immeubleId) {
        return state.logements.filter((l) => l.immeubleId === immeubleId);
      },
      getLocatairesByLogement(logementId) {
        return state.locataires.filter((t) => t.logementId === logementId);
      },
      getLogement(id) {
        return state.logements.find((l) => l.id === id);
      },
      getImmeuble(id) {
        return state.immeubles.find((i) => i.id === id);
      },
      getLocataire(id) {
        return state.locataires.find((t) => t.id === id);
      },
      hasPaidForPeriod(locataireId, periode) {
        return state.paiements.some((p) => p.locataireId === locataireId && p.periode === periode);
      },
      getPaiementsByLocataire(locataireId) {
        return state.paiements
          .filter((p) => p.locataireId === locataireId)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      },

      dashboard() {
        const periode = currentPeriod();
        const revenusDuMois = state.paiements
          .filter((p) => p.periode === periode)
          .reduce((sum, p) => sum + Number(p.montant), 0);

        const totalLogements = state.logements.length;
        const totalLocataires = state.locataires.length;

        const impayes = state.locataires
          .map((t) => {
            const logement = state.logements.find((l) => l.id === t.logementId);
            if (!logement) return null;
            const paye = state.paiements.some((p) => p.locataireId === t.id && p.periode === periode);
            if (paye) return null;
            return { locataire: t, logement };
          })
          .filter(Boolean);

        const alertes = state.locataires
          .map((t) => {
            const logement = state.logements.find((l) => l.id === t.logementId);
            if (!logement) return null;
            const jours = joursAvantEcheance(logement.jourEcheance);
            const paye = state.paiements.some((p) => p.locataireId === t.id && p.periode === periode);
            if (paye) return null;
            if (jours <= 5) return { locataire: t, logement, jours };
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => a.jours - b.jours);

        const revenusPotentielMensuel = state.logements.reduce((sum, l) => sum + Number(l.loyer || 0), 0);

        return { periode, revenusDuMois, totalLogements, totalLocataires, impayes, alertes, revenusPotentielMensuel };
      },
    };
  }, [state]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé dans un DataProvider");
  return ctx;
}
