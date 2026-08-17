import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react';
import { api, VCFUploadResult } from '../lib/api';

type Step = 'idle' | 'uploading' | 'parsing' | 'interpreting' | 'done' | 'error';

const STEPS: { key: Step; label: string }[] = [
  { key: 'uploading', label: 'Uploading file' },
  { key: 'parsing', label: 'Parsing variants' },
  { key: 'interpreting', label: 'Interpreting & annotating' },
  { key: 'done', label: 'Complete' },
];

function getStepState(current: Step, step: Step) {
  const order = ['uploading', 'parsing', 'interpreting', 'done'];
  const ci = order.indexOf(current);
  const si = order.indexOf(step);
  if (current === 'error') return si < ci ? 'done' : si === ci ? 'error' : 'idle';
  if (si < ci) return 'done';
  if (si === ci) return 'active';
  return 'idle';
}

export function UploadVCFPage() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [result, setResult] = useState<VCFUploadResult | null>(null);
  const [error, setError] = useState('');

  const pickFile = (f: File) => {
    if (!f.name.match(/\.(vcf|vcf\.gz)$/i)) {
      setError('Please select a valid .vcf file.');
      return;
    }
    setFile(f);
    setError('');
    setStep('idle');
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  const upload = async () => {
    if (!file || !code) return;
    setError('');
    try {
      setStep('uploading');
      await new Promise((r) => setTimeout(r, 600));
      setStep('parsing');
      const res = await api.uploadVCF(code, file);
      setStep('interpreting');
      await new Promise((r) => setTimeout(r, 500));
      setStep('done');
      setResult(res);
    } catch (err: any) {
      setStep('error');
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Upload VCF</div>
          <div className="page-subtitle">
            {code} — Submit genomic variant data for interpretation
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>
        {error && <div className="error-banner"><XCircle size={15} />{error}</div>}

        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Select VCF File</div>

          {step === 'idle' || step === 'error' ? (
            <>
              <div
                className={`drop-zone ${dragging ? 'drag-over' : ''}`}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => document.getElementById('vcf-input')?.click()}
              >
                <div className="drop-zone-icon">
                  <Upload size={48} strokeWidth={1.5} />
                </div>
                <div className="drop-zone-title">
                  {file ? file.name : 'Drop VCF file here or click to browse'}
                </div>
                <div className="drop-zone-sub">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB — Ready to upload`
                    : 'Supports .vcf format (VCFv4.x)'}
                </div>
                <input
                  id="vcf-input"
                  type="file"
                  accept=".vcf"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </div>

              {file && (
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" onClick={upload}>
                    <Upload size={15} /> Upload &amp; Analyse
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setFile(null); setError(''); }}>
                    Clear
                  </button>
                </div>
              )}
            </>
          ) : step === 'done' && result ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <CheckCircle2 size={32} style={{ color: 'var(--clr-brand)' }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Analysis Complete</div>
                  <div style={{ fontSize: 13, color: 'var(--clr-text-3)' }}>
                    {result.variants_parsed} variants parsed · {result.variants_linked} linked to knowledge base
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => nav(`/plants/${code}/risk`)}>
                  View Risk Assessment <ArrowRight size={15} />
                </button>
                <button className="btn btn-secondary" onClick={() => nav(`/plants/${code}/genomics`)}>
                  <FileText size={15} /> View Variants
                </button>
                <button className="btn btn-ghost" onClick={() => { setStep('idle'); setFile(null); setResult(null); }}>
                  Upload Another
                </button>
              </div>
            </div>
          ) : (
            <div className="progress-steps" style={{ padding: '8px 0' }}>
              {STEPS.map(({ key, label }) => {
                const state = getStepState(step, key);
                return (
                  <div key={key} className={`progress-step ${state}`}>
                    {state === 'done' ? <CheckCircle2 size={18} style={{ color: 'var(--clr-brand)' }} /> :
                     state === 'active' ? <div className="spinner" /> :
                     state === 'error' ? <XCircle size={18} style={{ color: 'var(--clr-high)' }} /> :
                     <div style={{ width: 18, height: 18, border: '2px solid var(--clr-border)', borderRadius: '50%' }} />}
                    {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="info-banner" style={{ marginTop: 16 }}>
          <span>
            <strong>Demo VCF:</strong> Use <code style={{ fontFamily: 'var(--font-mono)', background: 'transparent', fontSize: 12 }}>backend/data/demo_sample.vcf</code> from the repository for a working demonstration. Positions are synthetic but land on verified gene windows.
          </span>
        </div>

        <div className="disclaimer" style={{ marginTop: 16 }}>
          VCF data is parsed using a pure-Python parser against the SL4.0 reference coordinate system.
          Variants are annotated at the gene level (not base-pair level) using verified coordinate windows from ITAG/SGN.
          Unknown variants are reported as UNKNOWN EVIDENCE — they are not assigned pathogenicity.
        </div>
      </div>
    </div>
  );
}
