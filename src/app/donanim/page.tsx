'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, HardDrive, Cpu, Printer, Keyboard, X, Calendar, User, MapPin } from 'lucide-react'

interface Hardware {
  id: string
  date: string // Tarih
  assigned_person: string // Yapan kişi  
  department: string // Bölüm
  service: string // Servis
  device_type: string // Cihaz türü
  tag_number: string // Cihaz etiket no / IP
  fault_description: string // Arıza açıklaması
  work_done: string // Yapılan işlem
  spare_part_used: boolean // Yedek parça kullanıldı mı
  spare_part_name?: string // Kullanılan parça adı
  duration: number // İşlem süresi (dakika)
  status: 'Tamamlandı' | 'Devam Ediyor' | 'Serviste' | 'İptal'
  notes: string // Notlar
  next_check_date: string // Sonraki kontrol tarihi
  service_return_date?: string // Servisten dönüş tarihi
  created_at: string
  updated_at: string
}

export default function DonanımPage() {
  const router = useRouter()
  const [hardwareList, setHardwareList] = useState<Hardware[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    assignedPerson: '',
    department: 'BİLGİ İŞLEM',
    service: 'TEKNIK DESTEK',
    deviceType: 'Masaüstü Bilgisayar',
    tagNumber: '',
    faultDescription: '',
    workDone: '',
    sparePartUsed: false,
    sparePartName: '',
    duration: 0,
    status: 'Tamamlandı' as 'Tamamlandı' | 'Devam Ediyor' | 'Serviste' | 'İptal',
    notes: '',
    nextCheckDate: '',
    serviceReturnDate: ''
  })

  // Verileri yükle
  const loadHardware = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/hardware')
      if (response.ok) {
        const result = await response.json()
        setHardwareList(result.data || [])
      }
    } catch (error) {
      console.error('Donanım verileri yüklenemedi:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    loadHardware()
  }, [])

  // Yeni kayıt kaydet
  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/hardware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadHardware() // Listeyi yenile
        setShowAddModal(false)
        // Formu resetle
        setFormData({
          date: new Date().toISOString().split('T')[0],
          assignedPerson: '',
          department: 'BİLGİ İŞLEM',
          service: 'TEKNIK DESTEK',
          deviceType: 'Masaüstü Bilgisayar',
          tagNumber: '',
          faultDescription: '',
          workDone: '',
          sparePartUsed: false,
          sparePartName: '',
          duration: 0,
          status: 'Tamamlandı' as 'Tamamlandı' | 'Devam Ediyor' | 'Serviste' | 'İptal',
          notes: '',
          nextCheckDate: '',
          serviceReturnDate: ''
        })
      } else {
        alert('Kayıt sırasında hata oluştu!')
      }
    } catch (error) {
      console.error('Kayıt hatası:', error)
      alert('Kayıt sırasında hata oluştu!')
    } finally {
      setSaving(false)
    }
  }

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
    <>
      {/* Google Alumni Sans Font */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Alumni+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" 
        rel="stylesheet"
      />
      
      <style jsx global>{`
        * {
          font-family: 'Alumni Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        body, .container, .max-w-7xl {
          font-size: 16px !important;
        }

        h1 {
          font-size: 2.5rem !important;
          font-weight: 800 !important;
        }

        h2 {
          font-size: 2.2rem !important;
          font-weight: 700 !important;
        }

        h3 {
          font-size: 1.9rem !important;
          font-weight: 600 !important;
        }

        .hardware-card {
          background: rgba(255, 255, 255, 0.98) !important;
          border: 2px solid rgba(26, 32, 44, 0.08) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          transition: all 0.3s ease !important;
          backdrop-filter: blur(10px) !important;
          box-shadow: 0 8px 25px rgba(26, 32, 44, 0.08) !important;
        }

        .hardware-card:hover {
          transform: translateY(-8px) !important;
          border-color: #1a202c !important;
          box-shadow: 0 12px 35px rgba(26, 32, 44, 0.15) !important;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%) !important;
          border: 2px solid rgba(26, 32, 44, 0.08) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          transition: all 0.3s ease !important;
          backdrop-filter: blur(15px) !important;
          box-shadow: 0 8px 25px rgba(26, 32, 44, 0.08) !important;
        }

        .stat-card:hover {
          transform: translateY(-5px) !important;
          border-color: rgba(26, 32, 44, 0.15) !important;
          box-shadow: 0 12px 35px rgba(26, 32, 44, 0.12) !important;
        }

        .modern-button {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%) !important;
          border: none !important;
          border-radius: 16px !important;
          padding: 12px 24px !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 15px rgba(26, 32, 44, 0.2) !important;
        }

        .modern-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(26, 32, 44, 0.3) !important;
        }

        .status-tamamlandı {
          background: linear-gradient(135deg, #10b981, #34d399) !important;
          color: white !important;
          border: none !important;
        }

        .status-serviste {
          background: linear-gradient(135deg, #f59e0b, #fbbf24) !important;
          color: white !important;
          border: none !important;
        }

        .status-devam-ediyor {
          background: linear-gradient(135deg, #ef4444, #f87171) !important;
          color: white !important;
          border: none !important;
        }

        .table-modern {
          background: rgba(255, 255, 255, 0.98) !important;
          border-radius: 20px !important;
          border: none !important;
          backdrop-filter: blur(10px) !important;
        }

        .table-modern th {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          border: none !important;
          padding: 20px !important;
        }

        .table-modern td {
          padding: 20px !important;
          border: none !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6) !important;
          font-size: 15px !important;
        }

        .table-modern tr:hover {
          background: rgba(248, 250, 252, 0.8) !important;
          transform: scale(1.01) !important;
        }
      `}</style>

    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
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
            <button 
              onClick={() => setShowAddModal(true)}
              className="modern-button"
            >
              ➕ YENİ DONANIM EKLE
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif', fontWeight: '700'}}>
                  TOPLAM DONANIM
                </p>
                <p className="text-3xl font-bold text-slate-800 mt-1" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  {hardwareList.length}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center">
                <Monitor className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif', fontWeight: '700'}}>
                  TAMAMLANAN İŞLER
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  {hardwareList.filter(h => h.status === 'Tamamlandı').length}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif', fontWeight: '700'}}>
                  SERVİSTE
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-1" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  {hardwareList.filter(h => h.status === 'Serviste').length}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide" style={{fontFamily: 'Alumni Sans, sans-serif', fontWeight: '700'}}>
                  DEVAM EDİYOR
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
                  {hardwareList.filter(h => h.status === 'Devam Ediyor').length}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware List */}
        <div className="hardware-card">
          <div className="px-6 py-4 border-b-2 border-gray-100">
            <h2 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '1px'}}>
              🖥️ DONANIM LİSTESİ
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-modern">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cihaz Türü
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Etiket No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departman
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teknisyen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
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
                          {getHardwareIcon(hardware.device_type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {hardware.device_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{hardware.tag_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{hardware.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{hardware.assigned_person}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-2 text-sm font-bold rounded-full ${
                        hardware.status === 'Tamamlandı' ? 'status-tamamlandı' : 
                        hardware.status === 'Serviste' ? 'status-serviste' : 'status-devam-ediyor'
                      }`} style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                        {hardware.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg mr-3 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:transform hover:scale-105" style={{fontFamily: 'Alumni Sans, sans-serif', fontWeight: '600'}}>
                        ✏️ Düzenle
                      </button>
                      <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:transform hover:scale-105" style={{fontFamily: 'Alumni Sans, sans-serif', fontWeight: '600'}}>
                        🗑️ Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center hardware-card">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-600" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
              Donanım Kayıtları Yükleniyor...
            </h3>
          </div>
        )}

        {/* Empty State (if no hardware) */}
        {!isLoading && hardwareList.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif'}}>
              HENÜZ DONANIM EKLENMEMİŞ
            </h3>
            <p className="text-gray-500 mb-6">
              Donanım yönetimi için ilk donanımınızı ekleyin.
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="modern-button"
            >
              ➕ İLK DONANIMI EKLE
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Add Hardware Modal */}
    {showAddModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 rounded-t-2xl flex justify-between items-center">
            <h2 className="text-2xl font-bold" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
              🔧 YENİ DONANIM KAYDI
            </h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            <form className="space-y-6">
              {/* İlk Satır: Tarih, Yapan Kişi, Bölüm */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    📅 Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    👤 Yapan Kişi
                  </label>
                  <input
                    type="text"
                    value={formData.assignedPerson}
                    onChange={(e) => setFormData(prev => ({...prev, assignedPerson: e.target.value}))}
                    placeholder="Teknisyen adı..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    🏢 Bölüm
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({...prev, department: e.target.value}))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  >
                    <option>BİLGİ İŞLEM</option>
                    <option>HASTA KAYIT</option>
                    <option>MUHASEBE</option>
                    <option>İNSAN KAYNAKLARI</option>
                    <option>SAĞLIK HİZMETLERİ</option>
                    <option>LABORATUVAR</option>
                  </select>
                </div>
              </div>

              {/* İkinci Satır: Servis, Cihaz Türü, Etiket No */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    🔧 Servis
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData(prev => ({...prev, service: e.target.value}))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  >
                    <option>TEKNIK DESTEK</option>
                    <option>DONANIM ONARIM</option>
                    <option>YAZILIM GÜNCELLEMESİ</option>
                    <option>BAKIM</option>
                    <option>KURULUM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    💻 Cihaz Türü
                  </label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData(prev => ({...prev, deviceType: e.target.value}))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  >
                    <option>Masaüstü Bilgisayar</option>
                    <option>Laptop</option>
                    <option>Yazıcı</option>
                    <option>Sunucu</option>
                    <option>Network Cihazı</option>
                    <option>Monitör</option>
                    <option>Klavye/Mouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    🏷️ Etiket No / IP
                  </label>
                  <input
                    type="text"
                    value={formData.tagNumber}
                    onChange={(e) => setFormData(prev => ({...prev, tagNumber: e.target.value}))}
                    placeholder="Etiket numarası veya IP adresi..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  />
                </div>
              </div>

              {/* Arıza Açıklaması */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                  ⚠️ Arıza Açıklaması
                </label>
                <textarea
                  value={formData.faultDescription}
                  onChange={(e) => setFormData(prev => ({...prev, faultDescription: e.target.value}))}
                  placeholder="Karşılaşılan problem ve belirti detayları..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors resize-none"
                  style={{fontFamily: 'Alumni Sans, sans-serif'}}
                />
              </div>

              {/* Yapılan İşlem */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                  🔨 Yapılan İşlem
                </label>
                <textarea
                  value={formData.workDone}
                  onChange={(e) => setFormData(prev => ({...prev, workDone: e.target.value}))}
                  placeholder="Gerçekleştirilen onarım ve işlemler..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors resize-none"
                  style={{fontFamily: 'Alumni Sans, sans-serif'}}
                />
              </div>

              {/* Yedek Parça */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.sparePartUsed}
                    onChange={(e) => setFormData(prev => ({...prev, sparePartUsed: e.target.checked}))}
                    className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                  />
                  <label className="text-sm font-bold text-gray-700" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    🔧 Yedek Parça Kullanıldı
                  </label>
                </div>
                {formData.sparePartUsed && (
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formData.sparePartName}
                      onChange={(e) => setFormData(prev => ({...prev, sparePartName: e.target.value}))}
                      placeholder="Kullanılan parça adı ve detayları..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                      style={{fontFamily: 'Alumni Sans, sans-serif'}}
                    />
                  </div>
                )}
              </div>

              {/* Son Satır: Süre, Durum, Sonraki Kontrol */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    ⏱️ İşlem Süresi (dk)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({...prev, duration: Number(e.target.value)}))}
                    placeholder="Dakika"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    📊 Durum
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({...prev, status: e.target.value as any}))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  >
                    <option>Tamamlandı</option>
                    <option>Devam Ediyor</option>
                    <option>Serviste</option>
                    <option>İptal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                    📅 Sonraki Kontrol
                  </label>
                  <input
                    type="date"
                    value={formData.nextCheckDate}
                    onChange={(e) => setFormData(prev => ({...prev, nextCheckDate: e.target.value}))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                    style={{fontFamily: 'Alumni Sans, sans-serif'}}
                  />
                </div>
                {formData.status === 'Serviste' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                      🔄 Servisten Dönüş
                    </label>
                    <input
                      type="date"
                      value={formData.serviceReturnDate}
                      onChange={(e) => setFormData(prev => ({...prev, serviceReturnDate: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors"
                      style={{fontFamily: 'Alumni Sans, sans-serif'}}
                    />
                  </div>
                )}
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                  📝 Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Ek notlar ve önemli bilgiler..."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-slate-500 focus:ring-0 transition-colors resize-none"
                  style={{fontFamily: 'Alumni Sans, sans-serif'}}
                />
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex justify-end space-x-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-bold transition-colors"
              style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}
            >
              ❌ İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}
            >
              {saving ? '⏳ Kaydediliyor...' : '✅ Kaydet'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}