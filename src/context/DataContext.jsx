import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadState, saveState } from "../lib/storage";
import { currentPeriod, joursAvantEcheance } from "../lib/dates";
import { supabase } from "../lib/supabaseClient";
const DataContext = createContext(null);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);
   // Au démarrage : on va chercher les données dans Supabase
  useEffect(() => {
    // userId = l'identifiant de la personne connectée (utile pour lire son profil)
    async function chargerDepuisSupabase(userId) {
      // On lance les 5 lectures en même temps (Promise.all) pour aller plus vite
      const [im, lo, lc, pa, pr] = await Promise.all([
        supabase.from('immeubles').select('*').order('created_at'),   // select('*') = toutes les colonnes
        supabase.from('logements').select('*').order('created_at'),
        supabase.from('locataires').select('*').order('created_at'),
        supabase.from('paiements').select('*').order('created_at'),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(), // ton profil (maybeSingle : pas d'erreur s'il n'existe pas encore)
      ]);

      // Si une des 5 lectures a échoué, on s'arrête : l'écran garde ses données actuelles
      const erreur = im.error || lo.error || lc.error || pa.error || pr.error;
      if (erreur) { console.error('Chargement Supabase :', erreur.message); return; }

      // On remplace les listes, en retraduisant les noms de colonnes vers ceux de l'app
      setState((s) => ({
        ...s,                                          // on garde le reste de l'état
        proprietaire: pr.data                          // si un profil existe dans Supabase...
          ? {
              nom: pr.data.nom,
              telephone: pr.data.telephone || '',
              entreprise: s.proprietaire?.entreprise || '', // pas de colonne "entreprise" : on garde la valeur locale
            }
          : s.proprietaire,                            // ...sinon on garde l'état actuel
        immeubles: im.data.map((i) => ({
          id: i.id, nom: i.nom, adresse: i.adresse || '', type: i.type,
        })),
        logements: lo.data.map((l) => ({
          id: l.id,
          immeubleId: l.immeuble_id,                   // immeuble_id (Supabase) devient immeubleId (app)
          nom: l.nom,
          loyer: Number(l.loyer),                      // on force un nombre
          jourEcheance: l.jour_echeance,
        })),
        locataires: lc.data.map((t) => ({
          id: t.id,
          logementId: t.logement_id,
          nom: t.nom,
          telephone: t.telephone || '',
          dateEntree: t.date_entree,
          cautionMontant: Number(t.caution_montant || 0),
          avanceMontant: Number(t.avance_montant || 0),
          cautionStatut: t.caution_statut,
        })),
        paiements: pa.data.map((p) => ({
          id: p.id,
          locataireId: p.locataire_id,
          periode: p.mois_concerne.slice(0, 7),        // "2026-10-01" redevient "2026-10"
          montant: Number(p.montant),
          date: p.date_paiement,
          methode: p.methode,
        })),
      }));
    }

    // Se déclenche quand une session de connexion existe (au démarrage ou après connexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // setTimeout : évite un blocage connu de Supabase ; on transmet l'id de la personne connectée
      if (session) setTimeout(() => chargerDepuisSupabase(session.user.id), 0);
    });

    // Nettoyage : on arrête d'écouter quand le composant disparaît
    return () => subscription.unsubscribe();
  }, []);                                              // [] = ne s'installe qu'une seule fois                                             // [] = ne s'installe qu'une seule fois
  const api = useMemo(() => {
    return {
      state,
      setState,

      // ---------- Propriétaire ----------
     async saveProprietaire(p) {
  setState((s) => ({ ...s, proprietaire: p }));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").upsert({
      id: user.id,
      nom: p.nom,
      telephone: p.telephone || null,
    });
  }
}, 

    // ---------- Immeubles ----------
      async addImmeuble(immeuble) {
        // "async" : la fonction va attendre des réponses de Supabase
        // On demande à Supabase quel utilisateur est connecté
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('immeubles')              // on vise la table "immeubles"
          .insert({                       // on ajoute une ligne
            proprietaire_id: user.id,     // le propriétaire = l'utilisateur connecté
            nom: immeuble.nom,            // nom saisi dans le formulaire
            adresse: immeuble.adresse,    // adresse saisie
            type: immeuble.type,          // Villa, Studio, etc.
          })
          .select()                       // Supabase renvoie la ligne créée
          .single();                      // une seule ligne attendue, pas une liste

        // Si Supabase a refusé, on affiche l'erreur et on arrête là
        if (error) { console.error('addImmeuble :', error.message); return; }

        setState((s) => ({
          ...s,                           // on garde tout le reste de l'état
          immeubles: [
            ...s.immeubles,               // les propriétés déjà affichées
            { ...immeuble, id: data.id }, // la nouvelle, avec le vrai id de Supabase
          ],
        }));
      },
      async updateImmeuble(id, patch) {
        // "patch" contient seulement les champs modifiés
        const { error } = await supabase
          .from('immeubles')
          .update(patch)                  // on envoie les champs modifiés
          .eq('id', id);                  // uniquement pour la ligne qui a cet id

        if (error) { console.error('updateImmeuble :', error.message); return; }

        setState((s) => ({
          ...s,
          immeubles: s.immeubles.map((i) =>        // on parcourt les propriétés
            i.id === id ? { ...i, ...patch } : i   // si c'est la bonne, on applique les changements
          ),
        }));
      },
      async deleteImmeuble(id) {
        const { error } = await supabase
          .from('immeubles')
          .delete()                       // on supprime
          .eq('id', id);                  // la ligne qui a cet id

        if (error) { console.error('deleteImmeuble :', error.message); return; }

        setState((s) => {
          // ids des logements de cette propriété
          const logementIds = s.logements.filter((l) => l.immeubleId === id).map((l) => l.id);
          // ids des locataires de ces logements
          const locataireIds = s.locataires.filter((t) => logementIds.includes(t.logementId)).map((t) => t.id);
          return {
            ...s,
            immeubles: s.immeubles.filter((i) => i.id !== id),                         // retire la propriété
            logements: s.logements.filter((l) => l.immeubleId !== id),                 // retire ses logements
            locataires: s.locataires.filter((t) => !logementIds.includes(t.logementId)), // retire leurs locataires
            paiements: s.paiements.filter((p) => !locataireIds.includes(p.locataireId)), // retire leurs paiements
          };
        });
      },  

            // ---------- Logements ----------
      async addLogement(logement) {
        const { data, error } = await supabase
          .from('logements')                          // on vise la table "logements"
          .insert({                                   // on ajoute une ligne
            immeuble_id: logement.immeubleId,         // à quelle propriété il appartient
            nom: logement.nom,                        // nom du logement
            loyer: Number(logement.loyer || 0),       // Number() : Supabase attend un nombre, pas du texte
            jour_echeance: Number(logement.jourEcheance || 5), // jour du mois (5 par défaut)
          })
          .select()                                   // Supabase renvoie la ligne créée
          .single();                                  // une seule ligne attendue

        if (error) { console.error('addLogement :', error.message); return; }

        setState((s) => ({
          ...s,
          logements: [
            ...s.logements,                           // les logements déjà affichés
            { ...logement, id: data.id },             // le nouveau, avec le vrai id de Supabase
          ],
        }));
      },
      async updateLogement(id, patch) {
        // On traduit seulement les champs modifiés vers les noms de colonnes
        const champs = {};
        if (patch.nom !== undefined) champs.nom = patch.nom;
        if (patch.loyer !== undefined) champs.loyer = Number(patch.loyer || 0);
        if (patch.jourEcheance !== undefined) champs.jour_echeance = Number(patch.jourEcheance);
        if (patch.immeubleId !== undefined) champs.immeuble_id = patch.immeubleId;

        const { error } = await supabase
          .from('logements')
          .update(champs)                             // on envoie les champs traduits
          .eq('id', id);                              // uniquement la ligne qui a cet id

        if (error) { console.error('updateLogement :', error.message); return; }

        setState((s) => ({ ...s, logements: s.logements.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
      },
      async deleteLogement(id) {
        const { error } = await supabase
          .from('logements')
          .delete()                                   // on supprime
          .eq('id', id);                              // la ligne qui a cet id

        if (error) { console.error('deleteLogement :', error.message); return; }

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
      async addLocataire(locataire) {
        const { data, error } = await supabase
          .from('locataires')                                   // on vise la table "locataires"
          .insert({                                             // on ajoute une ligne
            logement_id: locataire.logementId,                  // le logement occupé
            nom: locataire.nom,                                 // obligatoire (not null)
            telephone: locataire.telephone || null,             // vide → null (champ facultatif)
            date_entree: locataire.dateEntree || null,          // une date vide ("") serait refusée, donc null
            caution_montant: Number(locataire.cautionMontant || 0), // Number() : Supabase attend un nombre
            avance_montant: Number(locataire.avanceMontant || 0),
            caution_statut: locataire.cautionStatut || 'conservee', // seules 2 valeurs permises
          })
          .select()                                             // Supabase renvoie la ligne créée
          .single();                                            // une seule ligne attendue

        if (error) { console.error('addLocataire :', error.message); return; }

        setState((s) => ({
          ...s,
          locataires: [
            ...s.locataires,                                    // les locataires déjà affichés
            { ...locataire, id: data.id },                      // le nouveau, avec le vrai id de Supabase
          ],
        }));
      },
      async updateLocataire(id, patch) {
        // On traduit seulement les champs modifiés vers les noms de colonnes
        const champs = {};
        if (patch.nom !== undefined) champs.nom = patch.nom;
        if (patch.telephone !== undefined) champs.telephone = patch.telephone || null;
        if (patch.dateEntree !== undefined) champs.date_entree = patch.dateEntree || null;
        if (patch.cautionMontant !== undefined) champs.caution_montant = Number(patch.cautionMontant || 0);
        if (patch.avanceMontant !== undefined) champs.avance_montant = Number(patch.avanceMontant || 0);
        if (patch.cautionStatut !== undefined) champs.caution_statut = patch.cautionStatut;
        if (patch.logementId !== undefined) champs.logement_id = patch.logementId;

        const { error } = await supabase
          .from('locataires')
          .update(champs)                                       // on envoie les champs traduits
          .eq('id', id);                                        // uniquement la ligne qui a cet id

        if (error) { console.error('updateLocataire :', error.message); return; }

        setState((s) => ({ ...s, locataires: s.locataires.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
      },
      async deleteLocataire(id) {
        const { error } = await supabase
          .from('locataires')
          .delete()                                             // on supprime
          .eq('id', id);                                        // la ligne qui a cet id

        if (error) { console.error('deleteLocataire :', error.message); return; }

        setState((s) => ({
          ...s,
          locataires: s.locataires.filter((t) => t.id !== id),
          paiements: s.paiements.filter((p) => p.locataireId !== id),
        }));
      }, 
            // ---------- Paiements ----------
      addPaiement(paiement) {
        // On fabrique le paiement tout de suite, avec un vrai identifiant uuid
        // (crypto.randomUUID() en génère un, au format attendu par Supabase)
        const rec = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          methode: "Espèces",
          ...paiement,
        };

        // On l'affiche immédiatement dans l'app, sans attendre Supabase
        setState((s) => ({ ...s, paiements: [...s.paiements, rec] }));

        // En parallèle, on l'envoie à Supabase
        supabase
          .from('paiements')                          // on vise la table "paiements"
          .insert({                                   // on ajoute une ligne
            id: rec.id,                               // le même id que dans l'app
            locataire_id: rec.locataireId,            // quel locataire a payé
            montant: Number(rec.montant),             // Number() : Supabase attend un nombre
            // "2026-10" devient "2026-10-01", car la colonne est de type date
            mois_concerne: rec.periode.length === 7 ? rec.periode + '-01' : rec.periode,
            date_paiement: rec.date.slice(0, 10),     // garde "2026-10-02", sans l'heure
            methode: rec.methode,                     // Espèces, etc.
          })
          .then(({ error }) => {                      // quand Supabase répond :
            if (error) {                              // s'il refuse...
              console.error('addPaiement :', error.message);
              // ...on retire le paiement de l'écran pour ne pas afficher un faux paiement
              setState((s) => ({ ...s, paiements: s.paiements.filter((p) => p.id !== rec.id) }));
            }
          });

        return rec;                                   // l'écran reçoit le paiement tout de suite, comme avant
      },
      async deletePaiement(id) {
        const { error } = await supabase
          .from('paiements')
          .delete()                                   // on supprime
          .eq('id', id);                              // la ligne qui a cet id

        if (error) { console.error('deletePaiement :', error.message); return; }

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
