'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Calendar, Clock, MapPin, Users, Gift, Utensils, Shirt } from 'lucide-react'
import { GuestConfirmation } from './GuestConfirmation'

interface EventType {
  name: string
  nameEn: string
  icon: string | null
  color: string
}

interface Event {
  id: string
  slug: string
  title: string
  description: string | null
  eventDate: Date | null
  eventTime: string | null
  location: string | null
  locationAddress: string | null
  locationUrl: string | null
  dressCode: string | null
  giftRegistry: string | null
  menu: string | null
  primaryColor: string
  coverImage: string | null
  gallery: any
  requirePhone: boolean
  eventType: EventType
  user: {
    name: string | null
  }
  _count: {
    guests: number
  }
}

interface EventPublicPageProps {
  event: Event
  locale: string
}

export function EventPublicPage({ event, locale }: EventPublicPageProps) {
  const t = useTranslations('EventPublic')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {event.coverImage ? (
          <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px]">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-black" />
          </div>
        ) : (
          <div 
            className="relative w-full h-[40vh] min-h-[300px]"
            style={{ 
              background: `linear-gradient(135deg, ${event.primaryColor}20 0%, ${event.primaryColor}40 100%)` 
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl">
                {event.eventType.icon || '🎉'}
              </span>
            </div>
          </div>
        )}

        {/* Event Title Overlay */}
        <div className="relative -mt-32 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-zinc-800">
              <div className="flex items-start gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl flex-shrink-0"
                  style={{ backgroundColor: event.primaryColor + '20' }}
                >
                  {event.eventType.icon || '🎉'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {locale === 'es' ? event.eventType.name : event.eventType.nameEn}
                  </p>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {event.title}
                  </h1>
                  {event.user.name && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('hostedBy')} {event.user.name}
                    </p>
                  )}
                </div>
              </div>

              {event.description && (
                <p className="text-lg text-gray-700 dark:text-gray-300 mt-6 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t('eventDetails')}
              </h2>

              <div className="space-y-4">
                {/* Date */}
                {event.eventDate && (
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: event.primaryColor + '20' }}
                    >
                      <Calendar className="w-6 h-6" style={{ color: event.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('date')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(event.eventDate).toLocaleDateString(locale, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Time */}
                {event.eventTime && (
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: event.primaryColor + '20' }}
                    >
                      <Clock className="w-6 h-6" style={{ color: event.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('time')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {event.eventTime}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: event.primaryColor + '20' }}
                    >
                      <MapPin className="w-6 h-6" style={{ color: event.primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('location')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {event.location}
                      </p>
                      {event.locationAddress && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {event.locationAddress}
                        </p>
                      )}
                      {event.locationUrl && (
                        
                          <a href={event.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm font-medium hover:underline"
                          style={{ color: event.primaryColor }}
                        >
                          {t('viewMap')} →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Dress Code */}
                {event.dressCode && (
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: event.primaryColor + '20' }}
                    >
                      <Shirt className="w-6 h-6" style={{ color: event.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('dressCode')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {event.dressCode}
                      </p>
                    </div>
                  </div>
                )}

                {/* Gift Registry */}
                {event.giftRegistry && (
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: event.primaryColor + '20' }}
                    >
                      <Gift className="w-6 h-6" style={{ color: event.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('giftRegistry')}
                      </p>
                      
                        <a href={event.giftRegistry}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-lg font-semibold hover:underline"
                        style={{ color: event.primaryColor }}
                      >
                        {t('viewRegistry')} →
                      </a>
                    </div>
                  </div>
                )}

                {/* Menu */}
                {event.menu && (
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: event.primaryColor + '20' }}
                    >
                      <Utensils className="w-6 h-6" style={{ color: event.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('menu')}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">
                        {event.menu}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery */}
            {event.gallery && Array.isArray(event.gallery) && event.gallery.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('gallery')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.gallery.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={`Gallery ${index + 1}`}
                        fill
                        className="object-cover hover:scale-110 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - RSVP */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Guest Count */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6 mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: event.primaryColor + '20' }}
                  >
                    <Users className="w-6 h-6" style={{ color: event.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {event._count.guests}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('guestsConfirmed')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Form */}
              <GuestConfirmation
                eventId={event.id}
                eventSlug={event.slug}
                requirePhone={event.requirePhone}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-zinc-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('poweredBy')} <span className="font-semibold">EventCards</span>
          </p>
        </div>
      </div>
    </div>
  )
}