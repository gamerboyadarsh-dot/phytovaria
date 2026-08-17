import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';
import { api, PlantCreate } from '../lib/api';

export function RegisterPlantPage() {
  const nav = useNavigate();
  const [form, setForm] = useState<PlantCreate>({
    plant_code: '',
    species: 'Solanum lycopersicum',
    variety: '',
    notes: '',
    sample_source: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (k: keyof PlantCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plant_code.trim()) { setError('Plant ID is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.registerPlant(form);
      nav(`/plants/${form.plant_code}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Register Plant</div>
          <div className="page-subtitle">Add a new plant sample to the analysis system</div>
        </div>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div className="card">
          <div className="card-header">
            <div className="flex flex-center gap-3">
              <div className="feature-icon green" style={{ width: 36, height: 36 }}>
                <Leaf size={18} />
              </div>
              <div className="card-title">Plant Sample Information</div>
            </div>
          </div>

          {error && <div className="error-banner"><span>{error}</span></div>}

          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Plant ID <span>required</span>
                </label>
                <input
                  className="form-input"
                  placeholder="e.g. TOMATO-001"
                  value={form.plant_code}
                  onChange={handle('plant_code')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Variety / Cultivar <span>optional</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. Heinz 1706"
                  value={form.variety}
                  onChange={handle('variety')}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Species</label>
              <input
                className="form-input"
                value={form.species}
                onChange={handle('species')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sample Source <span>optional</span></label>
              <input
                className="form-input"
                placeholder="e.g. Field plot A, Greenhouse 2"
                value={form.sample_source}
                onChange={handle('sample_source')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes <span>optional</span></label>
              <textarea
                className="form-input"
                placeholder="Any additional notes about this sample..."
                value={form.notes}
                onChange={handle('notes')}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Registering...</> : <><Leaf size={15} /> Register Plant</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => nav(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="info-banner" style={{ marginTop: 16 }}>
          After registration, you can upload a VCF file to begin genomic variant interpretation.
        </div>
      </div>
    </div>
  );
}
