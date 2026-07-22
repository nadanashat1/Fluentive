import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/types/api-response';

// V1 API Version - Stable interface for backward compatibility
// This route maintains the same interface as current auth routes
// but under versioned API structure

export async function POST(request: NextRequest) {
  try {
    // Forward to current implementation
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: request.body
    });

    const data = await response.json();
    
    // Ensure V1 response format
    if (data.success) {
      return NextResponse.json(
        createSuccessResponse(data.data),
        { status: response.status }
      );
    } else {
      return NextResponse.json(
        createErrorResponse(data.error || 'Registration failed'),
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(error instanceof Error ? error.message : 'V1 registration failed'),
      { status: 500 }
    );
  }
}
