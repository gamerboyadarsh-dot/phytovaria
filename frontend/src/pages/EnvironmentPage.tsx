import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RefreshCw, Wifi, WifiOff, Thermometer, Droplets } from 'lucide-react';
import { api, EnvironmentReading, DemoSensor } from '../lib/api';

const DEFAULT_PLANT = 'TOMATO-001';

const DEMO_READING: DemoSensor = {
  plant_id: DEFAULT_PLANT,
  temperature: 29.4,
  humidity: 81.0,
  soil_moisture: 55.0,
  light: 620.0,
  timestamp: new Date().toISOString(),
  mode: 'DEMO',
};

function generateDemoHistory(): EnvironmentReading[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    temperature: 27 + Math.sin(i * 0.5) * 3,
    humidity: 78 + Math.cos(i * 0.4) * 6,
    soil_moisture: 52 + Math.sin(i * 0.3) * 5,
    light: 600 + Math.cos(i * 0.6) * 80,
    timestamp: new Date(Date.now() - (11 - i) * 5 * 60 * 1000).toISOString(),
  }));
}

export function EnvironmentPage() {
  const [mode, setMode] = useState<'live' | 'demo'>('live');
  const [reading, setReading] = useState<DemoSensor | null>(null);
  const [history, setHistory] = useState<EnvironmentReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLive = async () => {
    try {
      const env = await api.getLatestEnv(DEFAULT_PLANT);
      setReading({ ...(env as any), plant_id: DEFAULT_PLANT, mode: 'LIVE' });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      // fallback to demo if live fails
      const demo = await api.getDemoSensor().catch(() => DEMO_READING);
      setReading({ ...demo, mode: 'DEMO' });
      setLastUpdate(new Date().toLocaleTimeString());
    }
  };

  const loadHistory = async () => {
    try {
      const h = await api.getEnvHistory(DEFAULT_PLANT);
      setHistory(h);
    } catch {
      setHistory(generateDemoHistory());
    }
  };

  const loadDemo = async () => {
    const demo = await api.getDemoSensor().catch(() => DEMO_READING);
    setReading({ ...demo, mode: 'DEMO', timestamp: new Date().toISOString() });
    setHistory(generateDemoHistory());
    setLastUpdate(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (mode === 'live') { await loadLive(); await loadHistory(); }
      else { await loadDemo(); }
      setLoading(false);
    };
    load();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (mode === 'live') loadLive();
      else loadDemo();
    }, 30000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode]);

  const chartData = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: h.temperature?.toFixed(1),
    humidity: h.humidity?.toFixed(0),
  }));

  const isLive = reading?.mode === 'LIVE';

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="page-title">Environmental Monitoring</div>
          <div className="page-subtitle">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status-dot ${isLive ? 'live' : 'demo'}`} />
              {isLive ? 'Live sensor data' : 'Demo sensor data'} · Updated {lastUpdate || '—'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="mode-toggle">
            <button className={`mode-btn ${mode === 'live' ? 'active' : ''}`} onClick={() => setMode('live')}>
              <Wifi size={12} style={{ display: 'inline', marginRight: 4 }} />Live
            </button>
            <button className={`mode-btn ${mode === 'demo' ? 'active' : ''}`} onClick={() => setMode('demo')}>
              Demo
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => mode === 'live' ? loadLive() : loadDemo()}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {mode === 'demo' && (
        <div className="demo-banner">
          Demo Mode — simulated sensor readings. Switch to Live mode when ESP32 is connected.
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" />Reading sensor data...</div>
      ) : (
        <>
          {/* Sensor Widgets */}
          <div className="sensor-grid" style={{ marginBottom: 24 }}>
            <div className="sensor-card">
              <Thermometer size={24} className="sensor-icon" />
              <div className="sensor-label">Temperature</div>
              <div className="sensor-value">
                {reading?.temperature?.toFixed(1) ?? '—'}
                <span className="sensor-unit">°C</span>
              </div>
              <div style={{ fontSize: 11, color: reading && reading.temperature! > 28 ? 'var(--clr-high)' : 'var(--clr-text-3)', marginTop: 4 }}>
                {reading && reading.temperature! > 28 ? '⚠ High — Blight risk' : 'Normal range'}
              </div>
            </div>

            <div className="sensor-card">
              <Droplets size={24} className="sensor-icon" />
              <div className="sensor-label">Humidity</div>
              <div className="sensor-value">
                {reading?.humidity?.toFixed(0) ?? '—'}
                <span className="sensor-unit">%</span>
              </div>
              <div style={{ fontSize: 11, color: reading && reading.humidity! > 75 ? 'var(--clr-high)' : 'var(--clr-text-3)', marginTop: 4 }}>
                {reading && reading.humidity! > 75 ? '⚠ High — Favours Late Blight' : 'Moderate'}
              </div>
            </div>

            <div className="sensor-card">
              <div className="sensor-icon">💧</div>
              <div className="sensor-label">Soil Moisture</div>
              <div className="sensor-value">
                {reading?.soil_moisture?.toFixed(0) ?? '—'}
                <span className="sensor-unit">%</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 4 }}>
                Moderate
              </div>
            </div>

            <div className="sensor-card">
              <div className="sensor-icon">☀️</div>
              <div className="sensor-label">Light Intensity</div>
              <div className="sensor-value">
                {reading?.light?.toFixed(0) ?? '—'}
                <span className="sensor-unit" style={{ fontSize: 14 }}>lux</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 4 }}>
                Normal
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Temperature &amp; Humidity Trend</div>
              <div style={{ fontSize: 12, color: 'var(--clr-text-3)' }}>Last 12 readings</div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border-soft)" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--clr-text-3)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--clr-text-3)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="temp" stroke="var(--clr-high)" strokeWidth={2} dot={false} name="Temp (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="var(--clr-info)" strokeWidth={2} dot={false} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>ESP32 Connection</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5 }}>
              {isLive ? (
                <><Wifi size={20} style={{ color: 'var(--clr-brand)' }} /><span>Connected — Live readings from ESP32 + DHT22</span></>
              ) : (
                <><WifiOff size={20} style={{ color: 'var(--clr-text-3)' }} /><span style={{ color: 'var(--clr-text-3)' }}>ESP32 not connected — Demo mode active</span></>
              )}
            </div>
            <div className="disclaimer" style={{ marginTop: 12, borderTop: 'none', paddingTop: 0 }}>
              ESP32 sends data to <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>POST /api/sensor-data</code> every 30 seconds.
              Configure the backend URL in <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>iot/esp32_firmware/config.h</code>.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
