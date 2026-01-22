'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { StepNames } from './StepNames'
import { StepTitle } from './StepTitle'
import { StepPhrase } from './StepPhrase'
import { StepBackgroundImage } from './StepBackgroundImage'
import { StepFeaturedImage } from './StepFeaturedImage'
import { createEvent } from '@/features/event-cards/actions/events'
import { getAIAccessStatus, getAITokenCostsForUser } from '@/features/event-cards/actions/event-ai'

interface EventType {
  id: string
  name: string
  nameEn: string
  slug: string
  numberOfPeople: number
  askNames: boolean
  aiTitlePromptEs: string | null
  aiTitlePromptEn: string | null
  aiPhrasePromptEs: string | null
  aiPhrasePromptEn: string | null
}

interface WizardContainerProps {
  eventType: EventType
  locale: string
}

export interface WizardState {
  names: string[]
  title: string
  welcomePhrase: string
  coverImage: string
  coverImageFile: File | null
  coverImageAssetId?: string
  featuredImage: string
  featuredImageFile: File | null
  featuredImageAssetId?: string
}

interface AIStatus {
  hasAccess: boolean
  planName: string
  tokensRemaining: number
  isFreePlan: boolean
}

interface TokenCosts {
  titleSuggestion: number
  phraseGeneration: number
  imageEdit: number
  imageGeneration: number
}

export function WizardContainer({ eventType, locale }: WizardContainerProps) {
  const router = useRouter()
  const t = useTranslations('EventWizard')

  // Current step (1 = names, 2 = title, 3 = phrase, 4 = background, 5 = featured)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // Wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
    names: Array(eventType.numberOfPeople).fill(''),
    title: '',
    welcomePhrase: '',
    coverImage: '',
    coverImageFile: null,
    coverImageAssetId: undefined,
    featuredImage: '',
    featuredImageFile: null,
    featuredImageAssetId: undefined
  })

  // AI status
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)
  const [tokenCosts, setTokenCosts] = useState<TokenCosts | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load AI status on mount
  useEffect(() => {
    const loadAIStatus = async () => {
      const [statusResult, costsResult] = await Promise.all([
        getAIAccessStatus(),
        getAITokenCostsForUser()
      ])

      if (!statusResult.error) {
        setAiStatus(statusResult as AIStatus)
      }

      if (!costsResult.error) {
        setTokenCosts(costsResult as TokenCosts)
      }
    }

    loadAIStatus()
  }, [])

  // Update AI status after token consumption
  const refreshAIStatus = async () => {
    const result = await getAIAccessStatus()
    if (!result.error) {
      setAiStatus(result as AIStatus)
    }
  }

  // Step validation
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Names
        if (!eventType.askNames) return true
        return wizardState.names.every(name => name.trim().length > 0)
      case 2: // Title
        return wizardState.title.trim().length > 0
      case 3: // Phrase
        return true // Phrase is optional
      case 4: // Background Image
        return true // Background image is optional
      case 5: // Featured Image
        return true // Featured image is optional
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Helper function to convert data URL to File
  const dataURLtoFile = (dataUrl: string, filename: string): File | null => {
    try {
      const arr = dataUrl.split(',')
      const mimeMatch = arr[0].match(/:(.*?);/)
      if (!mimeMatch) return null
      const mime = mimeMatch[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new File([u8arr], filename, { type: mime })
    } catch {
      return null
    }
  }

  // Check if URL is a data URL (AI generated image)
  const isDataUrl = (url: string): boolean => {
    return url.startsWith('data:')
  }

  // Check if URL is from an asset (external URL, not a blob or data URL)
  const isAssetUrl = (url: string): boolean => {
    return url.startsWith('http') && !url.includes('blob:')
  }

  const handleComplete = async () => {
    setError(null)
    setIsCreating(true)

    try {
      // Determine cover image URL from asset (if selected from gallery)
      let coverImageUrl: string | undefined
      if (wizardState.coverImageAssetId && wizardState.coverImage && isAssetUrl(wizardState.coverImage)) {
        coverImageUrl = wizardState.coverImage
      }

      // Determine featured image URL from asset (if selected from gallery)
      let featuredImageUrl: string | undefined
      if (wizardState.featuredImageAssetId && wizardState.featuredImage && isAssetUrl(wizardState.featuredImage)) {
        featuredImageUrl = wizardState.featuredImage
      }

      const result = await createEvent({
        eventTypeId: eventType.id,
        title: wizardState.title,
        welcomePhrase: wizardState.welcomePhrase || undefined,
        coverImage: coverImageUrl,
        featuredImage: featuredImageUrl,
      })

      if (result.error) {
        setError(t(`errors.${result.error}`) || result.error)
        setIsCreating(false)
        return
      }

      if (result.event) {
        const eventId = result.event.id

        // Upload cover image if user provided a file OR an AI-generated image
        if (wizardState.coverImageFile) {
          // User uploaded a file
          const formData = new FormData()
          formData.append('file', wizardState.coverImageFile)
          formData.append('eventId', eventId)
          formData.append('imageType', 'cover')

          try {
            await fetch('/api/upload/event-image', {
              method: 'POST',
              body: formData,
            })
          } catch (uploadErr) {
            console.error('Error uploading cover image:', uploadErr)
          }
        } else if (wizardState.coverImage && isDataUrl(wizardState.coverImage)) {
          // AI-generated image (data URL) - convert to file and upload
          const file = dataURLtoFile(wizardState.coverImage, 'ai-generated-cover.png')
          if (file) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('eventId', eventId)
            formData.append('imageType', 'cover')

            try {
              await fetch('/api/upload/event-image', {
                method: 'POST',
                body: formData,
              })
            } catch (uploadErr) {
              console.error('Error uploading AI cover image:', uploadErr)
            }
          }
        }

        // Upload featured image if user provided a file OR an AI-generated image
        if (wizardState.featuredImageFile) {
          // User uploaded a file
          const formData = new FormData()
          formData.append('file', wizardState.featuredImageFile)
          formData.append('eventId', eventId)
          formData.append('imageType', 'featured')

          try {
            await fetch('/api/upload/event-image', {
              method: 'POST',
              body: formData,
            })
          } catch (uploadErr) {
            console.error('Error uploading featured image:', uploadErr)
          }
        } else if (wizardState.featuredImage && isDataUrl(wizardState.featuredImage)) {
          // AI-generated image (data URL) - convert to file and upload
          const file = dataURLtoFile(wizardState.featuredImage, 'ai-generated-featured.png')
          if (file) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('eventId', eventId)
            formData.append('imageType', 'featured')

            try {
              await fetch('/api/upload/event-image', {
                method: 'POST',
                body: formData,
              })
            } catch (uploadErr) {
              console.error('Error uploading AI featured image:', uploadErr)
            }
          }
        }

        // Redirect to editor
        router.push(`/${locale}/events/${eventId}/edit`)
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError(t('errors.CreateFailed'))
      setIsCreating(false)
    }
  }

  const updateWizardState = (updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }))
  }

  const eventTypeName = locale === 'es' ? eventType.name : eventType.nameEn

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/events/new`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToTypeSelection')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('createTitle', { eventType: eventTypeName })}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('createDescription')}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNum = index + 1
            const isActive = stepNum === currentStep
            const isComplete = stepNum < currentStep

            return (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium hidden sm:block ${
                    isActive || isComplete
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {stepNum === 1 && t('stepNames')}
                    {stepNum === 2 && t('stepTitle')}
                    {stepNum === 3 && t('stepPhrase')}
                    {stepNum === 4 && t('stepBackground')}
                    {stepNum === 5 && t('stepFeatured')}
                  </span>
                </div>

                {/* Connector */}
                {stepNum < totalSteps && (
                  <div className={`flex-1 h-1 mx-4 ${
                    stepNum < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-8">
        {currentStep === 1 && (
          <StepNames
            eventType={eventType}
            names={wizardState.names}
            onNamesChange={(names) => updateWizardState({ names })}
            locale={locale}
          />
        )}

        {currentStep === 2 && (
          <StepTitle
            eventType={eventType}
            names={wizardState.names}
            title={wizardState.title}
            onTitleChange={(title) => updateWizardState({ title })}
            aiStatus={aiStatus}
            tokenCost={tokenCosts?.titleSuggestion || 1}
            onTokensUsed={refreshAIStatus}
            locale={locale}
          />
        )}

        {currentStep === 3 && (
          <StepPhrase
            eventType={eventType}
            names={wizardState.names}
            title={wizardState.title}
            welcomePhrase={wizardState.welcomePhrase}
            onPhraseChange={(welcomePhrase) => updateWizardState({ welcomePhrase })}
            aiStatus={aiStatus}
            tokenCost={tokenCosts?.phraseGeneration || 1}
            onTokensUsed={refreshAIStatus}
            locale={locale}
          />
        )}

        {currentStep === 4 && (
          <StepBackgroundImage
            eventType={eventType}
            names={wizardState.names}
            title={wizardState.title}
            coverImage={wizardState.coverImage}
            coverImageFile={wizardState.coverImageFile}
            selectedAssetId={wizardState.coverImageAssetId}
            onCoverImageChange={(url, file, assetId) => updateWizardState({
              coverImage: url,
              coverImageFile: file,
              coverImageAssetId: assetId
            })}
            aiStatus={aiStatus}
            tokenCost={tokenCosts?.imageEdit || 5}
            onTokensUsed={refreshAIStatus}
            locale={locale}
          />
        )}

        {currentStep === 5 && (
          <StepFeaturedImage
            eventType={eventType}
            names={wizardState.names}
            title={wizardState.title}
            featuredImage={wizardState.featuredImage}
            featuredImageFile={wizardState.featuredImageFile}
            onFeaturedImageChange={(url, file) => updateWizardState({
              featuredImage: url,
              featuredImageFile: file,
              featuredImageAssetId: undefined
            })}
            aiStatus={aiStatus}
            tokenCost={tokenCosts?.imageEdit || 5}
            onTokensUsed={refreshAIStatus}
            locale={locale}
          />
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('back')}
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {t('continue')}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCreating || !isStepValid(currentStep)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {t('createAndContinue')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
