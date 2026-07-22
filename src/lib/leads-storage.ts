import type { Lead } from '@/types';
import { api } from '@/lib/api';

type LeadApiPayload = { success: boolean; data?: Lead };

async function parseLeadResponse(response: unknown): Promise<Lead | null> {
  if (!(response instanceof Response)) return null;
  const responseData = (await response.json()) as LeadApiPayload;
  return responseData.success ? (responseData.data ?? null) : null;
}

// Stub functions for leads storage - production-grade API
export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    const response = await api.leads.get(id);
    return parseLeadResponse(response);
  } catch {
    return null;
  }
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
  try {
    const response = await api.leads.update(id, data);
    return parseLeadResponse(response);
  } catch {
    return null;
  }
}

export async function createLead(data: Partial<Lead>): Promise<Lead | null> {
  try {
    const response = await api.leads.create(data);
    return parseLeadResponse(response);
  } catch {
    return null;
  }
}
