import { prisma } from "@/lib/prisma";

/**
 * Tenant-aware Prisma client extensions
 * Automatically scopes queries to the user's organization
 */
export function createTenantClient(organizationId: string) {
  const prismaClient = prisma as any;
  return prismaClient.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }: any) {
          // Add organization filter if the model has organizationId
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              where: {
                ...args?.where,
                organizationId
              }
            };
          }
          
          return query(args);
        },
        
        async findFirst({ model, operation, args, query }: any) {
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              where: {
                ...args?.where,
                organizationId
              }
            };
          }
          
          return query(args);
        },
        
        async findUnique({ model, operation, args, query }: any) {
          // For findUnique, we need to include organizationId in the where clause
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model) && args?.where) {
            args.where.organizationId = organizationId;
          }
          
          return query(args);
        },
        
        async create({ model, operation, args, query }: any) {
          // Auto-inject organizationId on create
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              data: {
                ...args?.data,
                organizationId
              }
            };
          }
          
          return query(args);
        },
        
        async update({ model, operation, args, query }: any) {
          // Ensure updates only affect tenant's data
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              where: {
                ...args?.where,
                organizationId
              }
            };
          }
          
          return query(args);
        },
        
        async delete({ model, operation, args, query }: any) {
          // Ensure deletes only affect tenant's data
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              where: {
                ...args?.where,
                organizationId
              }
            };
          }
          
          return query(args);
        },
        
        async deleteMany({ model, operation, args, query }: any) {
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              where: {
                ...args?.where,
                organizationId
              }
            };
          }
          
          return query(args);
        },
        
        async updateMany({ model, operation, args, query }: any) {
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              where: {
                ...args?.where,
                organizationId
              }
            };
          }
          
          return query(args);
        },
        
        async count({ model, operation, args, query }: any) {
          const organizationModels = ['Lead', 'Deal', 'Activity', 'Notification'];
          
          if (organizationModels.includes(model)) {
            args = {
              ...args,
              where: {
                ...args?.where,
                organizationId
              }
            };
          }
          
          return query(args);
        }
      }
    }
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantClient>;
