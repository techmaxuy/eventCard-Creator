'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface CountdownProps {
  eventDate: Date
  accentColor: string
  locale: string
  fontFamily?: string | null
  textColor?: string | null
  fontSize?: number | null
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

function calculateTimeLeft(eventDate: Date): TimeLeft {
  const now = new Date()
  const target = new Date(eventDate)
  const difference = target.getTime() - now.getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isPast: false,
  }
}

/**
 * Compute a responsive font size for countdown text based on a percentage value.
 */
function countdownFontSize(pct: number): string {
  const maxRem = pct * 0.04
  const minRem = Math.max(1, maxRem * 0.55)
  const vw = pct * 0.08
  return `clamp(${minRem.toFixed(2)}rem, ${vw.toFixed(1)}vw, ${maxRem.toFixed(2)}rem)`
}

export function Countdown({
  eventDate,
  accentColor,
  locale,
  fontFamily,
  textColor,
  fontSize,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(eventDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(eventDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [eventDate])

  // Compute responsive font size (default 50%)
  const computedFontSize = countdownFontSize(fontSize ?? 50)
  const numberFontSize = countdownFontSize((fontSize ?? 50) * 1.5)

  const fontStyle: React.CSSProperties = {
    ...(fontFamily ? { fontFamily } : {}),
    ...(textColor ? { color: textColor } : {}),
  }

  // If event has passed, show a different message
  if (timeLeft.isPast) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center py-8"
      >
        <p
          className={`font-semibold ${textColor ? '' : 'text-white'}`}
          style={{ ...fontStyle, fontSize: computedFontSize }}
        >
          {locale === 'es' ? 'El evento ya ha pasado' : 'The event has passed'}
        </p>
      </motion.div>
    )
  }

  const labels = {
    days: locale === 'es' ? 'Días' : 'Days',
    hours: locale === 'es' ? 'Horas' : 'Hours',
    minutes: locale === 'es' ? 'Minutos' : 'Minutes',
    seconds: locale === 'es' ? 'Segundos' : 'Seconds',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center py-8"
    >
      {/* Title */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`font-medium mb-6 ${textColor ? '' : 'text-white/80'}`}
        style={{ ...fontStyle, fontSize: computedFontSize }}
      >
        {locale === 'es' ? 'Faltan' : 'Countdown'}
      </motion.p>

      {/* Countdown boxes */}
      <div className="flex justify-center items-center gap-2 sm:gap-4">
        {/* Days */}
        <CountdownBox
          value={timeLeft.days}
          label={labels.days}
          accentColor={accentColor}
          fontFamily={fontFamily}
          textColor={textColor}
          numberFontSize={numberFontSize}
          labelFontSize={computedFontSize}
          delay={0}
        />

        <span
          className={`text-2xl sm:text-4xl font-bold ${textColor ? '' : 'text-white/60'}`}
          style={fontStyle}
        >
          :
        </span>

        {/* Hours */}
        <CountdownBox
          value={timeLeft.hours}
          label={labels.hours}
          accentColor={accentColor}
          fontFamily={fontFamily}
          textColor={textColor}
          numberFontSize={numberFontSize}
          labelFontSize={computedFontSize}
          delay={0.1}
        />

        <span
          className={`text-2xl sm:text-4xl font-bold ${textColor ? '' : 'text-white/60'}`}
          style={fontStyle}
        >
          :
        </span>

        {/* Minutes */}
        <CountdownBox
          value={timeLeft.minutes}
          label={labels.minutes}
          accentColor={accentColor}
          fontFamily={fontFamily}
          textColor={textColor}
          numberFontSize={numberFontSize}
          labelFontSize={computedFontSize}
          delay={0.2}
        />

        <span
          className={`text-2xl sm:text-4xl font-bold ${textColor ? '' : 'text-white/60'}`}
          style={fontStyle}
        >
          :
        </span>

        {/* Seconds */}
        <CountdownBox
          value={timeLeft.seconds}
          label={labels.seconds}
          accentColor={accentColor}
          fontFamily={fontFamily}
          textColor={textColor}
          numberFontSize={numberFontSize}
          labelFontSize={computedFontSize}
          delay={0.3}
        />
      </div>
    </motion.div>
  )
}

interface CountdownBoxProps {
  value: number
  label: string
  accentColor: string
  fontFamily?: string | null
  textColor?: string | null
  numberFontSize: string
  labelFontSize: string
  delay: number
}

function CountdownBox({
  value,
  label,
  accentColor,
  fontFamily,
  textColor,
  numberFontSize,
  labelFontSize,
  delay,
}: CountdownBoxProps) {
  const fontStyle: React.CSSProperties = {
    ...(fontFamily ? { fontFamily } : {}),
    ...(textColor ? { color: textColor } : {}),
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]"
    >
      <motion.div
        key={value}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`font-bold ${textColor ? '' : 'text-white'}`}
        style={{ ...fontStyle, fontSize: numberFontSize, color: textColor || accentColor }}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span
        className={`text-xs sm:text-sm ${textColor ? '' : 'text-white/70'}`}
        style={{ ...fontStyle, fontSize: labelFontSize }}
      >
        {label}
      </span>
    </motion.div>
  )
}
