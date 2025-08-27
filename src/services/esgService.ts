// src/services/esgService.ts
const API_BASE_URL = import.meta.env.VITE_BACKEND_ENDPOINT || 'http://localhost:3000/api';

export interface ESGData {
  productId: string;
  productTitle: string;
  vendor: string;
  vendorSymbol: string;
  esgScore: number;
  environmentScore: number;
  socialScore: number;
  governanceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

export interface ESGSummary {
  totalProducts: number;
  averageESGScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  averageScores: {
    environmental: number;
    social: number;
    governance: number;
  };
}

export const esgService = {
  async processProductESG(shop: string, accessToken: string, productIds?: string[]) {
    const response = await fetch(`${API_BASE_URL}/shopify/esg/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop, accessToken, productIds })
    });
    return response.json();
  },

  async getESGData(shop: string): Promise<{ esgData: ESGData[] }> {
    const response = await fetch(`${API_BASE_URL}/shopify/esg/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop })
    });
    return response.json();
  },

  async getESGSummary(shop: string): Promise<ESGSummary> {
    const response = await fetch(`${API_BASE_URL}/shopify/esg/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop })
    });
    return response.json();
  }
};
