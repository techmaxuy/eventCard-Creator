'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, Share2, X, Gift } from 'lucide-react'
import { GuestConfirmation } from './GuestConfirmation'
import { ShareButtons } from '@/features/event-cards/components/share/ShareButtons'
import { GiftRegistry } from './GiftRegistry'

interface FloatingActionButtonsProps {
  eventId: string
  eventSlug: string
  eventTitle: string
  eventDescription?: string
  eventUrl: string
  requirePhone: boolean
  askDietaryRequirements: boolean
  showGiftRegistry?: boolean
  primaryColor: string
  locale: string
  fontFamily?: string | null
}

export function FloatingActionButtons({
  eventId,
  eventSlug,
  eventTitle,
  eventDescription,
  eventUrl,
  requirePhone,
  askDietaryRequirements,
  showGiftRegistry = false,
  primaryColor,
  locale,
  fontFamily
}: FloatingActionButtonsProps) {
  const [showRSVP, setShowRSVP] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showGifts, setShowGifts] = useState(false)

  const closeAll = () => {
    setShowRSVP(false)
    setShowShare(false)
    setShowGifts(false)
  }

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3">
        {/* RSVP Button - Primary color darker shade */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          onClick={() => {
            setShowShare(false)
            setShowRSVP(true)
          }}
          className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-2 border-white/20 hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          }}
          title="Confirmar Asistencia"
        >
          <UserCheck className="w-6 h-6" />
        </motion.button>

        {/* Gift Registry Button - Only show if enabled */}
        {showGiftRegistry && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            onClick={() => {
              setShowRSVP(false)
              setShowShare(false)
              setShowGifts(true)
            }}
            className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-2 border-white/20 hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}cc 0%, ${primaryColor}99 100%)`,
            }}
            title={locale === 'es' ? 'Registro de Regalos' : 'Gift Registry'}
          >
            <Gift className="w-6 h-6" />
          </motion.button>
        )}

        {/* Share Button - Primary color lighter shade */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.3, delay: showGiftRegistry ? 0.8 : 0.7 }}
          onClick={() => {
            setShowRSVP(false)
            setShowGifts(false)
            setShowShare(true)
          }}
          className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-2 border-white/20 hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}bb 0%, ${primaryColor}88 100%)`,
          }}
          title={locale === 'es' ? 'Compartir Evento' : 'Share Event'}
        >
          <Share2 className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {(showRSVP || showShare || showGifts) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeAll}
          />
        )}
      </AnimatePresence>

      {/* RSVP Modal */}
      <AnimatePresence>
        {showRSVP && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto"
          >
            <div
              className="backdrop-blur-md rounded-t-3xl shadow-2xl border-t border-white/20"
              style={{ backgroundColor: `${primaryColor}08` }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: `${primaryColor}40` }} />
              </div>

              {/* Close button - z-10 to stay above form content */}
              <button
                onClick={() => setShowRSVP(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <X className="w-5 h-5 text-black" />
              </button>

              {/* Content - add top margin to avoid close button overlap */}
              <div className="px-4 pb-8 pt-4">
                <GuestConfirmation
                  eventId={eventId}
                  eventSlug={eventSlug}
                  requirePhone={requirePhone}
                  askDietaryRequirements={askDietaryRequirements}
                  primaryColor={primaryColor}
                  locale={locale}
                  fontFamily={fontFamily}
                  onSuccess={() => {
                    // Opcional: cerrar el modal después de confirmar
                    setTimeout(() => setShowRSVP(false), 2000)
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto"
          >
            <div
              className="backdrop-blur-md rounded-t-3xl shadow-2xl border-t border-white/20"
              style={{ backgroundColor: `${primaryColor}08` }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: `${primaryColor}40` }} />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowShare(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <X className="w-5 h-5 text-black" />
              </button>

              {/* Content */}
              <div className="px-6 pb-8 pt-4">
                <ShareButtons
                  eventTitle={eventTitle}
                  eventUrl={eventUrl}
                  eventDescription={eventDescription}
                  primaryColor={primaryColor}
                  locale={locale}
                  fontFamily={fontFamily}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Registry Modal */}
      <AnimatePresence>
        {showGifts && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto"
          >
            <div
              className="backdrop-blur-md rounded-t-3xl shadow-2xl border-t border-white/20"
              style={{ backgroundColor: `${primaryColor}08` }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: `${primaryColor}40` }} />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowGifts(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <X className="w-5 h-5 text-black" />
              </button>

              {/* Content */}
              <div className="px-4 pb-8 pt-4">
                <GiftRegistry
                  eventId={eventId}
                  eventSlug={eventSlug}
                  primaryColor={primaryColor}
                  locale={locale}
                  fontFamily={fontFamily}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}