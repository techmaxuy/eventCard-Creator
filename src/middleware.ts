// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import NextAuth from 'next-auth'
import { authConfig } from '../auth.config'

const intlMiddleware = createIntlMiddleware(routing)
const { auth } = NextAuth(authConfig)

// Rutas protegidas
const protectedRoutes = ['/dashboard', '/profile', '/settings', '/admin']
const authRoutes = ['/login', '/register']

export default auth(async (req) => {
    const { nextUrl } = req
    const session = req.auth
    const isLoggedIn = !!session?.user
    
    // Obtener pathname sin locale
    const pathnameWithoutLocale = nextUrl.pathname.replace(/^\/(en|es)/, '') || '/'
    
    // Verificar si es ruta protegida
    const isProtectedRoute = protectedRoutes.some(route => 
        pathnameWithoutLocale.startsWith(route)
    )
    
    // Verificar si es ruta de auth
    const isAuthRoute = authRoutes.some(route =>
        pathnameWithoutLocale.startsWith(route)
    )
    
    // Verificar admin
    const isAdminRoute = pathnameWithoutLocale.startsWith('/admin')
    
    // Extraer locale
    const locale = nextUrl.pathname.split('/')[1] || 'en'
    
    // BLOQUEO ADMIN - Primera línea de defensa
    if (isAdminRoute) {
        if (!isLoggedIn) {
            console.log('[Middleware] 🚫 Admin route - not logged in')
            return NextResponse.redirect(
                new URL(`/${locale}/login?error=Unauthorized`, nextUrl)
            )
        }
        
        if (session.user.role !== 'ADMIN') {
            console.log('[Middleware] 🚫 Admin route - insufficient permissions')
            return NextResponse.redirect(
                new URL(`/${locale}?error=AccessDenied`, nextUrl)
            )
        }
        
        console.log('[Middleware] ✅ Admin access granted')
    }

    // Proteger rutas
    if (isProtectedRoute && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname)
        return NextResponse.redirect(
            new URL(`/${locale}/login?callbackUrl=${callbackUrl}`, nextUrl)
        )
    }
    
    // Redirigir usuarios autenticados de login/register
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL(`/${locale}`, nextUrl))
    }

    const response = intlMiddleware(req as any)

    // Detectar país desde headers de Vercel y guardar en cookie
    const country = req.headers.get('x-vercel-ip-country') || 'US'
    response.cookies.set('user-country', country, {
        httpOnly: true,
        maxAge: 86400, // 1 día
        sameSite: 'lax',
    })
    
    // Aplicar middleware de internacionalización
    return response
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)']
}
