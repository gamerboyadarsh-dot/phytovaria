import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Info, Dna, CloudRain, Brain } from 'lucide-react';
import { api, RiskReport, DiseaseRisk } from '../lib/api';

const DEMO_RISK: RiskReport = {
  plant_code: 'TOMATO-001',
  generated_at: new Date().toISOString(),
  disclaimer: 'Risk scores are evidence-weighted heuristics. Not clinically validated.',
  results: [
    {
      disease: 'Late Blight',
      risk_level: 'HIGH',
      risk_score: 74,
      evidence_level: 'strong',
      contributing_variants: ['Ph-2 (chromosome 10 susceptibility region)'],
      environmental_factors: ['High humidity 81% — favours Phytophthora infestans', 'Temperature 20°C — within Late Blight risk range'],
      explanation: 'Susceptibility-associated gene region detected. Environmental conditions strongly favour Late Blight.',
      ml_prediction: { predicted_risk_level: 'HIGH', confidence: 0.78, class_probabilities: { LOW: 0.06, MEDIUM: 0.16, HIGH: 0.78 }, most_influential_feature: 'humidity', note: 'Demo RF pipeline' },
    },
    {
      disease: 'Early Blight',
      risk_level: 'MEDIUM',
      risk_score: 52,
      evidence_level: 'moderate',
      contributing_variants: [],
      environmental_factors: ['Temperature 29°C — warm, favours Alternaria'],
      explanation: 'No resistance gene detected for Early Blight. Environmental conditions moderately favour disease.',
    },
    {
      disease: 'Fusarium Wilt',
      risk_level: 'LOW',
      risk_score: 28,
      evidence_level: 'strong',
      contributing_variants: ['I-2 (chromosome 11 — cloned NBS-LRR resistance)', 'I-3 (chromosome 7 — race 3 resistance)'],
      environmental_factors: [],
      explanation: 'Resistance genes I-2 and I-3 detected. Low risk for Fusarium Wilt races 2 and 3.',
    },
  ],
};

function ExplainBlock({ result }: { result: DiseaseRisk }) {
  const riskColor = result.risk_level === 'HIGH' ? 'var(--clr-high)' : result.risk_level === 'MEDIUM' ? 'var(--clr-med)' : 'var(--clr-low)';

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{result.disease}</div>
        <span className={`risk-badge ${result.risk_level}`}>{result.risk_level} — Score {result.risk_score.toFixed(0)}/100</span>
      </div>

      {/* Genomic Evidence */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--clr-text-3)' }}>
          <Dna size={14} style={{ color: 'var(--clr-brand)' }} /> Genomic Evidence
        </div>
        {result.contributing_variants.length > 0 ? (
          result.contributing_variants.map((v, i) => (
            <div key={i} className="evidence-item">
              <CheckCircle2 size={18} className="ev-icon check" />
              <span>{v}</span>
            </div>
          ))
        ) : (
          <div className="evidence-item">
            <Info size={18} className="ev-icon info" />
            <span>No disease-associated variants detected for this condition</span>
          </div>
        )}
      </div>

      {/* Environmental Evidence */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--clr-text-3)' }}>
          <CloudRain size={14} style={{ color: 'var(--clr-info)' }} /> Environmental Evidence
        </div>
        {result.environmental_factors.length > 0 ? (
          result.environmental_factors.map((f, i) => (
            <div key={i} className="evidence-item">
              <AlertTriangle size={18} className="ev-icon warn" />
              <span>{f}</span>
            </div>
          ))
        ) : (
          <div className="evidence-item">
            <CheckCircle2 size={18} className="ev-icon check" />
            <span>Environmental conditions do not significantly favour this disease</span>
          </div>
        )}
      </div>

      {/* ML Evidence */}
      {result.ml_prediction && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--clr-text-3)' }}>
            <Brain size={14} style={{ color: 'var(--clr-sci)' }} /> Random Forest Model Evidence
          </div>
          <div className="evidence-item">
            <Info size={18} className="ev-icon info" />
            <div>
              <div>Prediction: <strong>{result.ml_prediction.predicted_risk_level}</strong></div>
              <div style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 2 }}>
                Confidence: {(result.ml_prediction.confidence * 100).toFixed(0)}% ·
                Key feature: <em>{result.ml_prediction.most_influential_feature}</em>
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 2, fontStyle: 'italic' }}>
                {result.ml_prediction.note}
              </div>
            </div>
          </div>
          {/* Probability bars */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(result.ml_prediction.class_probabilities).map(([cls, prob]) => (
              <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                <span style={{ width: 60, color: 'var(--clr-text-2)', fontWeight: 500 }}>{cls}</span>
                <div style={{ flex: 1, background: 'var(--clr-surface-2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${prob * 100}%`, height: '100%', background: cls === 'HIGH' ? 'var(--clr-high)' : cls === 'MEDIUM' ? 'var(--clr-med)' : 'var(--clr-low)', borderRadius: 4 }} />
                </div>
                <span style={{ width: 36, textAlign: 'right', color: 'var(--clr-text-3)' }}>{(prob * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall */}
      <div style={{
        background: result.risk_level === 'HIGH' ? 'var(--clr-high-pale)' : result.risk_level === 'MEDIUM' ? 'var(--clr-med-pale)' : 'var(--clr-low-pale)',
        borderRadius: 'var(--r-md)', padding: '12px 16px', marginTop: 8,
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: riskColor, marginBottom: 4 }}>
          Overall Assessment: {result.risk_level}
        </div>
        <div style={{ fontSize: 13, color: 'var(--clr-text-2)', lineHeight: 1.6 }}>
          {result.explanation}
        </div>
      </div>
    </div>
  );
}

export function ExplainPage() {
  const { code } = useParams<{ code: string }>();
  const [report, setReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!code) return;
    api.getRisk(code)
      .then(setReport)
      .catch(() => { setReport(DEMO_RISK); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="loading-state"><div className="spinner" />Loading explanation...</div>;

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Risk Explanation</div>
          <div className="page-subtitle">{code} — Why is the risk assessment what it is?</div>
        </div>
      </div>

      {isDemo && <div className="demo-banner">Demo Mode — demonstration explanation data</div>}

      <div className="info-banner" style={{ marginBottom: 24 }}>
        <Info size={15} />
        This page explains how the risk assessment was derived: genomic evidence, environmental
        conditions, and the Random Forest model's contribution.
      </div>

      {report?.results.map((r) => <ExplainBlock key={r.disease} result={r} />)}

      <div className="disclaimer">
        <strong>Methodology:</strong> Risk scores combine a rule-based genomic component (0–50)
        and an environmental component (0–50). Genomic evidence is sourced from published
        tomato genetics literature. Environmental rules reflect established plant pathology.
        The Random Forest pipeline was trained on synthetic rule-derived demonstration data
        and has not been validated on real field outcomes. See the full report for citations.
      </div>
    </div>
  );
}
