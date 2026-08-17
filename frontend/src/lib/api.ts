/// <reference types="vite/client" />
/**
 * PhytoVaria API Client
 * All backend communication goes through this module.
 * Base URL is configured via environment variable VITE_API_URL.
 */

const BASE_URL = ((import.meta.env['VITE_API_URL'] as string) || 'http://localhost:8000').replace(/\/$/, '');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Plant {
  id: number;
  plant_code: string;
  species: string;
  variety?: string;
  notes?: string;
  sample_source?: string;
  created_at: string;
}

export interface PlantCreate {
  plant_code: string;
  species?: string;
  variety?: string;
  notes?: string;
  sample_source?: string;
}

export interface Variant {
  chromosome: string;
  position: number;
  ref_allele: string;
  alt_allele: string;
  gene_symbol?: string;
  consequence?: string;
}

export interface EnvironmentReading {
  id: number;
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
  light?: number;
  timestamp: string;
}

export interface MLRiskPrediction {
  predicted_risk_level: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  most_influential_feature: string;
  note: string;
}

export interface DiseaseRisk {
  disease: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_score: number;
  evidence_level: string;
  contributing_variants: string[];
  environmental_factors: string[];
  explanation: string;
  ml_prediction?: MLRiskPrediction;
}

export interface RiskReport {
  plant_code: string;
  generated_at: string;
  disclaimer: string;
  results: DiseaseRisk[];
}

export interface DashboardStats {
  total_plants: number;
  high_risk: number;
  moderate_risk: number;
  low_risk: number;
  plants_analyzed: number;
  recent_analyses: RecentAnalysis[];
}

export interface RecentAnalysis {
  plant_code: string;
  disease: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
}

export interface DemoSensor {
  plant_id: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  light: number;
  timestamp: string;
  mode: string;
}

export interface VCFUploadResult {
  plant_code: string;
  variants_parsed: number;
  variants_linked: number;
}

// ─── Internal Fetch Wrapper ──────────────────────────────────────────────────

let authToken: string | null = null;

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Attach token if exists
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  // Only set Content-Type if we're not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error ${response.status}`);
  }
  return response.json();
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const api = {
  // Auth
  setToken: (token: string | null) => { authToken = token; },
  
  login: async (creds: LoginCredentials) => {
    // OAuth2PasswordRequestForm requires form-urlencoded data
    const formData = new URLSearchParams();
    formData.append('username', creds.username);
    formData.append('password', creds.password);
    
    return fetchApi<{ access_token: string }>('/api/auth/login', {
      method: 'POST',
      body: formData,
    });
  },

  register: async (creds: RegisterCredentials) => {
    return fetchApi<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(creds),
    });
  },

  // Health
  health: () => fetchApi<{ status: string; version: string }>('/api/health'),

  // Plants
  listPlants: () => fetchApi<Plant[]>('/api/plants'),
  getPlant: (code: string) => fetchApi<Plant>(`/api/plants/${code}`),
  registerPlant: (data: PlantCreate) =>
    fetchApi<Plant>('/api/plants', { method: 'POST', body: JSON.stringify(data) }),

  // VCF
  uploadVCF: (plantCode: string, file: File): Promise<VCFUploadResult> => {
    const form = new FormData();
    form.append('file', file);
    
    const headers = new Headers();
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    return fetch(`${BASE_URL}/api/plants/${plantCode}/upload-vcf`, {
      method: 'POST',
      headers,
      body: form,
    }).then(async (r) => {
      if (!r.ok) throw new Error(`Upload failed: ${await r.text()}`);
      return r.json();
    });
  },

  // Variants
  getVariants: (code: string) => fetchApi<Variant[]>(`/api/plants/${code}/variants`),

  // Environment
  getLatestEnv: (code: string) =>
    fetchApi<EnvironmentReading>(`/api/plants/${code}/environment/latest`),
  getEnvHistory: (code: string) =>
    fetchApi<EnvironmentReading[]>(`/api/plants/${code}/environment/history`),
  postSensorData: (data: {
    plant_id: string;
    temperature?: number;
    humidity?: number;
    soil_moisture?: number;
    light?: number;
  }) => fetchApi<EnvironmentReading>('/api/sensor-data', { method: 'POST', body: JSON.stringify(data) }),
  getDemoSensor: () => fetchApi<DemoSensor>('/api/demo/sensor'),

  // Risk
  getRisk: (code: string) => fetchApi<RiskReport>(`/api/plants/${code}/risk`),

  // Stats
  getStats: () => fetchApi<DashboardStats>('/api/stats'),

  // Report
  getReport: (code: string) => fetchApi<any>(`/api/plants/${code}/report`),
};
