import { useNavigate } from 'react-router-dom';
import { Dna, Leaf, Brain, CloudRain, ChevronRight, Microscope } from 'lucide-react';

export function LandingPage() {
  const nav = useNavigate();

  return (
    <div className="landing">
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--clr-border)',
        background: 'var(--clr-surface)',
      }}>
        <div className="logo-mark">
          <div className="logo-icon"><Dna size={18} strokeWidth={2.5} /></div>
          <div>
            <div className="logo-text">PhytoVaria</div>
            <div className="logo-sub">Genomic Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => nav('/dashboard')}>
            Explore Demo
          </button>
          <button className="btn btn-primary" onClick={() => nav('/plants/register')}>
            Register Plant
          </button>
        </div>
      </header>

      <div className="landing-hero">
        <div className="landing-eyebrow">
          <Dna size={12} />
          Smart India Hackathon 2024 — Genomics Track
        </div>

        <h1 className="landing-title">
          Genomic intelligence<br />
          for <span className="highlight">healthier crops</span>
        </h1>

        <p className="landing-desc">
          PhytoVaria interprets plant genomic variation data, matches variants against a
          curated disease-association knowledge base, combines genomic evidence with live
          environmental conditions, and generates an explainable disease-susceptibility
          risk assessment.
        </p>

        <div className="landing-cta">
          <button className="btn btn-primary btn-lg" onClick={() => nav('/dashboard')}>
            Explore Demo <ChevronRight size={16} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => nav('/plants/register')}>
            Register Plant
          </button>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon green">
              <Dna size={20} />
            </div>
            <div className="feature-title">VCF Variant Interpretation</div>
            <div className="feature-desc">
              Upload VCF files from any sequencing workflow. Variants are mapped to
              genomic coordinates and annotated against a literature-cited knowledge base.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon sci">
              <Microscope size={20} />
            </div>
            <div className="feature-title">Disease Risk Assessment</div>
            <div className="feature-desc">
              Evidence-weighted rule engine combines genomic associations and environmental
              conditions to score susceptibility for Early Blight, Late Blight, and Fusarium Wilt.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon blue">
              <Brain size={20} />
            </div>
            <div className="feature-title">Explainable AI</div>
            <div className="feature-desc">
              Every risk score comes with a full explanation: which genes were detected,
              which environmental conditions matter, and the evidence confidence level.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon amber">
              <CloudRain size={20} />
            </div>
            <div className="feature-title">Environmental Context</div>
            <div className="feature-desc">
              Live sensor integration via ESP32 + DHT22. Temperature and humidity data
              directly modulate disease risk scoring in real time.
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 64, padding: 24,
          background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
          borderRadius: 'var(--r-lg)', maxWidth: 700, margin: '64px auto 0',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: 12 }}>
            Important — Scientific Scope
          </div>
          <p style={{ fontSize: 13, color: 'var(--clr-text-2)', lineHeight: 1.7 }}>
            PhytoVaria is a <strong>genomic variation interpretation platform</strong>.
            It does not perform sequencing; it ingests existing VCF data and interprets it
            against published gene-disease associations. Risk scores are evidence-weighted
            heuristics, not calibrated clinical probabilities. This prototype uses
            synthetic demonstration data and has not been field-validated.
          </p>
        </div>
      </div>
    </div>
  );
}
