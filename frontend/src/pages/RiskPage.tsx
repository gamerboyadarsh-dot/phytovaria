import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, Lightbulb, Upload, AlertTriangle } from 'lucide-react';
import { api, RiskReport, DiseaseRisk } from '../lib/api';

const DEMO_RISK: RiskReport = {
  plant_code: 'TOMATO-001',
  generated_at: new Date().toISOString(),
  disclaimer: 'Risk scores are evidence-weighted heuristics. Not clinically validated.',
  results: [
    {
      disease: 'Early Blight',
      risk_level: 'MEDIUM',
      risk_score: 52,
      evidence_level: 'moderate',
      contributing_variants: ['Ph-2'],
      environmental_factors: ['Temperature 29°C (warm — favourable for Alternaria)'],
      explanation: 'One susceptibility-associated gene region detected. Environmental conditions moderately favour disease development.',
      ml_prediction: { predicted_risk_level: 'MEDIUM', confidence: 0.61, class_probabilities: { LOW: 0.18, MEDIUM: 0.61, HIGH: 0.21 }, most_influential_feature: 'humidity', note: 'Demo RF pipeline — synthetic training data' },
    },
    {
      disease: 'Late Blight',
      risk_level: 'HIGH',
      risk_score: 74,
      evidence_level: 'strong',
      contributing_variants: ['Ph-2'],
      environmental_factors: ['High humidity 81% — favours Phytophthora infestans', 'Temperature 20°C — within Late Blight risk range'],
      explanation: 'Susceptibility-associated gene region detected. Environmental conditions strongly favour Late Blight development.',
      ml_prediction: { predicted_risk_level: 'HIGH', confidence: 0.78, class_probabilities: { LOW: 0.06, MEDIUM: 0.16, HIGH: 0.78 }, most_influential_feature: 'humidity', note: 'Demo RF pipeline — synthetic training data' },
    },
    {
      disease: 'Fusarium Wilt',
      risk_level: 'LOW',
      risk_score: 28,
      evidence_level: 'strong',
      contributing_variants: ['I-2', 'I-3'],
      environmental_factors: ['Temperature within moderate range'],
      explanation: 'Resistance genes I-2 and I-3 detected — conferring protection against Fusarium Wilt races 2 and 3. Risk reduced.',
      ml_prediction: { predicted_risk_level: 'LOW', confidence: 0.82, class_probabilities: { LOW: 0.82, MEDIUM: 0.14, HIGH: 0.04 }, most_influential_feature: 'resistance_gene_count', note: 'Demo RF pipeline — synthetic training data' },
    },
  ],
};

const SCORE_COLORS: Record<string, string> = {
  HIGH: 'var(--clr-high)',
  MEDIUM: 'var(--clr-med)',
  LOW: 'var(--clr-low)',
};

function RiskCard({ result }: { result: DiseaseRisk }) {
  const color = SCORE_COLORS[result.risk_level];
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{result.disease}</div>
          <div style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>
            Evidence: {result.evidence_level}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`risk-badge ${result.risk_level}`}>{result.risk_level}</span>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color, marginTop: 6 }}>
            {result.risk_score.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--clr-text-3)' }}> / 100</span>
          </div>
        </div>
      </div>

      <div className="risk-score-bar" style={{ marginBottom: 12 }}>
        <div
          className={`risk-score-fill ${result.risk_level}`}
          style={{ width: `${result.risk_score}%` }}
        />
      </div>

      <div style={{ fontSize: 13, color: 'var(--clr-text-2)', lineHeight: 1.6 }}>
        {result.explanation}
      </div>

      {result.ml_prediction && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: 'var(--clr-sci-pale)', borderRadius: 'var(--r-sm)',
          fontSize: 12, color: 'var(--clr-sci)',
        }}>
          <strong>RF Model:</strong> {result.ml_prediction.predicted_risk_level} (confidence {(result.ml_prediction.confidence * 100).toFixed(0)}%)
          · Most influential: <em>{result.ml_prediction.most_influential_feature}</em>
          · <em>{result.ml_prediction.note}</em>
        </div>
      )}
    </div>
  );
}

export function RiskPage() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [report, setReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const load = () => {
    if (!code) return;
    setLoading(true);
    api.getRisk(code)
      .then(setReport)
      .catch(() => { setReport(DEMO_RISK); setIsDemo(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [code]);

  if (loading) return <div className="loading-state"><div className="spinner" />Computing risk assessment...</div>;

  const chartData = report?.results.map((r) => ({
    name: r.disease.replace(' ', '\n'),
    score: r.risk_score,
    level: r.risk_level,
  }));

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Disease Risk Assessment</div>
          <div className="page-subtitle">{code} — Evidence-weighted susceptibility scores</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Re-run
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => nav(`/plants/${code}/explain`)}>
            <Lightbulb size={13} /> Explain
          </button>
        </div>
      </div>

      {isDemo && <div className="demo-banner"><AlertTriangle size={14} />Demo Mode — demonstration risk data. Upload a VCF and add sensor data for live assessment.</div>}

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><div className="card-title">Risk Score Overview (0–100)</div></div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border-soft)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--clr-text-2)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--clr-text-3)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${Number(v).toFixed(0)} / 100`, 'Risk Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData?.map((d, i) => (
                  <Cell key={i} fill={SCORE_COLORS[d.level]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {report?.results.map((r) => (
          <RiskCard key={r.disease} result={r} />
        ))}
      </div>

      {report?.disclaimer && (
        <div className="disclaimer" style={{ marginTop: 24 }}>
          <strong>Disclaimer:</strong> {report.disclaimer}
        </div>
      )}
    </div>
  );
}
