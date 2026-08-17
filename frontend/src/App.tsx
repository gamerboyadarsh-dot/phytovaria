import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RegisterPlantPage } from './pages/RegisterPlantPage';
import { PlantProfilePage } from './pages/PlantProfilePage';
import { UploadVCFPage } from './pages/UploadVCFPage';
import { GenomicsPage } from './pages/GenomicsPage';
import { RiskPage } from './pages/RiskPage';
import { ExplainPage } from './pages/ExplainPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { ReportPage } from './pages/ReportPage';
import { PlantsListPage } from './pages/PlantsListPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing — no sidebar */}
        <Route path="/" element={<LandingPage />} />

        {/* App — with sidebar shell */}
        <Route element={<Shell />}>
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
  );
}
