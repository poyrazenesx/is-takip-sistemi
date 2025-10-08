'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, User, Hardware } from '@/types';
import { Plus, LogOut, Edit, Trash2, CheckCircle, Clock, AlertCircle, User as UserIcon, Search, FileText, Bell, X, Monitor, Eye, List, Columns, Calendar, BarChart3, Settings, TrendingUp, Users } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar' | 'timeline'>('list');
  
  // Dashboard Customization
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [enabledWidgets, setEnabledWidgets] = useState({
    statsOverview: true,
    quickStats: true,
    recentActivity: true,
    taskSummary: true,
    teamPerformance: false,
    chartView: false
  });

  // Theme Options State
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Keyboard Shortcuts State
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Quick Filters State
  const [quickFilters, setQuickFilters] = useState({
    showOverdue: false,
    showToday: false,
    showThisWeek: false,
    showHighPriority: false,
    showMyTasks: false
  });
  
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
    // Sadece aktif tab için veri çek
    if (activeTab === 'tasks') {
      fetchTasks();
    } else if (activeTab === 'notes') {
      fetchNotes();
    } else if (activeTab === 'hardware') {
      fetchHardware();
    }
  }, [activeTab]);

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

  // Load widget preferences and theme from localStorage
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets);
        setEnabledWidgets(parsedWidgets);
      } catch (error) {
        console.error('Error loading widget preferences:', error);
      }
    }

    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${savedTheme}`);
    }
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs or textareas
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
          case 'n':
            event.preventDefault();
            setShowTaskForm(true);
            break;
          case 'k':
            event.preventDefault();
            setShowShortcutsModal(true);
            break;
          case 't':
            event.preventDefault();
            setShowThemeSelector(true);
            break;
          case 'd':
            event.preventDefault();
            setShowCustomizeModal(true);
            break;
          case '1':
            event.preventDefault();
            setViewMode('list');
            break;
          case '2':
            event.preventDefault();
            setViewMode('kanban');
            break;
          case '3':
            event.preventDefault();
            setViewMode('calendar');
            break;
          case '4':
            event.preventDefault();
            setViewMode('timeline');
            break;
        }
      }

      // ESC key to close modals
      if (event.key === 'Escape') {
        setShowTaskForm(false);
        setShowHardwareForm(false);
        setShowCustomizeModal(false);
        setShowThemeSelector(false);
        setShowShortcutsModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fetchTasks = useCallback(async () => {
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
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Notlar alınamadı:', error);
    }
  }, []);

  const fetchHardware = useCallback(async () => {
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
  }, []);

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

  // Performance optimized filtered data
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search)
      );
    }

    // Quick filters
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    if (quickFilters.showToday) {
      filtered = filtered.filter(task => task.dueDate === todayStr);
    }

    if (quickFilters.showThisWeek) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      });
    }

    if (quickFilters.showOverdue) {
      filtered = filtered.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate) < today;
      });
    }

    if (quickFilters.showHighPriority) {
      filtered = filtered.filter(task => task.priority === 'high');
    }

    if (quickFilters.showMyTasks && user) {
      filtered = filtered.filter(task => task.assignedTo === user.id);
    }

    return filtered;
  }, [tasks, searchTerm, quickFilters, user]);

  // Calendar helper functions
  const getCurrentMonth = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth()
    };
  };

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDay = new Date(year, month, -i);
      days.push({ date: prevMonthDay, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      days.push({ date: currentDay, isCurrentMonth: true });
    }
    
    // Next month's leading days
    const remainingSlots = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingSlots; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({ date: nextMonthDay, isCurrentMonth: false });
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const { year, month } = getCurrentMonth();
  const monthDays = getDaysInMonth(year, month);
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

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

        if (response.ok) {
          fetchTasks();
          resetForm();
        } else {
          addNotification('Görev güncellenemedi', 'error');
        }
      } else {
        // Yeni görev
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

        if (response.ok) {
          await fetchTasks();
          resetForm();
          addNotification('Görev başarıyla oluşturuldu!', 'success');
          addBellNotification(`"${taskForm.title}" görevi oluşturuldu`, 'create');
        } else {
          addNotification('Görev oluşturulamadı', 'error');
        }
      }
    } catch (error) {
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
          <div className="spinner-border text-white spinner-large" role="status">
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

        /* Kanban Board Styles */
        .kanban-board {
          padding: 20px 0;
        }
        
        .kanban-column {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .kanban-header {
          padding: 15px 20px;
          border-radius: 15px 15px 0 0;
        }
        
        .todo-header {
          background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%);
        }
        
        .in-progress-header {
          background: linear-gradient(135deg, #4285f4 0%, #1976d2 100%);
        }
        
        .completed-header {
          background: linear-gradient(135deg, #34a853 0%, #137333 100%);
        }
        
        .kanban-content {
          padding: 20px;
          min-height: 400px;
          max-height: 600px;
          overflow-y: auto;
        }
        
        .kanban-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }
        
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: #1a202c;
        }
        
        .completed-card {
          background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
        }
        
        .priority-badge {
          font-size: 16px;
          font-weight: bold;
        }
        
        .kanban-card h6 {
          font-size: 14px;
          line-height: 1.4;
        }
        
        .kanban-card p {
          font-size: 12px;
          line-height: 1.3;
        }

        /* Calendar View Styles */
        .calendar-view {
          padding: 20px;
        }
        
        .calendar-grid {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
        }
        
        .weekday-header {
          padding: 15px 10px;
          text-align: center;
          font-weight: 600;
          color: white;
          font-size: 14px;
        }
        
        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e5e7eb;
        }
        
        .calendar-day {
          background: white;
          min-height: 120px;
          padding: 8px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .calendar-day:hover {
          background: #f8fafc;
        }
        
        .calendar-day.other-month {
          background: #f1f5f9;
          color: #94a3b8;
        }
        
        .calendar-day.today {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }
        
        .day-number {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .today .day-number {
          color: #1d4ed8;
        }
        
        .day-tasks {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .task-item {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 4px;
          padding: 4px 6px;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          justify-content: between;
          align-items: center;
          border-left: 3px solid #3b82f6;
        }
        
        .task-item.todo {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left-color: #f59e0b;
        }
        
        .task-item.in-progress {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-left-color: #3b82f6;
        }
        
        .task-item.completed {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border-left-color: #10b981;
        }
        
        .task-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .task-status {
          margin-left: 4px;
          font-size: 8px;
        }
        
        .more-tasks {
          font-size: 9px;
          color: #6b7280;
          text-align: center;
          padding: 2px;
        }
        
        .calendar-legend {
          text-align: center;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .legend-dot.todo {
          background: #f59e0b;
        }
        
        .legend-dot.in-progress {
          background: #3b82f6;
        }
        
        .legend-dot.completed {
          background: #10b981;
        }

        /* Timeline View Styles */
        .timeline-view {
          padding: 20px;
        }
        
        .timeline-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .timeline-section {
          margin-bottom: 40px;
        }
        
        .timeline-status-header {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          color: white;
          padding: 15px 25px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .timeline-tasks {
          position: relative;
          padding-left: 30px;
        }
        
        .timeline-tasks::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #e5e7eb, #d1d5db);
        }
        
        .timeline-task {
          position: relative;
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-left: 20px;
        }
        
        .timeline-marker {
          position: absolute;
          left: -35px;
          top: 20px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #e5e7eb;
          border: 3px solid white;
          box-shadow: 0 0 0 3px #e5e7eb;
        }
        
        .timeline-task.todo .timeline-marker {
          background: #f59e0b;
          box-shadow: 0 0 0 3px #fbbf24;
        }
        
        .timeline-task.in-progress .timeline-marker {
          background: #3b82f6;
          box-shadow: 0 0 0 3px #60a5fa;
        }
        
        .timeline-task.completed .timeline-marker {
          background: #10b981;
          box-shadow: 0 0 0 3px #34d399;
        }
        
        .timeline-content .task-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .timeline-content .priority-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          background: #f3f4f6;
          color: #374151;
          font-weight: 600;
        }
        
        .task-meta {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 10px;
        }
        
        .task-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
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
      
      <div className="dashboard-container">
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
                  Hoş geldin, <span className="fw-bold text-welcome">{user?.name}</span> 👋
                </h5>
                <p className="text-muted small mb-0">Hastane Bilgi İşlem Sistemi</p>
              </div>
              <div className="col-md-6 text-end">

                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className="btn btn-outline-info me-2"
                  title="Kısayol Tuşları (Ctrl+K)"
                >
                  ⌨️
                </button>

                <button
                  onClick={() => setShowThemeSelector(true)}
                  className="btn btn-outline-primary me-2"
                  title="Tema Seç (Ctrl+T)"
                >
                  🎨
                </button>

                <button
                  onClick={() => setShowCustomizeModal(true)}
                  className="btn btn-outline-secondary me-2"
                  title="Dashboard'ı Özelleştir"
                >
                  <Settings size={18} />
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
          {/* Customizable Widgets */}
          
          {/* Quick Stats Widget */}
          {enabledWidgets.quickStats && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="glass-card rounded-4 p-3">
                  <div className="d-flex align-items-center justify-content-center gap-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="stat-icon-small stat-icon-dark">
                        <FileText className="text-white" size={16} />
                      </div>
                      <span className="fw-bold text-dark">{notes.length} Not</span>
                    </div>
                    <div className="text-muted">•</div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="stat-icon-small stat-icon-blue">
                        <UserIcon className="text-white" size={16} />
                      </div>
                      <span className="fw-bold text-dark">{users.length} Kullanıcı</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Task Summary Widget */}
          {enabledWidgets.taskSummary && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="glass-card rounded-4 p-4">
                  <h5 className="fw-bold mb-3 text-center text-dark">📊 Görev Özeti</h5>
                  <div className="row text-center">
                    <div className="col-md-4">
                      <div className="p-3">
                        <div className="h2 fw-bold text-warning">{filteredTasks.filter(t => t.status === 'todo').length}</div>
                        <div className="text-muted">Bekleyen</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3">
                        <div className="h2 fw-bold text-primary">{filteredTasks.filter(t => t.status === 'in-progress').length}</div>
                        <div className="text-muted">Devam Eden</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3">
                        <div className="h2 fw-bold text-success">{filteredTasks.filter(t => t.status === 'completed').length}</div>
                        <div className="text-muted">Tamamlanan</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Performance Widget */}
          {enabledWidgets.teamPerformance && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="glass-card rounded-4 p-4">
                  <h5 className="fw-bold mb-3 text-dark">
                    <Users className="me-2" size={20} />
                    Takım Performansı
                  </h5>
                  <div className="row">
                    {users.slice(0, 4).map(user => {
                      const userTasks = tasks.filter(task => task.assignedTo === user.id);
                      const completedTasks = userTasks.filter(task => task.status === 'completed').length;
                      const totalTasks = userTasks.length;
                      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                      
                      return (
                        <div key={user.id} className="col-md-3 mb-3">
                          <div className="text-center">
                            <div className="avatar mx-auto mb-2" style={{
                              width: '50px',
                              height: '50px',
                              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '18px',
                              fontWeight: 'bold'
                            }}>
                              {user.name.charAt(0)}
                            </div>
                            <h6 className="fw-bold mb-1">{user.name}</h6>
                            <div className="text-muted small">{completedTasks}/{totalTasks} görev</div>
                            <div className={`fw-bold ${percentage >= 80 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-danger'}`}>
                              %{percentage}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart View Widget */}
          {enabledWidgets.chartView && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="glass-card rounded-4 p-4">
                  <h5 className="fw-bold mb-3 text-dark">
                    <TrendingUp className="me-2" size={20} />
                    İstatistik Grafikleri
                  </h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="chart-placeholder text-center p-4" style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '10px',
                        border: '2px dashed #cbd5e1'
                      }}>
                        <TrendingUp size={40} className="text-muted mb-2" />
                        <div className="text-muted">Haftalık Görev Trendi</div>
                        <div className="text-muted small">(Chart.js ile entegre edilecek)</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="chart-placeholder text-center p-4" style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '10px',
                        border: '2px dashed #cbd5e1'
                      }}>
                        <BarChart3 size={40} className="text-muted mb-2" />
                        <div className="text-muted">Departman Bazlı Analiz</div>
                        <div className="text-muted small">(Chart.js ile entegre edilecek)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
          
          {/* Arama ve Hızlı Filtreler */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="glass-card rounded-4 p-4">
                {/* Arama Kutusu */}
                <div className="d-flex align-items-center gap-3 mb-3">
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
                  
                  {/* View Mode Selector */}
                  {activeTab === 'tasks' && (
                    <div className="d-flex gap-2 ms-auto">
                      <button
                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('list')}
                        title="Liste Görünümü"
                      >
                        <List size={16} />
                      </button>
                      <button
                        className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('kanban')}
                        title="Kanban Görünümü"
                      >
                        <Columns size={16} />
                      </button>
                      <button
                        className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('calendar')}
                        title="Takvim Görünümü"
                      >
                        <Calendar size={16} />
                      </button>
                      <button
                        className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('timeline')}
                        title="Zaman Çizelgesi"
                      >
                        <BarChart3 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Hızlı Filtreler */}
                {activeTab === 'tasks' && (
                  <div className="quick-filters-section">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-muted small fw-bold">🔍 Hızlı Filtreler:</span>
                      
                      <button
                        className={`btn btn-sm ${quickFilters.showToday ? 'btn-warning' : 'btn-outline-warning'}`}
                        onClick={() => setQuickFilters(prev => ({...prev, showToday: !prev.showToday}))}
                      >
                        📅 Bugün
                      </button>
                      
                      <button
                        className={`btn btn-sm ${quickFilters.showThisWeek ? 'btn-info' : 'btn-outline-info'}`}
                        onClick={() => setQuickFilters(prev => ({...prev, showThisWeek: !prev.showThisWeek}))}
                      >
                        📆 Bu Hafta
                      </button>
                      
                      <button
                        className={`btn btn-sm ${quickFilters.showOverdue ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => setQuickFilters(prev => ({...prev, showOverdue: !prev.showOverdue}))}
                      >
                        ⏰ Geciken
                      </button>
                      
                      <button
                        className={`btn btn-sm ${quickFilters.showHighPriority ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setQuickFilters(prev => ({...prev, showHighPriority: !prev.showHighPriority}))}
                      >
                        ⭐ Yüksek Öncelik
                      </button>
                      
                      <button
                        className={`btn btn-sm ${quickFilters.showMyTasks ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setQuickFilters(prev => ({...prev, showMyTasks: !prev.showMyTasks}))}
                      >
                        👤 Benim Görevlerim
                      </button>

                      {(quickFilters.showToday || quickFilters.showThisWeek || quickFilters.showOverdue || quickFilters.showHighPriority || quickFilters.showMyTasks) && (
                        <button
                          className="btn btn-sm btn-outline-secondary ms-2"
                          onClick={() => setQuickFilters({
                            showOverdue: false,
                            showToday: false,
                            showThisWeek: false,
                            showHighPriority: false,
                            showMyTasks: false
                          })}
                          title="Tüm filtreleri temizle"
                        >
                          ✕ Temizle
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
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
                  <div className="status-dot status-high"></div>
                  <div className="status-dot status-medium"></div>
                  <div className="status-dot status-low"></div>
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
            ) : viewMode === 'kanban' ? (
              /* Kanban Board View */
              <div className="kanban-board">
                <div className="row g-3">
                  {/* Todo Column */}
                  <div className="col-lg-4 col-md-6">
                    <div className="kanban-column">
                      <div className="kanban-header todo-header">
                        <h5 className="mb-0 fw-bold text-white">
                          <Clock size={18} className="me-2" />
                          Yapılacak ({filteredTasks.filter(t => t.status === 'todo').length})
                        </h5>
                      </div>
                      <div className="kanban-content">
                        {filteredTasks.filter(task => task.status === 'todo').map(task => (
                          <div key={task.id} className="kanban-card">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold text-dark mb-1">{task.title}</h6>
                              <span className={`priority-badge ${task.priority || 'medium'}`}>
                                {task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡'}
                              </span>
                            </div>
                            <p className="text-muted small mb-2">{task.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                👤 {getUserName(task.assignedTo)}
                              </small>
                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="btn btn-sm btn-outline-primary"
                                  title="Düzenle"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="col-lg-4 col-md-6">
                    <div className="kanban-column">
                      <div className="kanban-header in-progress-header">
                        <h5 className="mb-0 fw-bold text-white">
                          <AlertCircle size={18} className="me-2" />
                          Devam Eden ({filteredTasks.filter(t => t.status === 'in-progress').length})
                        </h5>
                      </div>
                      <div className="kanban-content">
                        {filteredTasks.filter(task => task.status === 'in-progress').map(task => (
                          <div key={task.id} className="kanban-card">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold text-dark mb-1">{task.title}</h6>
                              <span className={`priority-badge ${task.priority || 'medium'}`}>
                                {task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡'}
                              </span>
                            </div>
                            <p className="text-muted small mb-2">{task.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                👤 {getUserName(task.assignedTo)}
                              </small>
                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="btn btn-sm btn-outline-primary"
                                  title="Düzenle"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Completed Column */}
                  <div className="col-lg-4 col-md-12">
                    <div className="kanban-column">
                      <div className="kanban-header completed-header">
                        <h5 className="mb-0 fw-bold text-white">
                          <CheckCircle size={18} className="me-2" />
                          Tamamlanan ({filteredTasks.filter(t => t.status === 'completed').length})
                        </h5>
                      </div>
                      <div className="kanban-content">
                        {filteredTasks.filter(task => task.status === 'completed').map(task => (
                          <div key={task.id} className="kanban-card completed-card">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold text-success mb-1">{task.title}</h6>
                              <span className={`priority-badge ${task.priority || 'medium'}`}>
                                {task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡'}
                              </span>
                            </div>
                            <p className="text-muted small mb-2">{task.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-success">
                                👤 {getUserName(task.assignedTo)} ✅
                              </small>
                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="btn btn-sm btn-outline-primary"
                                  title="Düzenle"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : viewMode === 'calendar' ? (
              /* Calendar View */
              <div className="calendar-view">
                <div className="calendar-header text-center mb-4">
                  <h3 className="fw-bold text-dark mb-2">
                    📅 {monthNames[month]} {year}
                  </h3>
                  <p className="text-muted">Görevlerinizi takvim görünümünde planlayın</p>
                </div>
                
                <div className="calendar-grid">
                  {/* Week Days Header */}
                  <div className="calendar-weekdays">
                    <div className="weekday-header">Paz</div>
                    <div className="weekday-header">Pzt</div>
                    <div className="weekday-header">Sal</div>
                    <div className="weekday-header">Çar</div>
                    <div className="weekday-header">Per</div>
                    <div className="weekday-header">Cum</div>
                    <div className="weekday-header">Cmt</div>
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="calendar-days">
                    {monthDays.map((day, index) => {
                      const dayTasks = getTasksForDate(day.date);
                      const isToday = day.date.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={index}
                          className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                        >
                          <div className="day-number">
                            {day.date.getDate()}
                          </div>
                          
                          <div className="day-tasks">
                            {dayTasks.slice(0, 3).map(task => (
                              <div
                                key={task.id}
                                className={`task-item ${task.status}`}
                                title={`${task.title} - ${task.description}`}
                                onClick={() => handleEditTask(task)}
                              >
                                <span className="task-title">{task.title}</span>
                                <span className={`task-status ${task.status}`}>
                                  {task.status === 'todo' ? '⏳' : task.status === 'in-progress' ? '🔄' : '✅'}
                                </span>
                              </div>
                            ))}
                            
                            {dayTasks.length > 3 && (
                              <div className="more-tasks">
                                +{dayTasks.length - 3} daha
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="calendar-legend mt-4">
                  <div className="d-flex justify-content-center gap-4">
                    <div className="legend-item">
                      <span className="legend-dot todo"></span>
                      <span>Yapılacak</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot in-progress"></span>
                      <span>Devam Eden</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot completed"></span>
                      <span>Tamamlanan</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : viewMode === 'timeline' ? (
              /* Timeline View */
              <div className="timeline-view">
                <div className="timeline-header text-center mb-4">
                  <h3 className="fw-bold text-dark mb-2">
                    📊 Proje Zaman Çizelgesi
                  </h3>
                  <p className="text-muted">Görevlerinizin kronolojik akışını görün</p>
                </div>
                
                <div className="timeline-container">
                  {['todo', 'in-progress', 'completed'].map(status => {
                    const statusTasks = filteredTasks.filter(task => task.status === status);
                    const statusTitle = status === 'todo' ? 'Yapılacak' : status === 'in-progress' ? 'Devam Eden' : 'Tamamlanan';
                    const statusIcon = status === 'todo' ? '⏳' : status === 'in-progress' ? '🔄' : '✅';
                    
                    return (
                      <div key={status} className="timeline-section">
                        <div className="timeline-status-header">
                          <h4 className="fw-bold">
                            {statusIcon} {statusTitle} ({statusTasks.length})
                          </h4>
                        </div>
                        
                        <div className="timeline-tasks">
                          {statusTasks.map((task, index) => (
                            <div key={task.id} className={`timeline-task ${status}`}>
                              <div className="timeline-marker"></div>
                              <div className="timeline-content">
                                <div className="task-header">
                                  <h6 className="fw-bold mb-1">{task.title}</h6>
                                  <span className={`priority-badge ${task.priority || 'medium'}`}>
                                    {task.priority === 'high' ? '🔴 Yüksek' : task.priority === 'low' ? '🟢 Düşük' : '🟡 Orta'}
                                  </span>
                                </div>
                                <p className="text-muted mb-2">{task.description}</p>
                                <div className="task-meta">
                                  <span className="assignee">
                                    👤 {getUserName(task.assignedTo)}
                                  </span>
                                  <span className="created-date">
                                    📅 {new Date(task.createdAt).toLocaleDateString('tr-TR')}
                                  </span>
                                  {task.dueDate && (
                                    <span className="due-date">
                                      ⏰ {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                                    </span>
                                  )}
                                </div>
                                <div className="timeline-actions mt-2">
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className="btn btn-sm btn-outline-primary me-2"
                                  >
                                    <Eye size={14} className="me-1" />
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="btn btn-sm btn-outline-danger"
                                  >
                                    <X size={14} className="me-1" />
                                    Sil
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr className="table-header-bg">
                      <th className="border-0 fw-bold text-uppercase small ps-4 py-3">📋 Görev</th>
                      <th className="border-0 fw-bold text-uppercase small py-3">👤 Atanan</th>
                      <th className="border-0 fw-bold text-uppercase small py-3">📊 Durum</th>
                      <th className="border-0 fw-bold text-uppercase small py-3">⚡ Öncelik</th>
                      <th className="border-0 fw-bold text-uppercase small pe-4 py-3">🔧 İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks
                      .map((task, index) => (
                      <tr key={task.id} style={{borderBottom: '1px solid rgba(0,0,0,0.05)'}}>
                        <td className="border-0 ps-4 py-4">
                          <div>
                            <h6 className="fw-bold mb-1 text-dark">{task.title}</h6>
                            <p className="text-muted small mb-0 bg-light rounded-pill px-3 py-1 d-inline-block">
                              {task.description}
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

        {/* Keyboard Shortcuts Modal */}
        {showShortcutsModal && (
          <div className="modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
            <div className="modal-content p-0" style={{maxWidth: '600px', width: '90%'}}>
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="gradient-text fw-bold fs-4 mb-0">
                    ⌨️ Kısayol Tuşları
                  </h3>
                  <button
                    onClick={() => setShowShortcutsModal(false)}
                    className="close-button-custom"
                    title="Kapat"
                  >
                    ✕
                  </button>
                </div>

                <div className="shortcuts-content">
                  <div className="row">
                    <div className="col-md-6">
                      <h5 className="fw-bold mb-3">🚀 Genel İşlemler</h5>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>N</kbd></span>
                        <span className="shortcut-desc">Yeni Görev Ekle</span>
                      </div>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>D</kbd></span>
                        <span className="shortcut-desc">Dashboard Özelleştir</span>
                      </div>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>T</kbd></span>
                        <span className="shortcut-desc">Tema Seç</span>
                      </div>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
                        <span className="shortcut-desc">Kısayol Tuşları</span>
                      </div>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>ESC</kbd></span>
                        <span className="shortcut-desc">Modal Kapat</span>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <h5 className="fw-bold mb-3">👁️ Görünüm Modları</h5>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>1</kbd></span>
                        <span className="shortcut-desc">Liste Görünümü</span>
                      </div>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>2</kbd></span>
                        <span className="shortcut-desc">Kanban Görünümü</span>
                      </div>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>3</kbd></span>
                        <span className="shortcut-desc">Takvim Görünümü</span>
                      </div>
                      <div className="shortcut-item">
                        <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>4</kbd></span>
                        <span className="shortcut-desc">Zaman Çizelgesi</span>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mt-4">
                    <small>
                      💡 <strong>İpucu:</strong> Kısayol tuşları form alanlarına odaklanmadığınız zamanlarda çalışır.
                    </small>
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button
                      onClick={() => setShowShortcutsModal(false)}
                      className="submit-button-custom btn btn-primary"
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theme Selector Modal */}
        {showThemeSelector && (
          <div className="modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
            <div className="modal-content p-0" style={{maxWidth: '500px', width: '90%'}}>
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="gradient-text fw-bold fs-4 mb-0">
                    🎨 Tema Seç
                  </h3>
                  <button
                    onClick={() => setShowThemeSelector(false)}
                    className="close-button-custom"
                    title="Kapat"
                  >
                    ✕
                  </button>
                </div>

                <div className="theme-options">
                  <div className="row g-3">
                    <div className="col-6">
                      <div 
                        className={`theme-card ${currentTheme === 'default' ? 'active' : ''}`}
                        onClick={() => setCurrentTheme('default')}
                      >
                        <div className="theme-preview default-theme">
                          <div className="theme-header"></div>
                          <div className="theme-content">
                            <div className="theme-card-item"></div>
                            <div className="theme-card-item"></div>
                          </div>
                        </div>
                        <div className="theme-title mt-2">Varsayılan</div>
                      </div>
                    </div>

                    <div className="col-6">
                      <div 
                        className={`theme-card ${currentTheme === 'modern' ? 'active' : ''}`}
                        onClick={() => setCurrentTheme('modern')}
                      >
                        <div className="theme-preview modern-theme">
                          <div className="theme-header"></div>
                          <div className="theme-content">
                            <div className="theme-card-item"></div>
                            <div className="theme-card-item"></div>
                          </div>
                        </div>
                        <div className="theme-title mt-2">Modern</div>
                      </div>
                    </div>

                    <div className="col-6">
                      <div 
                        className={`theme-card ${currentTheme === 'elegant' ? 'active' : ''}`}
                        onClick={() => setCurrentTheme('elegant')}
                      >
                        <div className="theme-preview elegant-theme">
                          <div className="theme-header"></div>
                          <div className="theme-content">
                            <div className="theme-card-item"></div>
                            <div className="theme-card-item"></div>
                          </div>
                        </div>
                        <div className="theme-title mt-2">Elegant</div>
                      </div>
                    </div>

                    <div className="col-6">
                      <div 
                        className={`theme-card ${currentTheme === 'vibrant' ? 'active' : ''}`}
                        onClick={() => setCurrentTheme('vibrant')}
                      >
                        <div className="theme-preview vibrant-theme">
                          <div className="theme-header"></div>
                          <div className="theme-content">
                            <div className="theme-card-item"></div>
                            <div className="theme-card-item"></div>
                          </div>
                        </div>
                        <div className="theme-title mt-2">Canlı</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      onClick={() => setShowThemeSelector(false)}
                      className="btn btn-outline-secondary"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={() => {
                        setShowThemeSelector(false);
                        localStorage.setItem('appTheme', currentTheme);
                        // Apply theme class to body
                        document.body.className = document.body.className.replace(/theme-\w+/g, '');
                        document.body.classList.add(`theme-${currentTheme}`);
                      }}
                      className="submit-button-custom btn btn-primary"
                    >
                      Temayı Uygula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Customization Modal */}
        {showCustomizeModal && (
          <div className="modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
            <div className="modal-content p-0" style={{maxWidth: '600px', width: '90%'}}>
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="gradient-text fw-bold fs-4 mb-0">
                    <Settings className="me-2" size={24} />
                    Dashboard'ı Özelleştir
                  </h3>
                  <button
                    onClick={() => setShowCustomizeModal(false)}
                    className="close-button-custom"
                    title="Kapat"
                  >
                    ✕
                  </button>
                </div>

                <div className="customize-content">
                  <h5 className="fw-bold mb-3 text-dark">Widget'ları Seç</h5>
                  <p className="text-muted mb-4">Dashboard'ınızda görmek istediğiniz widget'ları seçin:</p>
                  
                  <div className="widget-options">
                    <div className="form-check widget-option mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="quickStats"
                        checked={enabledWidgets.quickStats}
                        onChange={(e) => setEnabledWidgets(prev => ({...prev, quickStats: e.target.checked}))}
                      />
                      <label className="form-check-label fw-bold" htmlFor="quickStats">
                        📊 Hızlı İstatistikler
                      </label>
                      <div className="text-muted small">Not sayısı ve kullanıcı bilgileri</div>
                    </div>

                    <div className="form-check widget-option mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="taskSummary"
                        checked={enabledWidgets.taskSummary}
                        onChange={(e) => setEnabledWidgets(prev => ({...prev, taskSummary: e.target.checked}))}
                      />
                      <label className="form-check-label fw-bold" htmlFor="taskSummary">
                        📋 Görev Özeti
                      </label>
                      <div className="text-muted small">Bekleyen, devam eden ve tamamlanan görev sayıları</div>
                    </div>

                    <div className="form-check widget-option mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="teamPerformance"
                        checked={enabledWidgets.teamPerformance}
                        onChange={(e) => setEnabledWidgets(prev => ({...prev, teamPerformance: e.target.checked}))}
                      />
                      <label className="form-check-label fw-bold" htmlFor="teamPerformance">
                        👥 Takım Performansı
                      </label>
                      <div className="text-muted small">Kullanıcı bazlı görev tamamlama oranları</div>
                    </div>

                    <div className="form-check widget-option mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="chartView"
                        checked={enabledWidgets.chartView}
                        onChange={(e) => setEnabledWidgets(prev => ({...prev, chartView: e.target.checked}))}
                      />
                      <label className="form-check-label fw-bold" htmlFor="chartView">
                        📈 Grafik Görünümü
                      </label>
                      <div className="text-muted small">Trend grafikleri ve analitik görselleştirmeler</div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      onClick={() => setShowCustomizeModal(false)}
                      className="btn btn-outline-secondary"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomizeModal(false);
                        // Save preferences to localStorage
                        localStorage.setItem('dashboardWidgets', JSON.stringify(enabledWidgets));
                      }}
                      className="submit-button-custom btn btn-primary"
                    >
                      Değişiklikleri Kaydet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
