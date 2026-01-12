'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { 
  Image as ImageIcon, 
  Music, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Loader2,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { deleteAsset, toggleAssetActive } from '@/features/event-cards/actions/assets'

interface Asset {
  id: string
  type: 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'
  name: string
  description: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  audioUrl: string | null
  phraseEs: string | null
  phraseEn: string | null
  decorationUrl: string | null
  decorationType: string | null
  decorationPosition: string | null
  isActive: boolean
  eventType: {
    name: string
    nameEn: string
    icon: string | null
    color: string
  } | null
}

interface AssetsListProps {
  assets: Asset[]
  locale: string
}

export function AssetsList({ assets: initialAssets, locale }: AssetsListProps) {
  const router = useRouter()
  const t = useTranslations('Assets')
  const [assets, setAssets] = useState(initialAssets)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'AUDIO' | 'PHRASE' | 'DECORATION'>('ALL')

  const filteredAssets = filterType === 'ALL' 
    ? assets 
    : assets.filter(a => a.type === filterType)

  const handleDelete = async (assetId: string, assetName: string) => {
    if (!confirm(t('confirmDelete', { name: assetName }))) return

    setDeletingId(assetId)

    const result = await deleteAsset(locale, assetId)

    if (result.error) {
      alert(t(`errors.${result.error}`) || result.error)
    } else {
      setAssets(assets.filter(a => a.id !== assetId))
    }

    setDeletingId(null)
  }

  const handleToggleActive = async (assetId: string) => {
    setTogglingId(assetId)

    const result = await toggleAssetActive(locale, assetId)

    if (result.error) {
      alert(t(`errors.${result.error}`) || result.error)
    } else if (result.asset) {
      setAssets(assets.map(a => a.id === assetId ? { ...a, isActive: result.asset!.isActive } : a))
    }

    setTogglingId(null)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5" />
      case 'AUDIO':
        return <Music className="w-5 h-5" />
      case 'PHRASE':
        return <MessageSquare className="w-5 h-5" />
      case 'DECORATION':
        return <span className="text-xl">🎈</span>
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      IMAGE: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      AUDIO: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
      PHRASE: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      DECORATION: 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200',
    }
    return badges[type as keyof typeof badges] || ''
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">{t('allTypes')}</option>
            <option value="IMAGE">{t('images')}</option>
            <option value="AUDIO">{t('audios')}</option>
            <option value="PHRASE">{t('phrases')}</option>
            <option value="DECORATION">{t('decorations')}</option>
          </select>
        </div>
        <Link
          href={`/${locale}/admin-events/assets/new`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('createNew')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('total')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{assets.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('images')}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {assets.filter(a => a.type === 'IMAGE').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('audios')}</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {assets.filter(a => a.type === 'AUDIO').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('phrases')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {assets.filter(a => a.type === 'PHRASE').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('decorations')}</p>
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {assets.filter(a => a.type === 'DECORATION').length}
          </p>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            {getTypeIcon(filterType === 'ALL' ? 'IMAGE' : filterType)}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {filterType === 'ALL' ? t('noAssets') : t('noAssetsOfType')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 overflow-hidden transition-opacity ${
                !asset.isActive ? 'opacity-50' : ''
              }`}
            >
              {/* Preview */}
              <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                {asset.type === 'IMAGE' && asset.thumbnailUrl ? (
                  <Image
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    fill
                    className="object-cover"
                  />
                ) : asset.type === 'AUDIO' ? (
                  <div className="h-full flex items-center justify-center">
                    <Music className="w-16 h-16 text-purple-400" />
                  </div>
                ) : asset.type === 'PHRASE' ? (
                  <div className="h-full flex items-center justify-center p-4">
                    <p className="text-center text-gray-700 dark:text-gray-300 italic line-clamp-4">
                      "{locale === 'es' ? asset.phraseEs : asset.phraseEn}"
                    </p>
                  </div>
                ) : null}

                {/* Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getTypeBadge(asset.type)}`}>
                    {getTypeIcon(asset.type)}
                    {t(asset.type.toLowerCase())}
                  </span>
                </div>

                {/* Active Badge */}
                {!asset.isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-500 text-white rounded-full">
                      {t('inactive')}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {asset.name}
                </h3>
                
                {asset.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                {/* Event Type */}
                {asset.eventType ? (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{asset.eventType.icon}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {locale === 'es' ? asset.eventType.name : asset.eventType.nameEn}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                    {t('allEventTypes')}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleToggleActive(asset.id)}
                    disabled={togglingId === asset.id}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {togglingId === asset.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : asset.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        {t('deactivate')}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        {t('activate')}
                      </>
                    )}
                  </button>

                  <Link
                    href={`/${locale}/admin-events/assets/${asset.id}/edit`}
                    className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(asset.id, asset.name)}
                    disabled={deletingId === asset.id}
                    className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {deletingId === asset.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}