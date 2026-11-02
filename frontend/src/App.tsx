import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import DigitalTwin from "./pages/DigitalTwin";
import Findings from "./pages/Findings";
import ThreatIntel from "./pages/ThreatIntel";
import Vulnerabilities from "./pages/Vulnerabilities";
import VulnerabilityDetail from "./pages/VulnerabilityDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

/** Route table: public /login, everything else behind auth + app layout. */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/digital-twin" element={<DigitalTwin />} />
          <Route path="/vulnerabilities" element={<Vulnerabilities />} />
          <Route path="/vulnerabilities/:id" element={<VulnerabilityDetail />} />
          <Route path="/findings" element={<Findings />} />
          <Route path="/threat-intel" element={<ThreatIntel />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
