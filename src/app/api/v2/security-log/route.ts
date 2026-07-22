import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

// ✅ Valid actions whitelist
const ALLOWED_ACTIONS = [
  "PRINT_SCREEN_KEY",
  "TAB_SWITCH", 
  "DEVTOOLS_OPEN",
  "COPY",
  "RIGHT_CLICK"
];

// 🛡️ Simple rate limiting (10 requests per second per IP for security monitoring)
const rateLimiter = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    // 🔐 CRITICAL: Authentication required
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    
    const body = await request.json();
    
    // 🛡️ Rate limiting check
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const lastCall = rateLimiter.get(ip) || 0;
    
    if (now - lastCall < 100) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }
    rateLimiter.set(ip, now);
    
    // ✅ Action validation
    if (!ALLOWED_ACTIONS.includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
    
    const userAgent = request.headers.get("user-agent") || "unknown";

    const log = await prisma.securityLog.create({
      data: {
        userId: user.id, // 🔐 Use authenticated user ID
        email: user.email, // 🔐 Use authenticated user email
        action: body.action,
        key: body.key || null,
        meta: body.meta || {},
        ip,
        userAgent
      }
    });

    return NextResponse.json({ success: true, id: log.id });
  } catch (error) {
    console.error("Security log error:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
