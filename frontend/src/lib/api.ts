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

// ─── Helper ───────────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ─── Plants ───────────────────────────────────────────────────────────────────

export const api = {
  // Health
  health: () => request<{ status: string; version: string }>('/api/health'),

  // Plants
  listPlants: () => request<Plant[]>('/api/plants'),
  getPlant: (code: string) => request<Plant>(`/api/plants/${code}`),
  registerPlant: (data: PlantCreate) =>
    request<Plant>('/api/plants', { method: 'POST', body: JSON.stringify(data) }),

  // VCF
  uploadVCF: (plantCode: string, file: File): Promise<VCFUploadResult> => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE_URL}/api/plants/${plantCode}/upload-vcf`, {
      method: 'POST',
      body: form,
    }).then(async (r) => {
      if (!r.ok) throw new Error(`Upload failed: ${await r.text()}`);
      return r.json();
    });
  },

  // Variants
  getVariants: (code: string) => request<Variant[]>(`/api/plants/${code}/variants`),

  // Environment
  getLatestEnv: (code: string) =>
    request<EnvironmentReading>(`/api/plants/${code}/environment/latest`),
  getEnvHistory: (code: string) =>
    request<EnvironmentReading[]>(`/api/plants/${code}/environment/history`),
  postSensorData: (data: {
    plant_id: string;
    temperature?: number;
    humidity?: number;
    soil_moisture?: number;
    light?: number;
  }) => request<EnvironmentReading>('/api/sensor-data', { method: 'POST', body: JSON.stringify(data) }),
  getDemoSensor: () => request<DemoSensor>('/api/demo/sensor'),

  // Risk
  getRisk: (code: string) => request<RiskReport>(`/api/plants/${code}/risk`),

  // Stats
  getStats: () => request<DashboardStats>('/api/stats'),

  // Report
  getReport: (code: string) => request<any>(`/api/plants/${code}/report`),
};
