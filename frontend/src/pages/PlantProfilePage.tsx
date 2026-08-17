import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, BarChart3, Lightbulb, FileText, Leaf, Calendar, Microscope } from 'lucide-react';
import { api, Plant, EnvironmentReading } from '../lib/api';

const DEMO_PLANT: Plant = {
  id: 1, plant_code: 'TOMATO-001', species: 'Solanum lycopersicum',
  variety: 'Heinz 1706', notes: 'Greenhouse sample A',
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
};

export function PlantProfilePage() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [env, setEnv] = useState<EnvironmentReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!code) return;
    Promise.all([api.getPlant(code), api.getLatestEnv(code).catch(() => null)])
      .then(([p, e]) => { setPlant(p); setEnv(e); })
      .catch(() => { setPlant(DEMO_PLANT); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="loading-state"><div className="spinner" />Loading plant...</div>;
  if (!plant) return <div className="error-banner">Plant not found.</div>;

  const QuickAction = ({ icon, label, sub, path }: { icon: React.ReactNode; label: string; sub: string; path: string }) => (
    <button
      className="card"
      style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--clr-border)', width: '100%' }}
      onClick={() => nav(path)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: 'var(--clr-brand)', flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>{sub}</div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">{plant.plant_code}</div>
          <div className="page-subtitle" style={{ fontStyle: 'italic' }}>{plant.species}</div>
        </div>
      </div>

      {isDemo && <div className="demo-banner">Demo Mode — showing demonstration data</div>}

      <div className="grid-2">
        {/* Plant Info */}
        <div className="card">
          <div className="card-header">
            <div className="flex flex-center gap-3">
              <Leaf size={16} style={{ color: 'var(--clr-brand)' }} />
              <div className="card-title">Plant Information</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Plant ID', <span className="mono">{plant.plant_code}</span>],
              ['Species', <em>{plant.species}</em>],
              ['Variety', plant.variety || '—'],
              ['Sample Source', (plant as any).sample_source || '—'],
              ['Notes', plant.notes || '—'],
              ['Registered', new Date(plant.created_at).toLocaleString()],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--clr-border-soft)', paddingBottom: 8, fontSize: 13.5 }}>
                <span style={{ color: 'var(--clr-text-3)', fontWeight: 500 }}>{k}</span>
                <span style={{ textAlign: 'right', maxWidth: '60%' }}>{v as any}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Snapshot */}
        <div className="card">
          <div className="card-header">
            <div className="flex flex-center gap-3">
              <Microscope size={16} style={{ color: 'var(--clr-info)' }} />
              <div className="card-title">Environmental Snapshot</div>
            </div>
          </div>
          {env ? (
            <div className="sensor-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="sensor-card">
                <div className="sensor-label">Temperature</div>
                <div className="sensor-value">{env.temperature?.toFixed(1) ?? '—'}<span className="sensor-unit">°C</span></div>
              </div>
              <div className="sensor-card">
                <div className="sensor-label">Humidity</div>
                <div className="sensor-value">{env.humidity?.toFixed(0) ?? '—'}<span className="sensor-unit">%</span></div>
              </div>
              <div className="sensor-card">
                <div className="sensor-label">Soil Moisture</div>
                <div className="sensor-value">{env.soil_moisture?.toFixed(0) ?? '—'}<span className="sensor-unit">%</span></div>
              </div>
              <div className="sensor-card">
                <div className="sensor-label">Light</div>
                <div className="sensor-value">{env.light?.toFixed(0) ?? '—'}<span className="sensor-unit" style={{ fontSize: 12 }}>lux</span></div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-sub">No sensor data yet. Connect ESP32 or use Demo Mode on the Environment page.</div>
              <button className="btn btn-ghost btn-sm" onClick={() => nav('/environment')}>
                Go to Environment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <QuickAction icon={<Upload size={20} />} label="Upload VCF" sub="Submit genomic variant data" path={`/plants/${code}/upload`} />
          <QuickAction icon={<Microscope size={20} />} label="View Variants" sub="Browse annotated variants" path={`/plants/${code}/genomics`} />
          <QuickAction icon={<BarChart3 size={20} />} label="Disease Risk" sub="View risk assessment" path={`/plants/${code}/risk`} />
          <QuickAction icon={<Lightbulb size={20} />} label="Explanation" sub="Why is the risk high?" path={`/plants/${code}/explain`} />
          <QuickAction icon={<FileText size={20} />} label="Full Report" sub="Print or export report" path={`/plants/${code}/report`} />
        </div>
      </div>
    </div>
  );
}
