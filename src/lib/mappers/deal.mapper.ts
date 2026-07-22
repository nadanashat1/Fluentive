import { Deal } from '@/types';

// Database DTO from API
export interface DealDTO {
  id: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  course?: string;
  dealValue?: number | string;
  stage?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  createdAt?: string;
  expectedCloseDate?: string;
  timeline?: string;
  probability?: number;
}

// Transform API response to UI Deal type
export function toDealUI(dto: DealDTO): Deal {
  return {
    id: dto.id,
    clientName: dto.clientName,
    clientCompany: dto.clientCompany || "",
    clientEmail: dto.clientEmail,
    clientPhone: dto.clientPhone,
    course: dto.course || "",
    dealValue: Number(dto.dealValue || 0),
    stage: (dto.stage || "qualification") as Deal["stage"],
    salesAgent: {
      name: dto.assigneeName || "Sales Agent",
      email: dto.assigneeEmail || ""
    },
    date: dto.createdAt || new Date().toISOString(),
    expectedCloseDate: dto.expectedCloseDate || dto.timeline || new Date().toISOString(),
    probability: dto.probability || 50,
    createdAt: dto.createdAt || new Date().toISOString()
  };
}

// Transform array of deals
export function toDealsUI(dtos: DealDTO[]): Deal[] {
  return dtos.map(toDealUI);
}
