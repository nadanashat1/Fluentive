import { http } from 'msw';

// Dashboard API handlers
export const handlers = [
  // Dashboard summary
  http.get('/api/dashboard/summary', ({ request, params, cookies }) => {
    return Response.json({
      totalLeads: 150,
      activeDeals: 45,
      conversionRate: 0.32,
      monthlyRevenue: 125000,
      recentActivity: [
        { id: 1, type: 'lead_created', message: 'New lead from John Doe', timestamp: '2024-01-15T10:30:00Z' },
        { id: 2, type: 'deal_updated', message: 'Deal status changed to Qualified', timestamp: '2024-01-15T09:15:00Z' }
      ]
    });
  }),

  // Dashboard stats
  http.get('/api/dashboard/stats', ({ request, params, cookies }) => {
    return Response.json({
      leadsThisMonth: 25,
      dealsWon: 8,
      averageDealSize: 15000,
      pipelineValue: 675000
    });
  }),

  // Activity timeline
  http.get('/api/dashboard/activity', ({ request, params, cookies }) => {
    return Response.json([
      { id: 1, type: 'lead_created', message: 'New lead from Sarah Smith', timestamp: '2024-01-15T10:30:00Z' },
      { id: 2, type: 'deal_updated', message: 'Deal moved to OPEN', timestamp: '2024-01-15T09:15:00Z' },
      { id: 3, type: 'note_added', message: 'Meeting notes added', timestamp: '2024-01-15T08:45:00Z' }
    ]);
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request, params, cookies }) => {
    return Response.json({
      user: { id: 1, email: 'test@example.com', name: 'Test User' },
      token: 'mock-jwt-token'
    });
  }),

  http.post('/api/auth/refresh', async ({ request, params, cookies }) => {
    return Response.json({
      token: 'mock-refreshed-jwt-token'
    });
  }),

  // Error handlers for testing
  http.get('/api/dashboard/error', ({ request, params, cookies }) => {
    const url = new URL(request.url);
    const errorType = url.searchParams.get('error');
    
    if (errorType === '500') {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (errorType === '401') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return Response.json({ message: 'No error' });
  }),

  // Lead mutation endpoints
  http.post('/api/leads', async ({ request, params, cookies }) => {
    return new Response(JSON.stringify({
      id: 123,
      name: 'New Lead',
      status: 'new',
      createdAt: new Date().toISOString()
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  http.put('/api/leads/:id', ({ request, params, cookies }) => {
    const { id } = params;
    return Response.json({
      id: Number(id),
      name: 'Updated Lead',
      status: 'qualified',
      updatedAt: new Date().toISOString()
    });
  }),

  // Slow response handler for testing timeouts
  http.get('/api/dashboard/slow', async ({ request, params, cookies }) => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    return Response.json({ message: 'Slow response' });
  }),
];
