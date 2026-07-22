import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/lib/api/contracts';
import { Deal } from '@/types';
import { toDealsUI, toDealUI, type DealDTO } from '@/lib/mappers/deal.mapper';

export class DealsApiClient {
  private static readonly BASE_PATH = '/api/deals';

  static async getAll(): Promise<Deal[]> {
    try {
      const response = await apiFetch<ApiResponse<DealDTO[]>>(`${this.BASE_PATH}`);
      
      if (response.success && response.data) {
        return toDealsUI(response.data);
      }
      
      throw new Error(response.error || 'Failed to fetch deals');
    } catch (error) {
      console.error('Deals API error:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Deal> {
    try {
      const response = await apiFetch<ApiResponse<DealDTO>>(`${this.BASE_PATH}/${id}`);
      
      if (response.success && response.data) {
        return toDealUI(response.data);
      }
      
      throw new Error(response.error || 'Failed to fetch deal');
    } catch (error) {
      console.error('Deal API error:', error);
      throw error;
    }
  }

  static async create(data: Partial<Deal>): Promise<Deal> {
    try {
      const response = await apiFetch<ApiResponse<DealDTO>>(`${this.BASE_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.success && response.data) {
        return toDealUI(response.data);
      }
      
      throw new Error(response.error || 'Failed to create deal');
    } catch (error) {
      console.error('Create deal API error:', error);
      throw error;
    }
  }

  static async update(id: string, data: Partial<Deal>): Promise<Deal> {
    try {
      const response = await apiFetch<ApiResponse<DealDTO>>(`${this.BASE_PATH}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.success && response.data) {
        return toDealUI(response.data);
      }
      
      throw new Error(response.error || 'Failed to update deal');
    } catch (error) {
      console.error('Update deal API error:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const response = await apiFetch<ApiResponse<void>>(`${this.BASE_PATH}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete deal');
      }
    } catch (error) {
      console.error('Delete deal API error:', error);
      throw error;
    }
  }
}
