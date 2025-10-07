'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Note, NoteCategory, Attachment } from '@/types';
import FileUpload from './FileUpload';
import { Bell, X, Plus, Edit, Trash2 } from 'lucide-react';

interface NotesProps {
  searchTerm?: string;
}

const Notes = ({ searchTerm: externalSearchTerm = '' }: NotesProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: '',
    attachmentUrl: '',
    attachmentName: ''
  });
  const [noteAttachments, setNoteAttachments] = useState<Attachment[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Real-time Search States
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Notification States - Dashboard ile uyumlu hale getir
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>>([]);
  
  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  // Helper Functions
  const getFileIcon = (fileName: string, fileType?: string): string => {
    if (!fileName && !fileType) return '📄';
    
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    const type = fileType?.toLowerCase() || '';
    
    // Image files
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return '🖼️';
    }
    // Document files  
    if (['pdf'].includes(extension) || type === 'application/pdf') return '📕';
    if (['doc', 'docx'].includes(extension) || type.includes('word')) return '📘';
    if (['xls', 'xlsx'].includes(extension) || type.includes('sheet')) return '📗';
    if (['ppt', 'pptx'].includes(extension) || type.includes('presentation')) return '📙';
    // Text files
    if (['txt'].includes(extension) || type === 'text/plain') return '📝';
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return '🗜️';
    // Video files
    if (type.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
      return '🎬';
    }
    // Audio files
    if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
      return '🎵';
    }
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'php', 'py', 'java', 'cpp', 'c'].includes(extension)) {
      return '💻';
    }
    
    return '📄'; // Default file icon
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Default kategoriler
  const defaultCategories: NoteCategory[] = [
    { id: 'servis', name: 'Servis', icon: '🏥' },
    { id: 'poliklinikler', name: 'Poliklinikler', icon: '👩‍⚕️' },
    { id: 'eczane', name: 'Eczane', icon: '💊' },
    { id: 'genel-hasta-kayit', name: 'Genel Hasta Kayıt', icon: '📋' },
    { id: 'kalite', name: 'Kalite', icon: '⭐' },
    { id: 'dilekceler', name: 'Dilekçeler', icon: '📝' },
    { id: 'idare', name: 'İdare', icon: '🏛️' }
  ];

  useEffect(() => {
    setCategories(defaultCategories);
    fetchNotes();
  }, [selectedCategory]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const url = selectedCategory ? `/api/notes?category=${selectedCategory}` : '/api/notes';
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setNotes(data.notes || []);
        if (data.categories) {
          setCategories(data.categories);
        }
      } else {
        console.error('Notes fetch error:', data.error);
      }
    } catch (error) {
      console.error('Notes fetch hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Notification system - Dashboard ile uyumlu
  const addNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      if (editingNote) {
        // Not güncelle
        const attachmentUrl = noteAttachments.length > 0 ? noteAttachments[0].filePath : noteForm.attachmentUrl;
        const attachmentName = noteAttachments.length > 0 ? noteAttachments[0].fileName : noteForm.attachmentName;
        
        const response = await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNote.id,
            ...noteForm,
            title: noteForm.title.toUpperCase(), // Başlığı büyük harfe çevir
            attachmentUrl,
            attachmentName,
            updatedBy: user?.id || 1
          }),
        });

        if (response.ok) {
          const result = await response.json();
          fetchNotes();
          resetForm();
          addNotification(`"${noteForm.title}" başarıyla güncellendi!`, 'success');
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: await response.text() };
          }
          
          addNotification('Not güncellenemedi. Lütfen tekrar deneyin.', 'error');
        }
      } else {
        // Yeni not oluştur
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...noteForm,
            title: noteForm.title.toUpperCase(), // Başlığı büyük harfe çevir
            attachments: noteAttachments, // Tüm attachments'ları gönder
            attachmentUrl: noteForm.attachmentUrl, // Eski system için backward compatibility
            attachmentName: noteForm.attachmentName,
            createdBy: user?.id || 1
          }),
        });

        if (response.ok) {
          await fetchNotes();
          resetForm();
          addNotification('Not başarıyla oluşturuldu!', 'success');
        } else {
          const errorData = await response.text();
          addNotification('Not oluşturulamadı. Lütfen tekrar deneyin.', 'error');
        }
      }
    } catch (error) {
      addNotification('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category,
      attachmentUrl: note.attachmentUrl || '',
      attachmentName: note.attachmentName || ''
    });
    setShowModal(true);
  };

  const handleDeleteNote = async (noteId: number) => {
    setNoteToDelete(noteId);
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      const response = await fetch(`/api/notes?id=${noteToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchNotes();
        addNotification('Not başarıyla silindi!', 'success');
      } else {
        addNotification('Not silinirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Note delete hatası:', error);
      addNotification('Silme işlemi sırasında hata oluştu', 'error');
    }
    
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  const resetForm = () => {
    setNoteForm({
      title: '',
      content: '',
      category: '',
      attachmentUrl: '',
      attachmentName: ''
    });
    setEditingNote(null);
    setShowModal(false);
    setNoteAttachments([]);
    setShowFileUpload(false);
    setIsUploading(false);
  };

  const handleFileUploadStart = () => {
    setIsUploading(true);
  };

  const handleFileUploadComplete = (attachments: Attachment[]) => {
    setNoteAttachments(prev => [...prev, ...attachments]);
    setIsUploading(false);
  };

  const handleViewNote = (note: Note) => {
    setViewingNote(note);
    setShowDetailModal(true);
  };

  const handleEditFromDetail = () => {
    if (viewingNote) {
      setEditingNote(viewingNote);
      setNoteForm({
        title: viewingNote.title,
        content: viewingNote.content,
        category: viewingNote.category,
        attachmentUrl: viewingNote.attachmentUrl || '',
        attachmentName: viewingNote.attachmentName || ''
      });
      setShowDetailModal(false);
      setShowModal(true);
    }
  };

  const closeDetailModal = () => {
    setViewingNote(null);
    setShowDetailModal(false);
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '📄' };
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('tr-TR');
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

  // Real-time Search Function
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (value.trim().length > 0) {
      const searchResults = notes.filter(note => 
        note.title.toLowerCase().includes(value.toLowerCase()) ||
        note.content.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Sadece ilk 5 sonuç
      
      setSearchResults(searchResults);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  // Navigate to Note
  const navigateToNote = (note: Note) => {
    setViewingNote(note);
    setShowDetailModal(true);
    setShowSearchDropdown(false);
    setSearchTerm('');
    addNotification(`"${note.title}" notuna yönlendirildin`);
  };

  return (
    <>
      {/* Google Alumni Sans Font */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Alumni+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" 
        rel="stylesheet"
      />
      
      {/* Notification System */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
      
    <div className="container-fluid py-4">
      <style jsx global>{`
        /* Global Alumni Sans Font */
        * {
          font-family: 'Alumni Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        /* Notification Styles */
        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
        }
        
        .notification {
          padding: 12px 20px;
          margin-bottom: 10px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          animation: slideIn 0.3s ease-out;
          min-width: 300px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .notification.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .notification.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .notification.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Tasks Table Card Style - Dashboard ile uyumlu */
        .tasks-table-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .table-header {
          margin-bottom: 2rem;
        }

        .gradient-text {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .table-responsive {
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .table {
          margin-bottom: 0;
          background: white;
        }

        .table th {
          background: rgba(102, 126, 234, 0.05) !important;
          border-bottom: none !important;
          font-weight: 700 !important;
          color: #4a5568 !important;
          padding: 1rem 1.5rem !important;
        }

        .table td {
          padding: 1.5rem !important;
          vertical-align: middle !important;
          border-bottom: 1px solid rgba(0,0,0,0.05) !important;
        }

        .action-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem !important;
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
          border-radius: 0.375rem !important;
        }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="gradient-text fw-bold fs-1 mb-0">📝 Birim Notları Yönetimi</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn gradient-btn text-white px-4 py-2"
          style={{
            background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
            border: 'none',
            borderRadius: '15px',
            fontWeight: '600'
          }}
        >
          <Plus className="me-2" size={18} />
          Yeni Not Ekle
        </button>
      </div>

      {/* Kategoriler Filtresi */}
      <div className="mb-4">
        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-outline-primary'}`}
            style={{ borderRadius: '20px' }}
          >
            🔍 Tümü ({notes.length})
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`btn ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ borderRadius: '20px' }}
            >
              {category.icon} {category.name} ({notes.filter(note => note.category === category.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Notlar Tablosu - Görevler tarzında */}
      <div className="tasks-table-card">
        <div className="table-header">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="gradient-text fw-bold fs-3 mb-0">📝 Birim Notları</h2>
            <div className="d-flex gap-2">
              <div style={{width: '12px', height: '12px', backgroundColor: '#ff6b6b', borderRadius: '50%'}}></div>
              <div style={{width: '12px', height: '12px', backgroundColor: '#feca57', borderRadius: '50%'}}></div>
              <div style={{width: '12px', height: '12px', backgroundColor: '#48cab2', borderRadius: '50%'}}></div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
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
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
            <h4 className="fw-bold text-dark mb-3">Notlar yükleniyor...</h4>
          </div>
        ) : notes.length === 0 ? (
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
            <h4 className="fw-bold text-dark mb-3">Henüz not yok</h4>
            <p className="text-muted mb-4">İlk notunuzu oluşturun ve bilgi paylaşımını başlatın!</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn gradient-btn text-white px-4 py-3"
              style={{
                background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                border: 'none',
                borderRadius: '15px'
              }}
            >
              <Plus className="me-2" size={18} />
              İlk Notumu Oluştur 🚀
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr style={{backgroundColor: 'rgba(102, 126, 234, 0.05)'}}>
                  <th className="border-0 fw-bold text-uppercase small ps-4 py-3">📝 Başlık</th>
                  <th className="border-0 fw-bold text-uppercase small py-3">📂 Birim</th>
                  <th className="border-0 fw-bold text-uppercase small py-3">📄 İçerik</th>
                  <th className="border-0 fw-bold text-uppercase small py-3">📅 Tarih</th>
                  <th className="border-0 fw-bold text-uppercase small pe-4 py-3">🔧 İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {notes
                  .filter(note => {
                    // Kategori filtresi
                    if (selectedCategory && note.category !== selectedCategory) return false;
                    // Arama filtresi
                    if (!externalSearchTerm && !searchTerm) return true;
                    const term = externalSearchTerm || searchTerm;
                    return note.title.toLowerCase().includes(term.toLowerCase()) ||
                           note.content.toLowerCase().includes(term.toLowerCase());
                  })
                  .map((note, index) => (
                  <tr key={note.id} style={{borderBottom: '1px solid rgba(0,0,0,0.05)'}}>
                    <td className="border-0 ps-4 py-4">
                      <div>
                        <h6 className="fw-bold mb-1 text-dark" style={{fontSize: '18px'}}>
                          {highlightText(note.title.toUpperCase(), externalSearchTerm || searchTerm)}
                        </h6>
                        {note.attachments && note.attachments.length > 0 && (
                          <div className="d-flex gap-2 mt-2">
                            {note.attachments.slice(0, 2).map((attachment, idx) => (
                              <span key={idx} className="text-muted small bg-light rounded-pill px-2 py-1 d-inline-flex align-items-center">
                                {getFileIcon(attachment.fileName, attachment.fileType)}
                                <span className="ms-1">{attachment.originalName}</span>
                              </span>
                            ))}
                            {note.attachments.length > 2 && (
                              <span className="text-muted small bg-light rounded-pill px-2 py-1">
                                +{note.attachments.length - 2} dosya
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border-0 py-4">
                      <div className="d-flex align-items-center">
                        <span className="me-2" style={{fontSize: '20px'}}>
                          {getCategoryInfo(note.category).icon}
                        </span>
                        <span className="fw-semibold text-dark">{getCategoryInfo(note.category).name}</span>
                      </div>
                    </td>
                    <td className="border-0 py-4" style={{maxWidth: '300px'}}>
                      <p className="mb-0 text-muted" style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '16px'
                      }}>
                        {highlightText(note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content, externalSearchTerm || searchTerm)}
                      </p>
                    </td>
                    <td className="border-0 py-4">
                      <div className="text-muted small">
                        <div>{formatDate(note.updatedAt).split(' ')[0]}</div>
                        <div style={{fontSize: '14px', opacity: 0.8}}>{formatDate(note.updatedAt).split(' ')[1]}</div>
                      </div>
                    </td>
                    <td className="border-0 py-4 pe-4">
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleViewNote(note)}
                          className="action-btn"
                          title="Notu Görüntüle"
                          style={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#1976d2';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#e3f2fd';
                            e.currentTarget.style.color = '#1976d2';
                          }}
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleEditNote(note)}
                          className="action-btn"
                          title="Notu Düzenle"
                          style={{
                            backgroundColor: '#fff3e0',
                            color: '#f57c00'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f57c00';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff3e0';
                            e.currentTarget.style.color = '#f57c00';
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="action-btn"
                          title="Notu Sil"
                          style={{
                            backgroundColor: '#ffebee',
                            color: '#d32f2f'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#d32f2f';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffebee';
                            e.currentTarget.style.color = '#d32f2f';
                          }}
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

      {/* Not Ekleme/Düzenleme Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'}}>
                <h5 className="modal-title fw-bold">
                  {editingNote ? '✏️ Not Düzenle' : '➕ Yeni Not Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleNoteSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold">📂 Birim</label>
                      <select
                        className="form-select"
                        value={noteForm.category}
                        onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                        required
                      >
                        <option value="">Birim Seçin</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label fw-bold">📝 Başlık</label>
                      <input
                        type="text"
                        className="form-control"
                        value={noteForm.title}
                        onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value.toUpperCase() })}
                        placeholder="Not başlığını girin..."
                        required
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label fw-bold">📄 İçerik</label>
                      <textarea
                        className="form-control"
                        rows={8}
                        value={noteForm.content}
                        onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                        placeholder="Notunuzu buraya yazın..."
                        required
                        style={{resize: 'vertical'}}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={resetForm}>
                    ❌ İptal
                  </button>
                  <button 
                    type="submit" 
                    className="btn text-white"
                    disabled={isUploading || isSubmitting}
                    style={{background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'}}
                  >
                    {isSubmitting 
                      ? '⏳ Kaydediliyor...' 
                      : isUploading 
                        ? '📤 Dosyalar yükleniyor...'
                        : editingNote 
                          ? '✏️ Güncelle' 
                          : '💾 Kaydet'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Not Detay Modal */}
      {showDetailModal && viewingNote && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'}}>
                <h5 className="modal-title fw-bold">
                  📖 {viewingNote.title}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeDetailModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="d-flex align-items-center">
                      <span className="me-2" style={{fontSize: '24px'}}>
                        {getCategoryInfo(viewingNote.category).icon}
                      </span>
                      <strong>{getCategoryInfo(viewingNote.category).name}</strong>
                    </div>
                    <small className="text-muted">
                      Son Güncelleme: {formatDate(viewingNote.updatedAt)}
                    </small>
                  </div>
                  
                  <div className="bg-light p-4 rounded">
                    <p className="mb-0" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
                      {viewingNote.content}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleEditFromDetail}
                >
                  ✏️ Düzenle
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDetailModal}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">🗑️ Not Silme Onayı</h5>
              </div>
              <div className="modal-body">
                <p>Bu notu silmek istediğinizden emin misiniz?</p>
                <p className="text-muted small">Bu işlem geri alınamaz.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteNote}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Notes;