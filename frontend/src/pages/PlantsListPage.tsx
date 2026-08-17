import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { api, Plant } from '../lib/api';

const DEMO_PLANTS: Plant[] = [
  { id: 1, plant_code: 'TOMATO-001', species: 'Solanum lycopersicum', variety: 'Heinz 1706', notes: 'Greenhouse sample A', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 2, plant_code: 'TOMATO-002', species: 'Solanum lycopersicum', variety: 'Roma VF', notes: 'Field plot B', created_at: new Date(Date.now() - 86400000).toISOString() },
];

export function PlantsListPage() {
  const nav = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    api.listPlants()
      .then(setPlants)
      .catch(() => { setPlants(DEMO_PLANTS); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner" />Loading plants...</div>;

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Plants</div>
          <div className="page-subtitle">{plants.length} registered samples</div>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/plants/register')}>
          <PlusCircle size={15} /> Register Plant
        </button>
      </div>

      {isDemo && <div className="demo-banner">Demo Mode — showing demonstration plants</div>}

      {plants.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-title">No plants registered yet</div>
            <div className="empty-sub">Register your first plant sample to begin genomic analysis.</div>
            <button className="btn btn-primary" onClick={() => nav('/plants/register')}>
              <PlusCircle size={15} /> Register Plant
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plant ID</th>
                  <th>Species</th>
                  <th>Variety</th>
                  <th>Sample Source</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plants.map((p) => (
                  <tr key={p.id}>
                    <td><span className="mono">{p.plant_code}</span></td>
                    <td style={{ fontStyle: 'italic', fontSize: 13 }}>{p.species}</td>
                    <td>{p.variety || <span className="text-3">—</span>}</td>
                    <td className="text-3">{(p as any).sample_source || '—'}</td>
                    <td className="text-3 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
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
        </div>
      )}
    </div>
  );
}
