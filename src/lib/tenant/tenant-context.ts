// Multi-tenant context for production SaaS architecture
export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  settings: {
    maxUsers: number;
    features: string[];
    branding: {
      logo?: string;
      colors: {
        primary: string;
        secondary: string;
      };
    };
    limits: {
      leads: number;
      deals: number;
      storage: number; // MB
    };
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'trial';
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenant: Tenant;
  user: {
    id: string;
    role: string;
    permissions: string[];
  };
  request: {
    ip: string;
    userAgent: string;
    timestamp: Date;
  };
}

export class TenantService {
  // Get tenant by domain or subdomain
  static async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const prisma = (await import('@/lib/prisma')).prisma as any;
    
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { domain: domain },
          { subdomain: domain.split('.')[0] }
        ]
      },
      include: {
        settings: true,
        subscription: true
      }
    });

    if (!organization) return null;

    return {
      id: organization.id,
      name: organization.name,
      domain: organization.domain,
      settings: {
        maxUsers: organization.settings?.maxUsers || 10,
        features: organization.settings?.features || [],
        branding: {
          logo: organization.settings?.logo || undefined,
          colors: {
            primary: organization.settings?.primaryColor || '#000000',
            secondary: organization.settings?.secondaryColor || '#ffffff'
          }
        },
        limits: {
          leads: organization.settings?.leadLimit || 1000,
          deals: organization.settings?.dealLimit || 500,
          storage: organization.settings?.storageLimit || 1000
        }
      },
      subscription: {
        plan: organization.subscription?.plan || 'free',
        status: organization.subscription?.status || 'active',
        expiresAt: organization.subscription?.expiresAt || undefined
      },
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    };
  }

  // Get tenant by ID
  static async getTenantById(tenantId: string): Promise<Tenant | null> {
    const prisma = (await import('@/lib/prisma')).prisma as any;
    
    const organization = await prisma.organization.findFirst({
      where: { id: tenantId },
      include: {
        settings: true,
        subscription: true
      }
    });

    if (!organization) return null;

    return {
      id: organization.id,
      name: organization.name,
      domain: organization.domain,
      settings: {
        maxUsers: organization.settings?.maxUsers || 10,
        features: organization.settings?.features || [],
        branding: {
          logo: organization.settings?.logo || undefined,
          colors: {
            primary: organization.settings?.primaryColor || '#000000',
            secondary: organization.settings?.secondaryColor || '#ffffff'
          }
        },
        limits: {
          leads: organization.settings?.leadLimit || 1000,
          deals: organization.settings?.dealLimit || 500,
          storage: organization.settings?.storageLimit || 1000
        }
      },
      subscription: {
        plan: organization.subscription?.plan || 'free',
        status: organization.subscription?.status || 'active',
        expiresAt: organization.subscription?.expiresAt || undefined
      },
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    };
  }

  // Check if user has access to tenant
  static async getUserTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const prisma = (await import('@/lib/prisma')).prisma as any;
    
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: tenantId,
        isActive: true
      }
    });

    return !!userOrg;
  }

  // Get user permissions within tenant
  static async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const prisma = (await import('@/lib/prisma')).prisma as any;
    
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: tenantId,
        isActive: true
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!userOrg || !userOrg.role) return [];

    return userOrg.role.permissions.map((rp: { permission: { name: string } }) => rp.permission.name);
  }

  // Check tenant limits
  static async checkTenantLimits(tenantId: string, resource: 'leads' | 'deals' | 'users' | 'storage'): Promise<boolean> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) return false;

    const prisma = (await import('@/lib/prisma')).prisma as any;

    switch (resource) {
      case 'leads':
        const leadCount = await prisma.lead.count({
          where: { 
            userId: { in: await this.getTenantUserIds(tenantId) },
            isDeleted: false 
          }
        });
        return leadCount < tenant.settings.limits.leads;

      case 'deals':
        const dealCount = await prisma.deal.count({
          where: { 
            userId: { in: await this.getTenantUserIds(tenantId) },
            isDeleted: false 
          }
        });
        return dealCount < tenant.settings.limits.deals;

      case 'users':
        const userCount = await prisma.userOrganization.count({
          where: { organizationId: tenantId, isActive: true }
        });
        return userCount < tenant.settings.maxUsers;

      case 'storage':
        // Storage limit check would require file storage tracking
        return true; // Placeholder

      default:
        return false;
    }
  }

  // Helper to get all user IDs in a tenant
  private static async getTenantUserIds(tenantId: string): Promise<string[]> {
    const prisma = (await import('@/lib/prisma')).prisma as any;
    
    const userOrgs = await prisma.userOrganization.findMany({
      where: { organizationId: tenantId, isActive: true },
      select: { userId: true }
    });

    return userOrgs.map((uo: { userId: string }) => uo.userId);
  }
}
