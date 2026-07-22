// Production-safe enum mappers for Prisma + TypeScript compatibility
import { LeadStatus, DealStage } from '@prisma/client';
import { Roles, RoleType } from '@/constants/roles';

// LeadStatus mapper
export function mapLeadStatus(status?: string): LeadStatus | undefined {
  if (!status) return undefined;
  
  const map: Record<string, LeadStatus> = {
    NEW: LeadStatus.NEW,
    CONTACTED: LeadStatus.CONTACTED,
    QUALIFIED: LeadStatus.QUALIFIED,
    PROPOSAL: LeadStatus.PROPOSAL,
    NEGOTIATION: LeadStatus.NEGOTIATION,
    CONVERTED: LeadStatus.CONVERTED,
    LOST: LeadStatus.LOST
  };
  
  return map[status] ?? LeadStatus.NEW;
}

// DealStage mapper
export function mapDealStage(stage?: string): DealStage | undefined {
  if (!stage) return undefined;
  
  const map: Record<string, DealStage> = {
    OPEN: DealStage.OPEN,
    DISCOVERY: DealStage.DISCOVERY,
    QUALIFICATION: DealStage.QUALIFICATION,
    PROPOSAL: DealStage.PROPOSAL,
    NEGOTIATION: DealStage.NEGOTIATION,
    WON: DealStage.WON,
    LOST: DealStage.LOST
  };
  
  return map[stage] ?? DealStage.OPEN;
}

// UserRole mapper
export function mapUserRole(role?: string): RoleType | undefined {
  if (!role) return undefined;
  
  const map: Record<string, RoleType> = {
    SALES: Roles.SALES,
    MANAGER: Roles.MANAGER,
    ADMIN: Roles.ADMIN,
    MARKETING: Roles.MARKETING,
    HR: Roles.HR,
    FINANCE: Roles.FINANCE,
    INSTRUCTOR: Roles.INSTRUCTOR,
    EMPLOYEE: Roles.EMPLOYEE,
    USER: Roles.USER,
    SUPER_ADMIN: Roles.SUPER_ADMIN,
    
    sales: Roles.SALES,
    manager: Roles.MANAGER,
    admin: Roles.ADMIN,
    marketing: Roles.MARKETING,
    hr: Roles.HR,
    finance: Roles.FINANCE,
    instructor: Roles.INSTRUCTOR,
    employee: Roles.EMPLOYEE,
    user: Roles.USER,
    super_admin: Roles.SUPER_ADMIN
  };
  
  return map[role] ?? Roles.USER;
}

// Deal stage constants for deal.service.ts
export const DEAL_STAGES = {
  OPEN: DealStage.OPEN,
  DISCOVERY: DealStage.DISCOVERY,
  QUALIFICATION: DealStage.QUALIFICATION,
  PROPOSAL: DealStage.PROPOSAL,
  NEGOTIATION: DealStage.NEGOTIATION,
  WON: DealStage.WON,
  LOST: DealStage.LOST
} as const;
