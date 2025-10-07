'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, User } from '@/types';
import { Plus, LogOut, Edit, Trash2, CheckCircle, Clock, AlertCircle, User as UserIcon, Search, FileText, Bell, X } from 'lucide-react';
import Notes from '@/components/Notes';

interface DashboardProps {
  users: User[];
}

export default function Dashboard({ users }: DashboardProps) {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
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
  
  // Hover navbar
  const [showNavbar, setShowNavbar] = useState(false);

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
        
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          transition: all 0.5s ease;
        }
        
        /* Hover Navbar */
        .hover-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(26, 32, 44, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transform: translateY(-100%);
          transition: transform 0.3s ease;
          z-index: 1000;
          padding: 10px 0;
        }
        
        .hover-navbar.show {
          transform: translateY(0);
        }
        
        .hover-navbar .nav-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
        }
        
        .hover-navbar .nav-link {
          color: white;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 8px;
          transition: background 0.2s ease;
          font-weight: 500;
        }
        
        .hover-navbar .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .hover-trigger {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 30px;
          z-index: 999;
          background: transparent;
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
        

      `}</style>
      
      {/* Hover Trigger Area */}
      <div 
        className="hover-trigger"
        onMouseEnter={() => setShowNavbar(true)}
        onMouseLeave={() => setShowNavbar(false)}
      />
      
      {/* Hover Navbar */}
      <nav 
        className={`hover-navbar ${showNavbar ? 'show' : ''}`}
        onMouseEnter={() => setShowNavbar(true)}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <div className="container">
          <div className="nav-links">
            <a href="#" className="nav-link">📊 Dashboard</a>
            <a href="#" className="nav-link">📝 Notlar</a>
            <a href="#" className="nav-link">✅ Görevler</a>
            <a href="#" className="nav-link">📈 Raporlar</a>
            <a href="#" className="nav-link">⚙️ Ayarlar</a>
            <a href="#" className="nav-link">👥 Kullanıcılar</a>
          </div>
        </div>
      </nav>

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
                      {activeTab === 'tasks' ? ' (Görevlerde)' : activeTab === 'notes' ? ' (Notlarda)' : ''}
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
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="action-btn delete-btn"
                              title="Görevi Sil"
                            >
                              <Trash2 size={16} />
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


    </div>
    </>
  );
}
