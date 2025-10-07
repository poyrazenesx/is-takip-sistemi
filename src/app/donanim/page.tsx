'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, HardDrive, Cpu, Printer, Keyboard } from 'lucide-react'

interface Hardware {
  id: number
  name: string
  type: string
  status: 'Aktif' | 'Arızalı' | 'Bakımda'
  location: string
  lastCheck: string
}

export default function DonanımPage() {
  const router = useRouter()
  const [hardwareList, setHardwareList] = useState<Hardware[]>([
    {
      id: 1,
      name: 'Bilgisayar - PC001',
      type: 'Masaüstü Bilgisayar',
      status: 'Aktif',
      location: 'Muhasebe Departmanı',
      lastCheck: '2025-10-01'
    },
    {
      id: 2,
      name: 'Yazıcı - HP001',
      type: 'Lazer Yazıcı',
      status: 'Bakımda',
      location: 'İnsan Kaynakları',
      lastCheck: '2025-10-05'
    },
    {
      id: 3,
      name: 'Sunucu - SRV001',
      type: 'Sunucu',
      status: 'Aktif',
      location: 'Sunucu Odası',
      lastCheck: '2025-10-07'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800 border-green-200'
      case 'Arızalı': return 'bg-red-100 text-red-800 border-red-200'
      case 'Bakımda': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getHardwareIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'masaüstü bilgisayar':
      case 'laptop':
        return <Monitor className="w-5 h-5" />
      case 'lazer yazıcı':
      case 'yazıcı':
        return <Printer className="w-5 h-5" />
      case 'sunucu':
        return <HardDrive className="w-5 h-5" />
      case 'klavye':
        return <Keyboard className="w-5 h-5" />
      default:
        return <Cpu className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                ← Geri Dön
              </button>
              <div className="flex items-center space-x-2">
                <Monitor className="w-6 h-6 text-slate-600" />
                <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  DONANIM YÖNETİMİ
                </h1>
              </div>
            </div>
            <button className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              + Yeni Donanım Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  TOPLAM DONANIM
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {hardwareList.length}
                </p>
              </div>
              <Monitor className="w-8 h-8 text-slate-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  AKTİF DONANIM
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {hardwareList.filter(h => h.status === 'Aktif').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  BAKIMDA
                </p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {hardwareList.filter(h => h.status === 'Bakımda').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  ARIZALI
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {hardwareList.filter(h => h.status === 'Arızalı').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-slate-800" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
              DONANIM LİSTESİ
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donanım
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Kontrol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hardwareList.map((hardware) => (
                  <tr key={hardware.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 text-slate-600">
                          {getHardwareIcon(hardware.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {hardware.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{hardware.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(hardware.status)}`}>
                        {hardware.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{hardware.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{hardware.lastCheck}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-slate-600 hover:text-slate-800 mr-3 transition-colors duration-200">
                        Düzenle
                      </button>
                      <button className="text-red-600 hover:text-red-800 transition-colors duration-200">
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State (if no hardware) */}
        {hardwareList.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
              HENÜz DONANIM EKLENMEMİŞ
            </h3>
            <p className="text-gray-500 mb-6">
              Donanım yönetimi için ilk donanımınızı ekleyin.
            </p>
            <button className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              İlk Donanımı Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  )
}