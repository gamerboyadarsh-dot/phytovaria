import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, AlertTriangle } from 'lucide-react';
import { api, RiskReport, Variant, EnvironmentReading, Plant } from '../lib/api';

const DEMO_PLANT: Plant = {
  id: 1, plant_code: 'TOMATO-001', species: 'Solanum lycopersicum',
  variety: 'Heinz 1706', notes: 'Greenhouse sample A',
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
};

const DEMO_VARIANTS: Variant[] = [
  { chromosome: '7', position: 63601400, ref_allele: 'A', alt_allele: 'G', gene_symbol: 'I-3', consequence: 'missense' },
  { chromosome: '11', position: 54895800, ref_allele: 'T', alt_allele: 'C', gene_symbol: 'I-2', consequence: 'synonymous' },
  { chromosome: '9', position: 3341200, ref_allele: 'C', alt_allele: 'T', gene_symbol: 'Ph-2', consequence: 'missense' },
];

const DEMO_RISK: RiskReport = {
  plant_code: 'TOMATO-001',
  generated_at: new Date().toISOString(),
  disclaimer: 'Risk scores are evidence-weighted heuristics. Not clinically validated probabilities.',
  results: [
    { disease: 'Late Blight', risk_level: 'HIGH', risk_score: 74, evidence_level: 'strong', contributing_variants: ['Ph-2'], environmental_factors: ['High humidity — favours Phytophthora infestans'], explanation: 'Susceptibility-associated gene region detected. Environmental conditions strongly favour disease.' },
    { disease: 'Early Blight', risk_level: 'MEDIUM', risk_score: 52, evidence_level: 'moderate', contributing_variants: [], environmental_factors: ['Temperature warm — moderately favours Alternaria'], explanation: 'No resistance gene; environmental conditions moderately favour disease.' },
    { disease: 'Fusarium Wilt', risk_level: 'LOW', risk_score: 28, evidence_level: 'strong', contributing_variants: ['I-2', 'I-3'], environmental_factors: [], explanation: 'Resistance genes I-2 and I-3 detected — conferring protection.' },
  ],
};

const SCORE_COLORS: Record<string, string> = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#166534' };
const RISK_BG: Record<string, string> = { HIGH: '#fef2f2', MEDIUM: '#fffbeb', LOW: '#f0fdf4' };

export function ReportPage() {
  const { code } = useParams<{ code: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [risk, setRisk] = useState<RiskReport | null>(null);
  const [env, setEnv] = useState<EnvironmentReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!code) return;
    Promise.all([
      api.getPlant(code).catch(() => DEMO_PLANT),
      api.getVariants(code).catch(() => DEMO_VARIANTS),
      api.getRisk(code).catch(() => DEMO_RISK),
      api.getLatestEnv(code).catch(() => null),
    ]).then(([p, v, r, e]) => {
      setPlant(p);
      setVariants(v);
      setRisk(r);
      setEnv(e);
    }).catch(() => {
      setPlant(DEMO_PLANT); setVariants(DEMO_VARIANTS);
      setRisk(DEMO_RISK); setIsDemo(true);
    }).finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="loading-state"><div className="spinner" />Building report...</div>;

  const generatedAt = risk?.generated_at ? new Date(risk.generated_at).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="fade-in">
      {/* Screen-only toolbar */}
      <div className="topbar" style={{ printVisibility: 'hidden' } as any}>
        <div>
          <div className="page-title">Plant Health Report</div>
          <div className="page-subtitle">{code} — Generated {generatedAt}</div>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={15} /> Print / Export PDF
        </button>
      </div>

      {isDemo && <div className="demo-banner"><AlertTriangle size={14} />Demo Mode — demonstration report data</div>}

      {/* Report Content */}
      <div id="report-content" style={{ maxWidth: 760 }}>

        {/* Header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>
                PhytoVaria Plant Health Report
              </div>
              <div style={{ fontSize: 13, color: 'var(--clr-text-3)', marginTop: 4 }}>
                Genomic Variation Interpretation · <em>Solanum lycopersicum</em>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--clr-text-3)' }}>
              <div>Generated: {generatedAt}</div>
              <div>Report ID: {code}-{Date.now().toString(36).toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Plant Summary */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-3)', marginBottom: 12 }}>
            1. Plant Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {[
              ['Plant ID', plant?.plant_code],
              ['Species', plant?.species],
              ['Variety', plant?.variety || '—'],
              ['Registered', plant ? new Date(plant.created_at).toLocaleDateString() : '—'],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--clr-text-3)', marginRight: 8 }}>{k}:</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Genomic Findings */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-3)', marginBottom: 12 }}>
            2. Genomic Findings — {variants.length} Variants Detected
          </div>
          {variants.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Chr</th><th>Position</th><th>Ref</th><th>Alt</th>
                    <th>Gene</th><th>Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.slice(0, 10).map((v, i) => (
                    <tr key={i}>
                      <td><span className="mono">chr{v.chromosome}</span></td>
                      <td><span className="mono">{v.position.toLocaleString()}</span></td>
                      <td><span className="mono">{v.ref_allele}</span></td>
                      <td><span className="mono">{v.alt_allele}</span></td>
                      <td style={{ fontWeight: v.gene_symbol ? 600 : 400, color: v.gene_symbol ? 'var(--clr-brand)' : 'var(--clr-text-3)' }}>
                        {v.gene_symbol || 'Unknown'}
                      </td>
                      <td>{v.consequence || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--clr-text-3)', fontSize: 13 }}>No variants available. Upload a VCF file.</div>
          )}
        </div>

        {/* Disease Risk */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-3)', marginBottom: 16 }}>
            3. Disease Risk Assessment
          </div>
          {risk?.results.map((r) => (
            <div key={r.disease} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', marginBottom: 8, borderRadius: 'var(--r-md)',
              background: RISK_BG[r.risk_level],
              border: `1px solid ${SCORE_COLORS[r.risk_level]}33`,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.disease}</div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-2)', marginTop: 2 }}>{r.explanation}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                <span className={`risk-badge ${r.risk_level}`}>{r.risk_level}</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: SCORE_COLORS[r.risk_level], marginTop: 4 }}>
                  {r.risk_score.toFixed(0)}/100
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Environmental Conditions */}
        {env && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-3)', marginBottom: 12 }}>
              4. Environmental Conditions at Analysis
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {[
                ['Temperature', `${env.temperature?.toFixed(1) ?? '—'} °C`],
                ['Humidity', `${env.humidity?.toFixed(0) ?? '—'} %`],
                ['Soil Moisture', `${env.soil_moisture?.toFixed(0) ?? '—'} %`],
                ['Light', `${env.light?.toFixed(0) ?? '—'} lux`],
              ].map(([k, v]) => (
                <div key={String(k)} className="sensor-card" style={{ padding: 12 }}>
                  <div className="sensor-label">{k}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Methodology & Limitations */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-3)', marginBottom: 12 }}>
            5. Methodology, Evidence Sources &amp; Limitations
          </div>
          <div style={{ fontSize: 13, color: 'var(--clr-text-2)', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 10 }}>
              <strong>Genomic data source:</strong> Variant Call Format (VCF) files uploaded by the user.
              Reference genome: <em>Solanum lycopersicum</em> SL4.0 (ITAG 4.0).
            </p>
            <p style={{ marginBottom: 10 }}>
              <strong>Evidence source:</strong> Knowledge base curated from published tomato genetics literature:
              Simons et al. 1998 (I-2, Plant Cell); Catanzariti et al. 2015 (I-3, New Phytologist);
              Chunwongse et al. 1994 (Ph-2, Theor. Appl. Genet.); and related SGN/TGRC resources.
            </p>
            <p style={{ marginBottom: 10 }}>
              <strong>Interpretation method:</strong> Rule-based genomic component (0–50 points) + environmental
              component (0–50 points) = total risk score (0–100). This is a heuristic score, NOT a calibrated
              probability. A supplementary Random Forest model trained on synthetic rule-derived data provides
              a secondary confidence estimate.
            </p>
            <p style={{ marginBottom: 10 }}>
              <strong>Model limitations:</strong> The Random Forest pipeline has been trained on synthetic,
              rule-derived demonstration data. It has NOT been trained on real field diagnostic outcomes and
              should not be interpreted as a validated predictive model.
            </p>
            <p>
              <strong>Hardware limitation:</strong> Environmental readings are from ESP32 + DHT22 sensor.
              These are indicative measurements only.
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-3)', marginBottom: 12 }}>
            6. Recommendations
          </div>
          <div style={{ fontSize: 13, color: 'var(--clr-text-2)', lineHeight: 1.8 }}>
            {risk?.results.filter((r) => r.risk_level === 'HIGH').map((r) => (
              <div key={r.disease} style={{ marginBottom: 10 }}>
                <strong>{r.disease} (HIGH risk):</strong> Consult with an agronomist. Consider preventive fungicide applications where appropriate. Monitor environmental conditions closely.
              </div>
            ))}
            {risk?.results.filter((r) => r.risk_level === 'MEDIUM').map((r) => (
              <div key={r.disease} style={{ marginBottom: 10 }}>
                <strong>{r.disease} (MEDIUM risk):</strong> Monitor regularly. Consider environmental control measures (ventilation, irrigation management).
              </div>
            ))}
            <div style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--clr-text-3)' }}>
              These recommendations are for demonstration purposes only. Always consult qualified agricultural experts before making farming decisions.
            </div>
          </div>
        </div>

        {/* Disclaimer footer */}
        <div className="disclaimer">
          {risk?.disclaimer}
          <br /><br />
          PhytoVaria is a genomics platform for research and assessment.
          It is intended as a demonstration of genomic interpretation technology.
          This report should NOT be used as the sole basis for agricultural decision-making.
        </div>
      </div>
    </div>
  );
}
