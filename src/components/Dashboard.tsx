'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, User, Hardware } from '@/types';
import { Plus, LogOut, Edit, Trash2, CheckCircle, Clock, AlertCircle, User as UserIcon, Search, FileText, Bell, X, Monitor, Eye } from 'lucide-react';
import Notes from '@/components/Notes';


interface DashboardProps {
  users: User[];
}

export default function Dashboard({ users }: DashboardProps) {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [hardware, setHardware] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'hardware'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  // Hardware modal states
  const [showHardwareForm, setShowHardwareForm] = useState(false);
  const [editingHardware, setEditingHardware] = useState<Hardware | null>(null);
  const [hardwareForm, setHardwareForm] = useState<Partial<Hardware>>({
    device_type: 'Bilgisayar',
    make_model: '', // Yapılan İşlem olarak kullanacağız
    status: 'Aktif',
    purchase_date: '',
    ip_address: '',
    notes: ''
  });
  

  
  // Notification system
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>>([]);
  
  // Bell Notification System
  const [bellNotifications, setBellNotifications] = useState<{id: number; message: string; type: 'create' | 'delete' | 'update'; timestamp: Date}[]>([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  


  // Form verileri
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: user?.id || 1,
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in-progress' | 'completed'
  });

  useEffect(() => {
    fetchTasks();
    fetchNotes();
    fetchHardware();
  }, []);

  // Bell dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const bellContainer = document.querySelector('.bell-container');
      if (bellContainer && !bellContainer.contains(event.target as Node)) {
        setShowBellDropdown(false);
      }
    };

    if (showBellDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBellDropdown]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Görevler alınamadı:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Notlar alınamadı:', error);
    }
  };

  const fetchHardware = async () => {
    try {
      const response = await fetch('/api/hardware');
      if (response.ok) {
        const result = await response.json();
        setHardware(result.data || []);
      }
    } catch (error) {
      console.error('Donanım verileri alınamadı:', error);
      setHardware([]); // Hata durumunda boş array
    }
  };

  // Notification system
  const addNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  };

  // Bell Notification Functions
  const addBellNotification = (message: string, type: 'create' | 'delete' | 'update') => {
    const id = Date.now();
    const newNotification = { id, message, type, timestamp: new Date() };
    setBellNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setBellNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setBellNotifications([]);
    setUnreadCount(0);
  };

  // Hardware form functions
  const resetHardwareForm = () => {
    setHardwareForm({
      device_type: 'Bilgisayar',
      make_model: '', // Yapılan İşlem
      status: 'Aktif',
      purchase_date: '',
      ip_address: '',
      notes: ''
    });
    setEditingHardware(null);
    setShowHardwareForm(false);
  };

  const handleHardwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingHardware) {
        // Güncelleme
        const response = await fetch(`/api/hardware/${editingHardware.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(hardwareForm),
        });

        if (response.ok) {
          addNotification('Donanım başarıyla güncellendi!', 'success');
          addBellNotification(`"${hardwareForm.device_type}" donanımı güncellendi`, 'update');
          fetchHardware();
          resetHardwareForm();
        } else {
          const errorData = await response.text();
          addNotification('Donanım güncellenemedi: ' + errorData, 'error');
        }
      } else {
        // Yeni donanım - Veri formatını API'nin beklediği şekilde hazırla
        const apiData = {
          device_type: hardwareForm.device_type || 'Bilgisayar',
          make_model: hardwareForm.make_model || '', // Yapılan işlem
          status: hardwareForm.status || 'Aktif',
          purchase_date: hardwareForm.purchase_date || new Date().toISOString().split('T')[0], // Bugünün tarihi varsayılan
          ip_address: hardwareForm.ip_address || '',
          notes: hardwareForm.notes || ''
        };

        const response = await fetch('/api/hardware', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });

        if (response.ok) {
          addNotification('Donanım başarıyla eklendi!', 'success');
          addBellNotification(`"${hardwareForm.device_type}" donanımı eklendi`, 'create');
          fetchHardware();
          resetHardwareForm();
          setActiveTab('hardware'); // Donanım tab'ına geç
        } else {
          const errorData = await response.text();
          addNotification('Donanım eklenemedi: ' + errorData, 'error');
        }
      }
    } catch (error) {
      console.error('Donanım kaydet hatası:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addNotification('Bağlantı hatası: ' + errorMessage, 'error');
    }
  };

  const handleEditHardware = (hardware: any) => {
    setEditingHardware(hardware);
    // Veritabanı alanlarından form alanlarına mapping
    setHardwareForm({
      device_type: hardware.device_type,
      make_model: hardware.work_done, // Yapılan işlem
      status: hardware.status,
      purchase_date: hardware.date,
      ip_address: hardware.tag_number, // IP adresini tag'dan al
      notes: hardware.notes
    });
    setShowHardwareForm(true);
  };

  const handleDeleteHardware = async (hardwareId: number) => {
    if (window.confirm('Bu donanımı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/hardware/${hardwareId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          addNotification('Donanım başarıyla silindi!', 'success');
          addBellNotification('Donanım silindi', 'delete');
          fetchHardware();
        } else {
          addNotification('Donanım silinemedi!', 'error');
        }
      } catch (error) {
        console.error('Donanım silme hatası:', error);
        addNotification('Bağlantı hatası!', 'error');
      }
    }
  };



  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTask) {
        // Güncelleme
        console.log('Görev güncelleniyor:', editingTask.id, taskForm);
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingTask.id,
            ...taskForm
          }),
        });

        console.log('Güncelleme response:', response.status);
        if (response.ok) {
          console.log('Güncelleme başarılı');
          fetchTasks();
          resetForm();
        } else {
          const errorData = await response.text();
          console.error('Güncelleme hatası:', errorData);
          addNotification('Görev güncellenemedi: ' + errorData, 'error');
        }
      } else {
        // Yeni görev
        console.log('Yeni görev oluşturuluyor:', taskForm);
        console.log('Current user:', user);
        console.log('User ID:', user?.id, typeof user?.id);
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...taskForm,
            createdBy: user?.id || 1 // fallback için 1 kullan
          }),
        });

        console.log('POST response status:', response.status);
        if (response.ok) {
          console.log('Yeni görev başarıyla oluşturuldu');
          await fetchTasks();
          resetForm();
          addNotification('Görev başarıyla oluşturuldu!', 'success');
          addBellNotification(`"${taskForm.title}" görevi oluşturuldu`, 'create');
        } else {
          const errorData = await response.text();
          console.error('POST hatası:', errorData);
          addNotification('Görev oluşturulamadı: ' + errorData, 'error');
        }
      }
    } catch (error) {
      console.error('Görev kaydet hatası:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addNotification('Bağlantı hatası: ' + errorMessage, 'error');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/tasks?id=${taskId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchTasks();
          addNotification('Görev başarıyla silindi!', 'success');
          addBellNotification('Bir görev silindi', 'delete');
        } else {
          addNotification('Görev silinirken hata oluştu', 'error');
        }
      } catch (error) {
        console.error('Görev sil hatası:', error);
        addNotification('Silme işlemi sırasında hata oluştu', 'error');
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: task.status
    });
    setShowTaskForm(true);
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: user?.id || 1,
      priority: 'medium',
      status: 'todo'
    });
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : 'Bilinmeyen Kullanıcı';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-success" />;
      case 'in-progress':
        return <Clock size={20} className="text-warning" />;
      default:
        return <AlertCircle size={20} className="text-muted" />;
    }
  };



  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'Yapılacak';
      case 'in-progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ background: '#fff3cd', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
          {part}
        </mark>
      ) : part
    );
  };

  if (isLoading) {
    return (
      <>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" 
          crossOrigin="anonymous"
        />
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="spinner-border text-white" role="status" style={{width: '4rem', height: '4rem'}}>
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
        rel="stylesheet" 
        integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" 
        crossOrigin="anonymous"
      />
      <link 
        href="https://fonts.googleapis.com/css2?family=Alumni+Sans:ital,wght@0,100..900;1,100..900&display=swap" 
        rel="stylesheet" 
      />
      
      <style jsx>{`
        * {
          font-family: 'Alumni Sans', sans-serif !important;
        }

        /* Font Size Improvements */
        body, .container, .row, .col {
          font-size: 16px !important;
        }

        h1 {
          font-size: 2.5rem !important;
        }

        h2 {
          font-size: 2.2rem !important;
        }

        h3 {
          font-size: 1.9rem !important;
        }

        h4 {
          font-size: 1.7rem !important;
        }

        h5 {
          font-size: 1.4rem !important;
        }

        h6 {
          font-size: 1.2rem !important;
        }

        p, span, div {
          font-size: 16px !important;
          line-height: 1.6 !important;
        }

        .btn {
          font-size: 15px !important;
          padding: 12px 20px !important;
        }

        .table td, .table th {
          font-size: 15px !important;
          padding: 15px !important;
        }

        .form-control, .form-select {
          font-size: 15px !important;
          padding: 12px !important;
        }

        .modal-body {
          font-size: 16px !important;
        }

        .modal-title {
          font-size: 1.6rem !important;
        }
        
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          transition: all 0.5s ease;
        }
        


        /* Notification System */
        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .notification {
          min-width: 300px;
          padding: 16px 20px;
          border-radius: 12px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-weight: 500;
          animation: slideInRight 0.3s ease-out;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .notification.success {
          background: linear-gradient(135deg, rgba(72, 187, 120, 0.9), rgba(56, 178, 172, 0.9));
        }
        
        .notification.error {
          background: linear-gradient(135deg, rgba(245, 101, 101, 0.9), rgba(237, 100, 166, 0.9));
        }
        
        .notification.warning {
          background: linear-gradient(135deg, rgba(246, 173, 85, 0.9), rgba(255, 183, 77, 0.9));
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Bell Notification System */
        .bell-container {
          position: fixed;
          top: 70px;
          right: 20px;
          z-index: 1000;
        }

        .bell-button {
          position: relative;
          background: rgba(26, 32, 44, 0.9);
          backdrop-filter: blur(10px);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(26, 32, 44, 0.3);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .bell-button:hover {
          background: rgba(26, 32, 44, 1);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(26, 32, 44, 0.4);
        }

        .bell-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #e53e3e;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .bell-dropdown {
          position: absolute;
          top: 60px;
          right: 0;
          width: 320px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 8px 25px rgba(26, 32, 44, 0.15);
          max-height: 400px;
          overflow: hidden;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .bell-header {
          padding: 16px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bell-header h6 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #718096;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .clear-btn:hover {
          background: rgba(226, 232, 240, 0.5);
        }

        .bell-content {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.3);
          transition: background 0.2s ease;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .notification-item:hover {
          background: rgba(248, 250, 252, 0.8);
        }

        .notification-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notification-icon.create {
          background: rgba(72, 187, 120, 0.1);
          color: #48bb78;
        }

        .notification-icon.update {
          background: rgba(66, 153, 225, 0.1);
          color: #4299e1;
        }

        .notification-icon.delete {
          background: rgba(245, 101, 101, 0.1);
          color: #f56565;
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          font-size: 13px;
          font-weight: 500;
          color: #2d3748;
          margin: 0 0 2px 0;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 11px;
          color: #718096;
          margin: 0;
        }
        
        .dashboard-container.dark-theme {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .header-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .gradient-btn {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          border: none;
          border-radius: 15px;
          padding: 12px 25px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .gradient-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(26, 32, 44, 0.4);
        }
        
        .logout-btn {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          border: none;
          border-radius: 15px;
          padding: 12px 25px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 25px;
          transition: all 0.3s ease;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .stat-icon-small {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .tasks-table-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .table-header {
          background: linear-gradient(135deg, #f7fafc 0%, rgba(26, 32, 44, 0.05) 100%);
          padding: 20px 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .priority-badge {
          padding: 8px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .priority-high {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
        }
        
        .priority-medium {
          background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
          color: white;
        }
        
        .priority-low {
          background: linear-gradient(135deg, #48cab2 0%, #54a0ff 100%);
          color: white;
        }
        
        .status-badge {
          padding: 8px 15px;
          border-radius: 15px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .modal-backdrop {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
        }
        
        .modal-content {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 25px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }
        
        .form-control {
          border: 2px solid #e9ecef;
          border-radius: 15px;
          padding: 15px 20px;
          font-size: 16px;
          background: rgba(248, 249, 250, 0.9);
          transition: all 0.3s ease;
        }
        
        .form-control:focus {
          border-color: #2d3748;
          box-shadow: 0 0 0 0.25rem rgba(45, 55, 72, 0.25);
          background: white;
          outline: none;
        }
        
        .form-select {
          border: 2px solid #e9ecef;
          border-radius: 15px;
          padding: 15px 20px;
          font-size: 16px;
          background: rgba(248, 249, 250, 0.9);
          transition: all 0.3s ease;
        }
        
        .form-select:focus {
          border-color: #2d3748;
          box-shadow: 0 0 0 0.25rem rgba(45, 55, 72, 0.25);
          background: white;
          outline: none;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }
        
        .action-btn {
          width: 35px;
          height: 35px;
          border-radius: 10px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .action-btn:hover {
          transform: scale(1.1);
        }
        
        .edit-btn {
          background: rgba(45, 55, 72, 0.1);
          color: #2d3748;
        }
        
        .edit-btn:hover {
          background: rgba(45, 55, 72, 0.2);
        }
        
        .delete-btn {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }
        
        .delete-btn:hover {
          background: rgba(255, 107, 107, 0.2);
        }
        
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        /* Faydalı Linkler Styles */
        .useful-link-card {
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(26, 32, 44, 0.1);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(26, 32, 44, 0.08);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .useful-link-card:hover {
          transform: translateY(-5px);
          border-color: #1a202c;
          box-shadow: 0 8px 25px rgba(26, 32, 44, 0.15);
          background: rgba(255, 255, 255, 1);
        }

        .link-title {
          color: #1a202c;
          font-family: 'Alumni Sans', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .link-url {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 16px;
          background: rgba(37, 99, 235, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(37, 99, 235, 0.2);
          transition: all 0.2s ease;
          display: inline-block;
          word-break: break-all;
        }

        .link-url:hover {
          background: #2563eb;
          color: white;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        @media (max-width: 768px) {
          .useful-link-card {
            margin-bottom: 1rem;
          }
          
          .link-url {
            font-size: 12px;
            padding: 6px 12px;
          }
        }
        

      `}</style>
      


      {/* Bell Notification System */}
      <div className="bell-container">
        <button 
          className="bell-button"
          onClick={() => {
            setShowBellDropdown(!showBellDropdown);
            if (!showBellDropdown) markAsRead();
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {showBellDropdown && (
          <div className="bell-dropdown">
            <div className="bell-header">
              <h6>Bildirimler</h6>
              <button 
                className="clear-btn"
                onClick={clearAllNotifications}
              >
                Temizle
              </button>
            </div>
            <div className="bell-content">
              {bellNotifications.length === 0 ? (
                <div className="notification-item" style={{textAlign: 'center', color: '#718096'}}>
                  Henüz bildirim yok
                </div>
              ) : (
                bellNotifications.map(notif => (
                  <div key={notif.id} className="notification-item">
                    <div className={`notification-icon ${notif.type}`}>
                      {notif.type === 'create' ? '➕' : notif.type === 'update' ? '✏️' : '🗑️'}
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">{notif.message}</p>
                      <p className="notification-time">
                        {notif.timestamp.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification System */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
      
      <div className={`dashboard-container ${darkMode ? 'dark-theme' : ''}`}>
        {/* Notifications */}
        <div className="notifications-container">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          ))}
        </div>
        
        {/* Header */}
        <header className="header-card">
          <div className="container">
            <div className="row align-items-center py-4">
              <div className="col-md-6">
                <h1 className="gradient-text fw-bold fs-2 mb-2">İş Takip Sistemi</h1>
                <h5 className="text-muted mb-0">
                  Hoş geldin, <span className="fw-bold" style={{color: '#1a202c'}}>{user?.name}</span> 👋
                </h5>
                <p className="text-muted small mb-0">Hastane Bilgi İşlem Sistemi</p>
              </div>
              <div className="col-md-6 text-end">

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="btn btn-outline-secondary me-2"
                  title={darkMode ? 'Açık tema' : 'Koyu tema'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="btn gradient-btn text-white me-2"
                >
                  <Plus className="me-2" size={18} />
                  Yeni Görev
                </button>

                <button
                  onClick={() => setShowHardwareForm(true)}
                  className="btn btn-outline-primary me-2"
                  style={{
                    borderColor: '#1a202c',
                    color: '#1a202c',
                    fontWeight: '600'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a202c';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1a202c';
                  }}
                >
                  <Monitor className="me-2" size={18} />
                  YENİ DONANIM EKLE
                </button>

                <button
                  onClick={logout}
                  className="btn logout-btn text-white"
                >
                  <LogOut className="me-2" size={18} />
                  Çıkış
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Ana İçerik */}
        <main className="container py-4">
          {/* Sade İstatistik */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="glass-card rounded-4 p-3">
                <div className="d-flex align-items-center justify-content-center gap-4">
                  <div className="d-flex align-items-center gap-2">
                    <div className="stat-icon-small" style={{background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'}}>
                      <FileText className="text-white" size={16} />
                    </div>
                    <span className="fw-bold text-dark">{notes.length} Not</span>
                  </div>
                  <div className="text-muted">•</div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="stat-icon-small" style={{background: 'linear-gradient(135deg, #48cab2 0%, #54a0ff 100%)'}}>
                      <UserIcon className="text-white" size={16} />
                    </div>
                    <span className="fw-bold text-dark">{users.length} Kullanıcı</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Faydalı Linkler */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="glass-card rounded-4 p-4">
                <h5 className="fw-bold mb-3 text-center" style={{color: '#1a202c', fontFamily: 'Alumni Sans, sans-serif'}}>
                  🔗 FAYDALI LİNKLER
                </h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">🖥️ Origo Exe Kurulumu</h6>
                      <a href="http://10.43.0.22:8040" target="_blank" rel="noopener noreferrer" className="link-url">
                        10.43.0.22:8040
                      </a>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">🏥 ALIS</h6>
                      <a href="http://10.43.0.22:8077" target="_blank" rel="noopener noreferrer" className="link-url">
                        10.43.0.22:8077
                      </a>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">💰 PAGO</h6>
                      <a href="http://10.43.0.25:8066" target="_blank" rel="noopener noreferrer" className="link-url">
                        10.43.0.25:8066
                      </a>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">🎫 Ticket Oluşturma</h6>
                      <a href="https://destek.ventura.com.tr/scp/login.php" target="_blank" rel="noopener noreferrer" className="link-url">
                        destek.ventura.com.tr
                      </a>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">📷 PACS Görüntüleme</h6>
                      <a href="http://10.43.0.6:33600/viewer" target="_blank" rel="noopener noreferrer" className="link-url">
                        10.43.0.6:33600
                      </a>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">📢 Hasta Çağır</h6>
                      <a href="http://10.43.0.22:8504" target="_blank" rel="noopener noreferrer" className="link-url">
                        10.43.0.22:8504
                      </a>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">🔏 KAMUSM (E-İmza İçin)</h6>
                      <a href="https://kamusm.bilgem.tubitak.gov.tr/" target="_blank" rel="noopener noreferrer" className="link-url">
                        kamusm.bilgem.tubitak.gov.tr
                      </a>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="useful-link-card">
                      <h6 className="link-title">📋 ARKSİGNER (Reçete E-İmza)</h6>
                      <a href="https://www.arksigner.com/indir-windows" target="_blank" rel="noopener noreferrer" className="link-url">
                        arksigner.com/indir-windows
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Arama Kutusu */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="glass-card rounded-4 p-4">
                <div className="d-flex align-items-center gap-3">
                  <Search className="text-muted" size={20} />
                  <input
                    type="text"
                    className="form-control form-control-lg border-0 bg-transparent"
                    placeholder="Not ve görev isimlerinde ara... (örn: hastane, rapor, güncelleme)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      fontSize: '16px',
                      color: '#333'
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSearchTerm('')}
                      title="Aramayı temizle"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-2">
                    <small className="text-muted">
                      {/* eslint-disable-next-line react/no-unescaped-entities */}
                      🔍 Aranıyor: &quot;<strong>{searchTerm}</strong>&quot; 
                      {activeTab === 'tasks' ? ' (Görevlerde)' : activeTab === 'notes' ? ' (Notlarda)' : activeTab === 'hardware' ? ' (Donanımlarda)' : ''}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  <ul className="nav nav-pills nav-fill">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tasks')}
                        style={{
                          background: activeTab === 'tasks' ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'transparent',
                          border: 'none',
                          color: activeTab === 'tasks' ? 'white' : '#666'
                        }}
                      >
                        📋 Görevler
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'notes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notes')}
                        style={{
                          background: activeTab === 'notes' ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'transparent',
                          border: 'none',
                          color: activeTab === 'notes' ? 'white' : '#666'
                        }}
                      >
                        📝 Birim Notları
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'hardware' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hardware')}
                        style={{
                          background: activeTab === 'hardware' ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'transparent',
                          border: 'none',
                          color: activeTab === 'hardware' ? 'white' : '#666'
                        }}
                      >
                        🖥️ Donanım
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'tasks' && (
            /* Görevler Tablosu */
            <div className="tasks-table-card">
              <div className="table-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="gradient-text fw-bold fs-3 mb-0">📋 Görevler</h2>
                <div className="d-flex gap-2">
                  <div style={{width: '12px', height: '12px', backgroundColor: '#ff6b6b', borderRadius: '50%'}}></div>
                  <div style={{width: '12px', height: '12px', backgroundColor: '#feca57', borderRadius: '50%'}}></div>
                  <div style={{width: '12px', height: '12px', backgroundColor: '#48cab2', borderRadius: '50%'}}></div>
                </div>
              </div>
            </div>
            
            {tasks.length === 0 ? (
              <div className="text-center py-5">
                <div className="mx-auto mb-4" style={{
                  width: '100px', 
                  height: '100px', 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Plus size={40} className="text-muted" />
                </div>
                <h4 className="fw-bold text-dark mb-3">Henüz görev yok</h4>
                <p className="text-muted mb-4">İlk görevinizi oluşturun ve ekibinizle işbirliği yapmaya başlayın!</p>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="btn gradient-btn text-white px-4 py-3"
                >
                  <Plus className="me-2" size={18} />
                  İlk Görevimi Oluştur 🚀
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr style={{backgroundColor: 'rgba(102, 126, 234, 0.05)'}}>
                      <th className="border-0 fw-bold text-uppercase small ps-4 py-3">📋 Görev</th>
                      <th className="border-0 fw-bold text-uppercase small py-3">👤 Atanan</th>
                      <th className="border-0 fw-bold text-uppercase small py-3">📊 Durum</th>
                      <th className="border-0 fw-bold text-uppercase small py-3">⚡ Öncelik</th>
                      <th className="border-0 fw-bold text-uppercase small pe-4 py-3">🔧 İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .filter(task => {
                        if (!searchTerm) return true;
                        return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               task.description.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((task, index) => (
                      <tr key={task.id} style={{borderBottom: '1px solid rgba(0,0,0,0.05)'}}>
                        <td className="border-0 ps-4 py-4">
                          <div>
                            <h6 className="fw-bold mb-1 text-dark">{highlightText(task.title, searchTerm)}</h6>
                            <p className="text-muted small mb-0 bg-light rounded-pill px-3 py-1 d-inline-block">
                              {highlightText(task.description, searchTerm)}
                            </p>
                          </div>
                        </td>
                        <td className="border-0 py-4">
                          <div className="d-flex align-items-center">
                            <div className="avatar me-3">
                              {getUserName(task.assignedTo).charAt(0)}
                            </div>
                            <span className="fw-semibold text-dark">{getUserName(task.assignedTo)}</span>
                          </div>
                        </td>
                        <td className="border-0 py-4">
                          <div className="d-flex align-items-center">
                            {getStatusIcon(task.status)}
                            <span className="status-badge bg-light text-dark ms-2">
                              {getStatusText(task.status)}
                            </span>
                          </div>
                        </td>
                        <td className="border-0 py-4">
                          <span className={`priority-badge ${
                            task.priority === 'high' ? 'priority-high' : 
                            task.priority === 'medium' ? 'priority-medium' : 'priority-low'
                          }`}>
                            {getPriorityText(task.priority)}
                          </span>
                        </td>
                        <td className="border-0 py-4 pe-4">
                          <div className="d-flex gap-2">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="action-btn edit-btn"
                              title="Görevi Düzenle"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="action-btn delete-btn"
                              title="Görevi Sil"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {/* Notes Tab Content */}
          {activeTab === 'notes' && (
            <Notes searchTerm={searchTerm} />
          )}

          {/* Hardware Tab Content */}
          {activeTab === 'hardware' && (
            <div className="tasks-table-card">
              <div className="table-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="gradient-text fw-bold fs-3 mb-0">🖥️ Donanım Listesi</h2>
                  <div className="d-flex gap-2">
                    <div style={{width: '12px', height: '12px', backgroundColor: '#ff6b6b', borderRadius: '50%'}}></div>
                    <div style={{width: '12px', height: '12px', backgroundColor: '#feca57', borderRadius: '50%'}}></div>
                    <div style={{width: '12px', height: '12px', backgroundColor: '#48cab2', borderRadius: '50%'}}></div>
                  </div>
                </div>
              </div>
              
              {hardware.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mx-auto mb-4" style={{
                    width: '100px', 
                    height: '100px', 
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Monitor size={40} className="text-muted" />
                  </div>
                  <h4 className="fw-bold text-dark mb-3">Henüz donanım yok</h4>
                  <p className="text-muted mb-4">İlk donanımınızı ekleyin ve envanteri yönetmeye başlayın!</p>
                  <button
                    onClick={() => setShowHardwareForm(true)}
                    className="btn gradient-btn text-white px-4 py-3"
                  >
                    <Monitor className="me-2" size={18} />
                    İlk Donanımımı Ekle 🚀
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{backgroundColor: 'rgba(102, 126, 234, 0.05)'}}>
                        <th className="border-0 fw-bold text-uppercase small ps-4 py-3">🖥️ Cihaz Türü</th>
                        <th className="border-0 fw-bold text-uppercase small py-3">� Yapılan İşlem</th>
                        <th className="border-0 fw-bold text-uppercase small py-3">� Tarih</th>
                        <th className="border-0 fw-bold text-uppercase small py-3">📊 Durum</th>
                        <th className="border-0 fw-bold text-uppercase small pe-4 py-3">⚙️ İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hardware || [])
                        .filter(item => {
                          if (!searchTerm) return true;
                          const search = searchTerm.toLowerCase();
                          return (item?.device_type || '').toLowerCase().includes(search) ||
                                 (item?.work_done || '').toLowerCase().includes(search) ||
                                 (item?.tag_number || '').toLowerCase().includes(search) ||
                                 (item?.notes || '').toLowerCase().includes(search);
                        })
                        .map((item) => (
                        <tr key={item?.id || Math.random()} style={{borderBottom: '1px solid rgba(0,0,0,0.05)'}}>
                          <td className="border-0 ps-4 py-4">
                            <div className="d-flex align-items-center">
                              <span className="fw-bold text-dark">{item?.device_type || 'N/A'}</span>
                              {item?.tag_number && (
                                <span className="badge bg-light text-dark ms-2 small">{item.tag_number}</span>
                              )}
                            </div>
                          </td>
                          <td className="border-0 py-4">
                            <div style={{maxWidth: '300px'}}>
                              <p className="mb-0 text-dark">{item?.work_done || 'N/A'}</p>
                              {item?.notes && (
                                <small className="text-muted d-block mt-1">{item.notes.substring(0, 50)}...</small>
                              )}
                            </div>
                          </td>
                          <td className="border-0 py-4">
                            <span className="fw-semibold text-dark">
                              {item?.date ? new Date(item.date).toLocaleDateString('tr-TR') : 'N/A'}
                            </span>
                          </td>
                          <td className="border-0 py-4">
                            <span className={`status-badge ${
                              item?.status === 'Tamamlandı' ? 'bg-success' : 
                              item?.status === 'Devam Ediyor' ? 'bg-primary' : 
                              item?.status === 'Beklemede' ? 'bg-warning' : 
                              item?.status === 'İptal' ? 'bg-danger' : 'bg-secondary'
                            } text-white`}>
                              {item?.status || 'N/A'}
                            </span>
                          </td>
                          <td className="border-0 py-4 pe-4">
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleEditHardware(item)}
                                className="action-btn edit-btn"
                                title="Donanımı Düzenle"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteHardware(item.id)}
                                className="action-btn delete-btn"
                                title="Donanımı Sil"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Görev Formu Modal */}
        {showTaskForm && (
          <div className="modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
            <div className="modal-content p-0" style={{maxWidth: '500px', width: '90%'}}>
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="gradient-text fw-bold fs-4 mb-0">
                    {editingTask ? '✏️ Görev Güncelle' : '➕ Yeni Görev Ekle'}
                  </h3>
                  <button
                    onClick={resetForm}
                    type="button"
                    className="btn-close"
                    style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleTaskSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-bold text-uppercase small text-muted">📝 Başlık</label>
                    <input
                      type="text"
                      required
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value.toUpperCase() })}
                      className="form-control form-control-lg"
                      placeholder="Görev başlığını girin..."
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold text-uppercase small text-muted">📄 Açıklama</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      rows={4}
                      className="form-control"
                      placeholder="Görev detaylarını açıklayın..."
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold text-uppercase small text-muted">👤 Atanan Kişi</label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: parseInt(e.target.value) })}
                      className="form-select form-select-lg"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-bold text-uppercase small text-muted">⚡ Öncelik</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                        className="form-select"
                      >
                        <option value="low">Düşük</option>
                        <option value="medium">Orta</option>
                        <option value="high">Yüksek</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-bold text-uppercase small text-muted">📊 Durum</label>
                      <select
                        value={taskForm.status}
                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as 'todo' | 'in-progress' | 'completed' })}
                        className="form-select"
                      >
                        <option value="todo">Yapılacak</option>
                        <option value="in-progress">Devam Ediyor</option>
                        <option value="completed">Tamamlandı</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn btn-light px-4 py-2"
                      style={{borderRadius: '15px', fontWeight: '600'}}
                    >
                      ❌ İptal
                    </button>
                    <button
                      type="submit"
                      className="btn gradient-btn text-white px-4 py-2"
                      style={{fontWeight: '600'}}
                    >
                      {editingTask ? '✏️ Güncelle' : '💾 Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Donanım Formu Modal */}
        {showHardwareForm && (
          <div className="modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
            <div className="modal-content p-0" style={{maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto'}}>
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="gradient-text fw-bold fs-4 mb-0">
                    {editingHardware ? '✏️ Donanım Düzenle' : '🖥️ Yeni Donanım Ekle'}
                  </h3>
                  <button
                    onClick={resetHardwareForm}
                    type="button"
                    className="btn-close"
                    style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleHardwareSubmit}>
                  <div className="row">
                    {/* Sol Kolon */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Cihaz Türü *</label>
                        <select
                          required
                          value={hardwareForm.device_type || 'Bilgisayar'}
                          onChange={(e) => setHardwareForm({ ...hardwareForm, device_type: e.target.value })}
                          className="form-select"
                        >
                          <option value="Bilgisayar">Bilgisayar</option>
                          <option value="Yazıcı">Yazıcı</option>
                          <option value="Router">Router</option>
                          <option value="Switch">Switch</option>
                          <option value="Telefon">Telefon</option>
                          <option value="Monitör">Monitör</option>
                          <option value="Sunucu">Sunucu</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-bold">Yapılan İşlem *</label>
                        <textarea
                          required
                          value={hardwareForm.make_model || ''}
                          onChange={(e) => setHardwareForm({ ...hardwareForm, make_model: e.target.value })}
                          rows={3}
                          className="form-control"
                          placeholder="Ne işlemi yapıldı? (Kurulum, Bakım, Onarım vb.)"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-bold">Durum</label>
                        <select
                          value={hardwareForm.status || 'Aktif'}
                          onChange={(e) => setHardwareForm({ ...hardwareForm, status: e.target.value })}
                          className="form-select"
                        >
                          <option value="Tamamlandı">Tamamlandı</option>
                          <option value="Devam Ediyor">Devam Ediyor</option>
                          <option value="Beklemede">Beklemede</option>
                          <option value="İptal">İptal</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Sağ Kolon */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Tarih</label>
                        <input
                          type="date"
                          value={hardwareForm.purchase_date || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setHardwareForm({ ...hardwareForm, purchase_date: e.target.value })}
                          className="form-control"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-bold">IP Adresi</label>
                        <input
                          type="text"
                          value={hardwareForm.ip_address || ''}
                          onChange={(e) => setHardwareForm({ ...hardwareForm, ip_address: e.target.value })}
                          className="form-control"
                          placeholder="192.168.1.100"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-bold">Notlar</label>
                        <textarea
                          value={hardwareForm.notes || ''}
                          onChange={(e) => setHardwareForm({ ...hardwareForm, notes: e.target.value })}
                          rows={5}
                          className="form-control"
                          placeholder="Ek bilgiler, detaylar..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                    <button
                      type="button"
                      onClick={resetHardwareForm}
                      className="btn btn-light px-4 py-2"
                      style={{borderRadius: '15px', fontWeight: '600'}}
                    >
                      ❌ İptal
                    </button>
                    <button
                      type="submit"
                      className="btn gradient-btn text-white px-4 py-2"
                      style={{fontWeight: '600'}}
                    >
                      {editingHardware ? '✏️ Güncelle' : '💾 Donanımı Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}


    </div>
    </>
  );
}
