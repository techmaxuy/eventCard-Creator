import { auth } from "../../../auth";
import { getTranslations } from 'next-intl/server';
import { UserMenu } from '@/core/shared/components/UserMenu';
import { getSettings } from '@/core/admin/actions/settings';
import Image from 'next/image';
import { prisma } from '@/core/shared/lib/db'
import { QuickActions } from '@/features/event-cards/components/dashboard/QuickActions'
import { AdminQuickActions } from '@/features/event-cards/components/admin/AdminQuickActions'

interface HomePageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ params, searchParams }: HomePageProps) {
  const { locale } = await params
  const session = await auth();
  const t = await getTranslations('HomePage');
  const sp = await searchParams;
  
  // Obtener configuración del sistema
  const settings = await getSettings();
  
  // Determinar el mensaje de bienvenida según el idioma
  const welcomeMessage = locale === 'es' 
    ? settings?.welcomeMessageEs || t('appWelcome')
    : settings?.welcomeMessageEn || t('appWelcome');
  
  // Nombre de la app
  const appName = settings?.appName || t('title');
  
  // Logo
  const logo = settings?.logo;
  
  const success = sp.success === 'true';
  const error = sp.error;

  // Obtener estadísticas si el usuario está autenticado
  let userStats = null
  let adminStats = null

  if (session?.user) {
    const isAdmin = session.user.role === 'ADMIN'

    if (isAdmin) {
      // Stats para admin
      const [totalEventTypes, totalEvents, totalGuests, activeEvents] = await Promise.all([
        prisma.eventType.count(),
        prisma.event.count(),
        prisma.guest.count(),
        prisma.event.count({ where: { isPublished: true } })
      ])

      adminStats = {
        totalEventTypes,
        totalEvents,
        totalGuests,
        activeEvents
      }
    } else {
      // Stats para usuario regular
      const [totalEvents, publishedEvents, totalGuests] = await Promise.all([
        prisma.event.count({ where: { userId: session.user.id } }),
        prisma.event.count({ where: { userId: session.user.id, isPublished: true } }),
        prisma.guest.count({
          where: {
            event: { userId: session.user.id }
          }
        })
      ])

      userStats = {
        totalEvents,
        publishedEvents,
        totalGuests
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-zinc-900 dark:to-black">
      {success && (
        <div className="bg-green-500 text-white px-4 py-3 text-center font-medium">
          {t('accountCreated')}
        </div>
      )}
      
      {error === 'AlreadyRegistered' && (
        <div className="bg-yellow-500 text-white px-4 py-3 text-center font-medium">
          {t('alreadyRegistered')}
        </div>
      )}
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre de la app */}
            <div className="flex items-center gap-3">
              {logo && (
                <div className="relative w-10 h-10">
                  <Image
                    src={logo}
                    alt={appName}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {appName}
              </h1>
            </div>
            
            {/* User Menu */}
            <UserMenu 
              user={session?.user || null}
              locale={locale}
              isAuthenticated={!!session}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!session ? (
          // Usuario NO autenticado
          <div className="text-center space-y-6">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
              {welcomeMessage}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {locale === 'es' 
                ? 'Inicia sesión o regístrate para comenzar' 
                : 'Sign in or register to get started'}
            </p>
          </div>
        ) : (
          // Usuario autenticado
          <div className="space-y-8">       
            
            {/* Quick Actions Component */}
            <div className="max-w-4xl mx-auto mt-12">
              {session.user.role === 'ADMIN' ? (
                <AdminQuickActions locale={locale} stats={adminStats || undefined} />
              ) : (
                <QuickActions locale={locale} stats={userStats || undefined} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
