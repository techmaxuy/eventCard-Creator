'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Download, 
  Trash2, 
  Check, 
  X, 
  HelpCircle, 
  Mail, 
  Phone,
  User,
  MessageSquare,
  Loader2,
  Filter
} from 'lucide-react'
import { deleteGuest, exportGuestsToCSV } from '@/features/event-cards/actions/guests'

interface Guest {
  id: string
  name: string
  phone: string
  email: string | null
  status: 'PENDING' |'CONFIRMED' | 'DECLINED' | 'MAYBE'
  numberOfGuests: number
  message: string | null
  createdAt: Date
}

interface GuestsListProps {
  guests: Guest[]
  eventId: string
  eventSlug: string
  locale: string
}

export function GuestsList({ guests: initialGuests, eventId, eventSlug, locale }: GuestsListProps) {
  const router = useRouter()
  const t = useTranslations('Guests')
  
  const [guests, setGuests] = useState(initialGuests)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL'| 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'MAYBE'>('ALL')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Filtrar invitados
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'ALL' || guest.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calcular estadísticas
  const stats = {
    total: guests.length,
    pending: guests.filter(g => g.status === 'PENDING').length,
    confirmed: guests.filter(g => g.status === 'CONFIRMED').length,
    declined: guests.filter(g => g.status === 'DECLINED').length,
    maybe: guests.filter(g => g.status === 'MAYBE').length,
    totalPeople: guests
      .filter(g => g.status === 'CONFIRMED')
      .reduce((sum, g) => sum + g.numberOfGuests, 0)
  }

  const handleDelete = async (guestId: string, guestName: string) => {
    if (!confirm(t('confirmDelete', { name: guestName }))) return

    setDeletingId(guestId)

    const result = await deleteGuest(guestId)

    if (result.error) {
      alert(t(`errors.${result.error}`) || result.error)
    } else {
      setGuests(guests.filter(g => g.id !== guestId))
    }

    setDeletingId(null)
  }

  const handleExport = async () => {
    setIsExporting(true)

    const result = await exportGuestsToCSV(eventId)

    if (result.error) {
      alert(t(`errors.${result.error}`) || result.error)
    } else if (result.csv && result.filename) {
      // Descargar CSV
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = result.filename
      link.click()
    }

    setIsExporting(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'DECLINED':
        return <X className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'MAYBE':
        return <HelpCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        case 'PENDING':  // ← AGREGAR
      return <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
            {t('confirmed')}
          </span>
        )
      case 'DECLINED':
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-full">
            {t('declined')}
          </span>
        )
      case 'MAYBE':
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full">
            {t('maybe')}
          </span>
        )

        case 'PENDING':  // ← AGREGAR
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 rounded-full">
          {t('pending')}
        </span>
      )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('total')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        {/* NUEVA: Pending Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('pending')}</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('confirmed')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('declined')}</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.declined}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('maybe')}</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.maybe}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalPeople')}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalPeople}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="ALL">{t('allStatuses')}</option>
              <option value="PENDING">{t('pending')}</option> 
              <option value="CONFIRMED">{t('confirmed')}</option>
              <option value="DECLINED">{t('declined')}</option>
              <option value="MAYBE">{t('maybe')}</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || guests.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('exporting')}
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {t('exportCSV')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guests List */}
      {filteredGuests.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'ALL' ? t('noGuestsFound') : t('noGuestsYet')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('guest')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('people')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          {getStatusIcon(guest.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{guest.name}</p>
                          {guest.message && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <MessageSquare className="w-3 h-3" />
                              <span className="line-clamp-1">{guest.message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {guest.phone}
                        </div>
                        {guest.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {guest.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(guest.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {guest.numberOfGuests}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(guest.createdAt).toLocaleDateString(locale)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(guest.id, guest.name)}
                        disabled={deletingId === guest.id}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === guest.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results count */}
      {searchTerm || statusFilter !== 'ALL' ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {t('showingResults', { count: filteredGuests.length, total: guests.length })}
        </p>
      ) : null}
    </div>
  )
}