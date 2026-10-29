import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Continue processing the request
  const response = NextResponse.next();
  
  // Calculate response time
  const duration = Date.now() - start;
  
  // Log request info like Morgan
  const methodColor = request.method === 'POST' ? '\x1b[32m' : '\x1b[34m'; // Green for POST, Blue for GET
  const resetColor = '\x1b[0m';
  
  console.log(
    `[Morgan Log] ${methodColor}${request.method}${resetColor} ${request.nextUrl.pathname} - Status: ${response.status} - ${duration}ms`
  );
  
  return response;
}

// Match all API paths to monitor request speeds
export const config = {
  matcher: '/api/:path*',
};
