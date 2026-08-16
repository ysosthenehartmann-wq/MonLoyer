import { HashRouter, Routes, Route } from "react-router-dom";
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
