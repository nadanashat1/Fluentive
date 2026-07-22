// Edge Runtime Configuration for Vercel Hobby
// Forces all API routes to use edge runtime for memory efficiency

export const config = {
  runtime: 'edge' as const,
  regions: ['iad1'],
  maxDuration: 30, // 30 seconds max for Vercel Hobby
};
