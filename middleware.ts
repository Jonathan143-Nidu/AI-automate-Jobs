import { auth } from "@/auth"

// Standard Next.js Middleware with Auth
export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnLogin = req.nextUrl.pathname.startsWith('/labs/prismautomation/login')
    
    // Allow signout flow: if ?signout=1 is in the URL, don't redirect back to app
    const isSigningOut = req.nextUrl.searchParams.get('signout') === '1'

    // If on login page AND logged in AND NOT signing out → go to app
    if (isOnLogin && isLoggedIn && !isSigningOut) {
        return Response.redirect(new URL('/labs/prismautomation', req.nextUrl))
    }

    // If NOT on login page AND NOT logged in → go to login
    if (!isOnLogin && !isLoggedIn) {
        return Response.redirect(new URL('/labs/prismautomation/login', req.nextUrl))
    }
})

// Optionally, don't invoke Middleware on some paths
// Exclude all api routes (including /api/bench for the extension)
export const config = {
    matcher: ["/labs/prismautomation", "/labs/prismautomation/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
