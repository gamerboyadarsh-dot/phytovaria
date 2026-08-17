import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell';
import { AuthProvider, useAuth } from './lib/AuthContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlantsListPage } from './pages/PlantsListPage';
import { RegisterPlantPage } from './pages/RegisterPlantPage';
import { PlantProfilePage } from './pages/PlantProfilePage';
import { UploadVCFPage } from './pages/UploadVCFPage';
import { GenomicsPage } from './pages/GenomicsPage';
import { RiskPage } from './pages/RiskPage';
import { ExplainPage } from './pages/ExplainPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { ReportPage } from './pages/ReportPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute><Shell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/plants" element={<PlantsListPage />} />
            <Route path="/plants/register" element={<RegisterPlantPage />} />
            <Route path="/plants/:code" element={<PlantProfilePage />} />
            <Route path="/plants/:code/upload" element={<UploadVCFPage />} />
            <Route path="/plants/:code/genomics" element={<GenomicsPage />} />
            <Route path="/plants/:code/risk" element={<RiskPage />} />
            <Route path="/plants/:code/explain" element={<ExplainPage />} />
            <Route path="/plants/:code/report" element={<ReportPage />} />
            <Route path="/environment" element={<EnvironmentPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
