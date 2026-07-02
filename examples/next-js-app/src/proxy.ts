import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Inject pathname ke request header agar bisa dibaca
 * di server components (layout.tsx) tanpa "use client".
 */
export function proxy(request: NextRequest) {
    const headers = new Headers(request.headers)
    headers.set("x-pathname", request.nextUrl.pathname)
    return NextResponse.next({ request: { headers } })
}

export const config = {
    matcher: ["/learn/:path*"],
}
