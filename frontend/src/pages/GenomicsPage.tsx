import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Upload } from 'lucide-react';
import { api, Variant } from '../lib/api';

const DEMO_VARIANTS: Variant[] = [
  { chromosome: '7', position: 63601400, ref_allele: 'A', alt_allele: 'G', gene_symbol: 'I-3', consequence: 'missense' },
  { chromosome: '9', position: 3341200, ref_allele: 'C', alt_allele: 'T', gene_symbol: 'Ph-2', consequence: 'missense' },
  { chromosome: '10', position: 8546020, ref_allele: 'G', alt_allele: 'A' },
  { chromosome: '11', position: 54895800, ref_allele: 'T', alt_allele: 'C', gene_symbol: 'I-2', consequence: 'synonymous' },
];

const DISEASE_MAP: Record<string, string> = {
  'I-2': 'Fusarium Wilt',
  'I-3': 'Fusarium Wilt',
  'Ph-2': 'Late Blight',
  'Ph-3': 'Late Blight',
  'Pto': 'Bacterial Speck',
  'Cf-4': 'Leaf Mold',
  'Ve': 'Verticillium Wilt',
};

export function GenomicsPage() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!code) return;
    api.getVariants(code)
      .then((v) => setVariants(v))
      .catch(() => { setVariants(DEMO_VARIANTS); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, [code]);

  const filtered = variants.filter((v) => {
    const q = search.toLowerCase();
    return !q || v.chromosome.includes(q) || String(v.position).includes(q) ||
      (v.gene_symbol?.toLowerCase().includes(q)) || (v.consequence?.toLowerCase().includes(q));
  });

  const significant = variants.filter((v) => v.gene_symbol);
  const unknown = variants.filter((v) => !v.gene_symbol);

  if (loading) return <div className="loading-state"><div className="spinner" />Loading variants...</div>;

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Genomic Analysis</div>
          <div className="page-subtitle">{code} — {variants.length} variants detected</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => nav(`/plants/${code}/upload`)}>
            <Upload size={13} /> Re-upload VCF
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => nav(`/plants/${code}/risk`)}>
            Risk Assessment <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {isDemo && <div className="demo-banner">Demo Mode — showing demonstration variants</div>}

      {/* Summary cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card brand">
          <div className="stat-label">Total Variants</div>
          <div className="stat-value">{variants.length}</div>
          <div className="stat-sub">Detected in VCF</div>
        </div>
        <div className="stat-card low">
          <div className="stat-label">Annotated</div>
          <div className="stat-value">{significant.length}</div>
          <div className="stat-sub">Matched to gene</div>
        </div>
        <div className="stat-card med">
          <div className="stat-label">Unknown</div>
          <div className="stat-value">{unknown.length}</div>
          <div className="stat-sub">No gene match</div>
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-title">No variants found</div>
            <div className="empty-sub">Upload a VCF file to begin variant interpretation.</div>
            <button className="btn btn-primary" onClick={() => nav(`/plants/${code}/upload`)}>
              <Upload size={15} /> Upload VCF
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Variant Table</div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 32, width: 220, padding: '6px 12px 6px 32px' }}
                placeholder="Filter variants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Chr</th>
                  <th>Position</th>
                  <th>Ref</th>
                  <th>Alt</th>
                  <th>Gene</th>
                  <th>Effect</th>
                  <th>Disease / Trait Association</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={i}>
                    <td><span className="mono">chr{v.chromosome}</span></td>
                    <td><span className="mono">{v.position.toLocaleString()}</span></td>
                    <td><span className="mono">{v.ref_allele}</span></td>
                    <td><span className="mono">{v.alt_allele}</span></td>
                    <td>
                      {v.gene_symbol
                        ? <span style={{ fontWeight: 600, color: 'var(--clr-brand)' }}>{v.gene_symbol}</span>
                        : <span className="text-3">—</span>}
                    </td>
                    <td>
                      {v.consequence
                        ? <span style={{ fontSize: 12, background: 'var(--clr-sci-pale)', color: 'var(--clr-sci)', padding: '2px 7px', borderRadius: 4, fontWeight: 500 }}>
                            {v.consequence}
                          </span>
                        : <span className="text-3">—</span>}
                    </td>
                    <td>
                      {v.gene_symbol && DISEASE_MAP[v.gene_symbol]
                        ? <span style={{ fontSize: 13, fontWeight: 500 }}>{DISEASE_MAP[v.gene_symbol]}</span>
                        : <span className="risk-badge UNKNOWN">Unknown / Insufficient Evidence</span>}
                    </td>
                    <td>
                      {v.gene_symbol
                        ? <span className="risk-badge LOW">Literature</span>
                        : <span className="risk-badge UNKNOWN">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-sub">No variants match your search.</div>
            </div>
          )}
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: 16 }}>
        Variants without a gene_symbol match are reported as "Unknown / Insufficient Evidence"
        and are NOT assigned any pathogenicity or disease association. Gene-disease associations
        are sourced from published tomato genetics literature (Simons et al. 1998, Catanzariti et al. 2015,
        and related SGN/TGRC resources).
      </div>
    </div>
  );
}
