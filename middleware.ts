import { auth } from "@/auth"
import { checkMobile } from "./utils/mobile-guard"

// Standard Next.js Middleware with Auth
export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnLogin = req.nextUrl.pathname.startsWith('/login')
    const isSessionValid = isLoggedIn;

    if (isOnLogin && isSessionValid) {
        return Response.redirect(new URL('/', req.nextUrl))
    }

    if (!isOnLogin && !isSessionValid) {
        return Response.redirect(new URL('/login', req.nextUrl))
    }
})

// Optionally, don't invoke Middleware on some paths
// Exclude all api routes (including /api/bench for the extension)
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
