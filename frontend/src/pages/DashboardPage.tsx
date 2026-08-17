import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { PlusCircle, ArrowRight, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { api, DashboardStats, Plant } from '../lib/api';

const RISK_COLORS = { HIGH: 'var(--clr-high)', MEDIUM: 'var(--clr-med)', LOW: 'var(--clr-low)' };

// Demo data for when backend is unavailable
const DEMO_STATS: DashboardStats = {
  total_plants: 5,
  high_risk: 2,
  moderate_risk: 2,
  low_risk: 1,
  plants_analyzed: 4,
  recent_analyses: [
    { plant_code: 'TOMATO-001', disease: 'Late Blight', risk_level: 'HIGH', risk_score: 74, created_at: new Date().toISOString() },
    { plant_code: 'TOMATO-001', disease: 'Early Blight', risk_level: 'MEDIUM', risk_score: 52, created_at: new Date().toISOString() },
    { plant_code: 'TOMATO-001', disease: 'Fusarium Wilt', risk_level: 'LOW', risk_score: 28, created_at: new Date().toISOString() },
  ],
};

const DEMO_PLANTS: Plant[] = [
  { id: 1, plant_code: 'TOMATO-001', species: 'Solanum lycopersicum', variety: 'Heinz 1706', created_at: new Date().toISOString() },
];

function RiskLevelBadge({ level }: { level: string }) {
  return <span className={`risk-badge ${level}`}>{level}</span>;
}

export function DashboardPage() {
  const nav = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    Promise.all([api.getStats(), api.listPlants()])
      .then(([s, p]) => { setStats(s); setPlants(p); })
      .catch(() => { setStats(DEMO_STATS); setPlants(DEMO_PLANTS); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      Loading dashboard...
    </div>
  );

  const pieData = stats ? [
    { name: 'High Risk', value: stats.high_risk, color: 'var(--clr-high)' },
    { name: 'Moderate', value: stats.moderate_risk, color: 'var(--clr-med)' },
    { name: 'Low Risk', value: stats.low_risk, color: 'var(--clr-low)' },
  ] : [];

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Genomic risk overview — Solanum lycopersicum</div>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/plants/register')}>
          <PlusCircle size={15} /> Register Plant
        </button>
      </div>

      {isDemo && (
        <div className="demo-banner">
          <AlertTriangle size={15} />
          Demo Mode — backend offline. Showing demonstration data.
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card brand">
          <div className="stat-label">Total Plants</div>
          <div className="stat-value">{stats?.total_plants ?? 0}</div>
          <div className="stat-sub">Registered in system</div>
        </div>
        <div className="stat-card high">
          <div className="stat-label">High Risk</div>
          <div className="stat-value">{stats?.high_risk ?? 0}</div>
          <div className="stat-sub">Plants flagged HIGH</div>
        </div>
        <div className="stat-card med">
          <div className="stat-label">Moderate Risk</div>
          <div className="stat-value">{stats?.moderate_risk ?? 0}</div>
          <div className="stat-sub">Plants flagged MEDIUM</div>
        </div>
        <div className="stat-card low">
          <div className="stat-label">Low Risk</div>
          <div className="stat-value">{stats?.low_risk ?? 0}</div>
          <div className="stat-sub">Plants flagged LOW</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Analyzed</div>
          <div className="stat-value">{stats?.plants_analyzed ?? 0}</div>
          <div className="stat-sub">With risk assessment</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Risk Distribution</div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [v, '']}
                  contentStyle={{
                    background: 'var(--clr-surface)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Analyses</div>
          </div>
          {stats?.recent_analyses?.length ? (
            <div className="progress-steps">
              {stats.recent_analyses.slice(0, 5).map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--clr-border-soft)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.plant_code}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-text-3)' }}>{a.disease}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <RiskLevelBadge level={a.risk_level} />
                    <div style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 3 }}>
                      Score: {a.risk_score.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-sub">No analyses yet. Register a plant and upload a VCF.</div>
            </div>
          )}
        </div>
      </div>

      {/* Plants Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Registered Plants</div>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/plants')}>
            View all <ArrowRight size={13} />
          </button>
        </div>
        {plants.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plant ID</th>
                  <th>Species</th>
                  <th>Variety</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plants.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td><span className="mono">{p.plant_code}</span></td>
                    <td style={{ fontStyle: 'italic', fontSize: 13 }}>{p.species}</td>
                    <td>{p.variety || <span style={{ color: 'var(--clr-text-3)' }}>—</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--clr-text-3)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => nav(`/plants/${p.plant_code}`)}>
                        View <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-title">No plants registered</div>
            <div className="empty-sub">Register your first tomato plant to begin genomic analysis.</div>
            <button className="btn btn-primary" onClick={() => nav('/plants/register')}>
              <PlusCircle size={15} /> Register Plant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
