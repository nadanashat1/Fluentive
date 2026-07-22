// ROUTE_FACTORIES - Dynamic endpoints with explicit intent
// No placeholders, no parsing, no interpolation engine - structure in code
export const ROUTE_FACTORIES = {
  leads: {
    get: (id: string) => `/api/leads/${id}`,
    update: (id: string) => `/api/leads/${id}`,
    delete: (id: string) => `/api/leads/${id}`,
    notes: (id: string) => `/api/leads/${id}/notes`,
    attachments: (id: string) => `/api/leads/${id}/attachments`,
    insights: (id: string) => `/api/leads/${id}/insights`,
    emailSuggestion: (id: string) => `/api/leads/${id}/email-suggestion`
  },
  users: {
    get: (id: string) => `/api/users/${id}`,
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
    unlock: (id: string) => `/api/users/${id}/unlock`
  },
  deals: {
    get: (id: string) => `/api/deals/${id}`,
    update: (id: string) => `/api/deals/${id}`,
    delete: (id: string) => `/api/deals/${id}`
  },
  notifications: {
    markRead: (id: string) => `/api/notifications/${id}/read`
  }
};
