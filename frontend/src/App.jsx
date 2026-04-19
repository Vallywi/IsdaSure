import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectWallet from './pages/ConnectWallet';
import RoleSelection from './pages/RoleSelection';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ContributionHistory from './pages/ContributionHistory';
import ToastStack from './components/ToastStack';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="linear-bg" aria-hidden="true">
          <div className="ambient-blob ambient-blob-one" />
          <div className="ambient-blob ambient-blob-two" />
          <div className="ambient-blob ambient-blob-three" />
        </div>
        <Routes>
          <Route path="/" element={<ConnectWallet />} />
          <Route path="/roles" element={<RoleSelection />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login/:role" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contribution-history" element={<ContributionHistory />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastStack />
      </BrowserRouter>
    </AppProvider>
  );
}