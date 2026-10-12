import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./pages/Login";
import { DataProvider, useData } from "./context/DataContext";
import Sidebar from "./components/Sidebar";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Immeubles from "./pages/Immeubles";
import Locataires from "./pages/Locataires";
import Paiements from "./pages/Paiements";
import Parametres from "./pages/Parametres";

function Shell() {
  const { state } = useData();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return <p>Chargement...</p>;
  }

  if (!session) {
    return <Login />;
  }

  if (!state.proprietaire) {
    return <Onboarding />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/immeubles" element={<Immeubles />} />
        <Route path="/locataires" element={<Locataires />} />
        <Route path="/paiements" element={<Paiements />} />
        <Route path="/parametres" element={<Parametres />} />
      </Routes>
    </div>
  );
}


export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </DataProvider>
  );
}

 