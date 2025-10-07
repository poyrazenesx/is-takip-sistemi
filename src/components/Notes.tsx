'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Note, NoteCategory, Attachment } from '@/types';
import FileUpload from './FileUpload';

interface NotesProps {
  searchTerm?: string;
}

const Notes = ({ searchTerm = '' }: NotesProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

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

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNote) {
        // Güncelleme - attachments ile birlikte
        console.log('Güncelleme yapılıyor:', editingNote.id, noteForm, 'Attachments:', noteAttachments);
        
        // Attachment bilgilerini güncelle
        const attachmentUrl = noteAttachments.length > 0 ? noteAttachments[0].filePath : noteForm.attachmentUrl;
        const attachmentName = noteAttachments.length > 0 ? noteAttachments[0].fileName : noteForm.attachmentName;
        
        const response = await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNote.id,
            ...noteForm,
            attachmentUrl,
            attachmentName,
            updatedBy: user?.id || 1
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Güncelleme başarılı:', result);
          fetchNotes();
          resetForm();
          alert('✅ Not başarıyla güncellendi!');
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: await response.text() };
          }
          console.error('❌ Güncelleme hatası:', errorData);
          alert('❌ Not güncellenemedi: ' + (errorData.error || 'Bilinmeyen hata'));
        }
      } else {
        // Yeni not - attachments ile birlikte
        console.log('Yeni not oluşturuluyor:', noteForm, 'Attachments:', noteAttachments);
        
        // Attachment bilgilerini noteForm'a ekle
        const attachmentUrl = noteAttachments.length > 0 ? noteAttachments[0].filePath : noteForm.attachmentUrl;
        const attachmentName = noteAttachments.length > 0 ? noteAttachments[0].fileName : noteForm.attachmentName;
        
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...noteForm,
            attachmentUrl,
            attachmentName,
            createdBy: user?.id || 1
          }),
        });

        if (response.ok) {
          fetchNotes();
          resetForm();
          alert('✅ Not başarıyla oluşturuldu!');
        } else {
          const errorData = await response.text();
          alert('❌ Not oluşturulamadı: ' + errorData);
        }
      }
    } catch (error) {
      console.error('Note submit hatası:', error);
      alert('❌ İşlem sırasında hata oluştu');
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
    if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/notes?id=${noteId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchNotes();
          alert('✅ Not başarıyla silindi!');
        } else {
          alert('❌ Not silinirken hata oluştu');
        }
      } catch (error) {
        console.error('Note delete hatası:', error);
        alert('❌ Silme işlemi sırasında hata oluştu');
      }
    }
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
  };

  const handleFileUploadComplete = (attachments: Attachment[]) => {
    setNoteAttachments(prev => [...prev, ...attachments]);
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

  const getNotesForCategory = (categoryId: string) => {
    return notes.filter(note => {
      const categoryMatch = note.category === categoryId;
      if (!searchTerm) return categoryMatch;
      
      const titleMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
      const contentMatch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryMatch && (titleMatch || contentMatch);
    });
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

  return (
    <div className="container-fluid py-4">
      <style jsx>{`
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .category-btn {
          transition: all 0.3s ease;
          border-radius: 25px;
          font-weight: 600;
          padding: 12px 24px;
          border: 2px solid transparent;
        }
        .category-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .category-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
        }
        .note-card {
          transition: all 0.3s ease;
          border-radius: 15px;
          border: none;
          overflow: hidden;
        }
        .note-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        .note-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 15px 15px 0 0;
        }
        .note-content {
          padding: 0;
          max-height: 400px;
          overflow-y: auto;
        }
        .note-item {
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .note-item:hover {
          background-color: #f8f9ff;
        }
        .note-item:last-child {
          border-bottom: none;
        }
        .note-title {
          color: #667eea;
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .note-title:hover {
          color: #764ba2;
        }
        .note-text {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          opacity: 0.3;
        }
        .action-btn {
          border: none;
          background: none;
          color: #666;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        .action-btn:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 25px;
          padding: 12px 30px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .modal-content {
          border: none;
          border-radius: 20px;
          overflow: hidden;
        }
        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 25px 30px;
        }
        .modal-body {
          padding: 30px;
        }
        .form-label {
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-control, .form-select {
          border-radius: 12px;
          border: 2px solid #e9ecef;
          padding: 12px 16px;
          transition: all 0.2s ease;
        }
        .form-control:focus, .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .detail-content {
          background: #f8f9ff;
          border-radius: 12px;
          padding: 25px;
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          white-space: pre-wrap;
          line-height: 1.8;
          font-size: 15px;
        }
      `}</style>

      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="glass-card rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="fw-bold text-dark mb-2" style={{fontSize: '2.5rem'}}>
                  📝 Hastane Birim Notları
                </h1>
                <p className="text-muted mb-0" style={{fontSize: '1.1rem'}}>
                  Birimler arası iletişim ve bilgi paylaşımı merkezi
                </p>
              </div>
              <button
                className="btn btn-primary btn-lg shadow-sm"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Not Ekle
              </button>
            </div>
          </div>

          {/* Kategori Filtreleme */}
          <div className="glass-card rounded-4 p-4 mb-4">
            <h5 className="fw-bold text-dark mb-3">🏥 Birim Seçimi</h5>
            <div className="d-flex flex-wrap gap-3">
              <button
                className={`category-btn ${!selectedCategory ? 'active' : 'btn-outline-primary'}`}
                onClick={() => setSelectedCategory('')}
              >
                🏥 Tüm Birimler
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${selectedCategory === category.id ? 'active' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Not Kartları */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3 text-muted">Notlar yükleniyor...</p>
            </div>
          ) : (
            <div className="row g-4">
              {categories.map(category => {
                const categoryNotes = getNotesForCategory(category.id);
                if (selectedCategory && selectedCategory !== category.id) return null;
                
                return (
                  <div key={category.id} className="col-xl-4 col-lg-6 col-md-6">
                    <div className="note-card glass-card h-100">
                      <div className="note-header">
                        <h4 className="fw-bold mb-1">
                          {category.icon} {category.name}
                        </h4>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-light text-primary">
                            {categoryNotes.length} not
                          </span>
                          <button
                            className="btn btn-light btn-sm"
                            onClick={() => {
                              resetForm();
                              setNoteForm(prev => ({ ...prev, category: category.id }));
                              setShowModal(true);
                            }}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="note-content">
                        {categoryNotes.length === 0 ? (
                          <div className="empty-state">
                            <div className="empty-icon">📄</div>
                            <h6 className="fw-bold">Henüz not bulunmuyor</h6>
                            <p className="small">Bu birime ait ilk notu oluşturun</p>
                          </div>
                        ) : (
                          categoryNotes.map(note => (
                            <div 
                              key={note.id} 
                              className="note-item"
                              onClick={() => handleViewNote(note)}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="note-title">{highlightText(note.title, searchTerm)}</h6>
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    title="Düzenle"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditNote(note);
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    title="Sil"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
                                        handleDeleteNote(note.id);
                                      }
                                    }}
                                  >
                                    🗑️
                                  </button>
                                  <div className="dropdown">
                                    <button
                                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                      type="button"
                                      data-bs-toggle="dropdown"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Daha fazla seçenek"
                                    >
                                      ⋮
                                    </button>
                                    <ul className="dropdown-menu shadow-sm">
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditNote(note);
                                          }}
                                        >
                                          <i className="bi bi-pencil me-2"></i>Düzenle
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item text-danger"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteNote(note.id);
                                          }}
                                        >
                                          <i className="bi bi-trash me-2"></i>Sil
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="note-text">{highlightText(note.content, searchTerm)}</p>
                              
                              <div className="d-flex justify-content-between align-items-center mt-3">
                                <small className="text-muted">
                                  <i className="bi bi-clock me-1"></i>
                                  {formatDate(note.updatedAt)}
                                </small>
                                <div className="d-flex gap-2">
                                  {note.attachments && note.attachments.length > 0 && (
                                    <span className="badge bg-success">
                                      <i className="bi bi-paperclip me-1"></i>
                                      {note.attachments.length} dosya
                                    </span>
                                  )}
                                  {note.attachmentUrl && (
                                    <span className="badge bg-info">
                                      <i className="bi bi-link me-1"></i>
                                      Bağlantı
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Not Ekleme/Düzenleme Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white">
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
                      <label className="form-label">📂 Birim</label>
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
                      <label className="form-label">📝 Başlık</label>
                      <input
                        type="text"
                        className="form-control"
                        value={noteForm.title}
                        onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                        placeholder="Not başlığını girin..."
                        required
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label">📄 İçerik</label>
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
                    
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <label className="form-label mb-0">📎 Dosya Eklentileri</label>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowFileUpload(!showFileUpload)}
                        >
                          {showFileUpload ? '📁 Gizle' : '📤 Dosya Ekle'}
                        </button>
                      </div>
                      
                      {showFileUpload && (
                        <FileUpload
                          onUploadComplete={handleFileUploadComplete}
                          maxFiles={3}
                          showPreview={true}
                        />
                      )}
                      
                      {noteAttachments.length > 0 && (
                        <div className="mt-3 p-3 bg-light rounded-3">
                          <small className="fw-bold text-muted">Eklenecek Dosyalar:</small>
                          <div className="mt-2">
                            {noteAttachments.map((attachment, index) => (
                              <div key={index} className="d-flex align-items-center justify-content-between p-2 bg-white rounded mb-2">
                                <div className="d-flex align-items-center">
                                  <span className="me-2">
                                    {attachment.isImage ? '🖼️' : '📄'}
                                  </span>
                                  <small className="fw-semibold">{attachment.originalName}</small>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setNoteAttachments(prev => prev.filter((_, i) => i !== index))}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label">🔗 Ek Dosya URL (İsteğe Bağlı)</label>
                      <input
                        type="url"
                        className="form-control"
                        value={noteForm.attachmentUrl}
                        onChange={(e) => setNoteForm({ ...noteForm, attachmentUrl: e.target.value })}
                        placeholder="https://example.com/dosya.pdf"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={resetForm}>
                    ❌ İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingNote ? '✅ Güncelle' : '💾 Kaydet'}
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
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center">
                  {getCategoryInfo(viewingNote.category).icon} 
                  <span className="ms-2">{viewingNote.title}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeDetailModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-primary text-white fs-6 px-3 py-2">
                        {getCategoryInfo(viewingNote.category).icon} {getCategoryInfo(viewingNote.category).name}
                      </span>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        Son Güncelleme: {formatDate(viewingNote.updatedAt)}
                      </small>
                    </div>
                  </div>
                  
                  <div className="col-12">
                    <h6 className="form-label">📄 İçerik</h6>
                    <div className="detail-content">
                      {viewingNote.content}
                    </div>
                  </div>

                  {/* Yüklenen Dosyalar */}
                  {viewingNote.attachments && viewingNote.attachments.length > 0 && (
                    <div className="col-12">
                      <h6 className="form-label">📎 Yüklenen Dosyalar ({viewingNote.attachments.length})</h6>
                      <div className="row g-3">
                        {viewingNote.attachments.map((attachment, index) => (
                          <div key={index} className="col-lg-6">
                            <div className="p-3 bg-light rounded-3 h-100">
                              {attachment.isImage ? (
                                <div className="text-center mb-3">
                                  <img 
                                    src={attachment.filePath}
                                    alt={attachment.originalName}
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => window.open(attachment.filePath, '_blank')}
                                  />
                                </div>
                              ) : (
                                <div className="text-center mb-3">
                                  <div 
                                    className="d-inline-flex align-items-center justify-content-center rounded-3 p-4"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      width: '80px',
                                      height: '80px'
                                    }}
                                  >
                                    <span className="text-white fw-bold fs-5">
                                      {attachment.fileType.split('/')[1]?.toUpperCase().slice(0, 3) || 'DOC'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              <h6 className="fw-semibold text-dark mb-2">{attachment.originalName}</h6>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">
                                  📊 {Math.round(attachment.fileSize / 1024)} KB
                                </small>
                                <small className="text-muted">
                                  📅 {new Date(attachment.uploadedAt).toLocaleDateString('tr-TR')}
                                </small>
                              </div>
                              
                              <a 
                                href={attachment.filePath} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary btn-sm w-100"
                              >
                                <i className="bi bi-download me-2"></i>
                                {attachment.isImage ? 'Büyük Göster' : 'İndir'}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eski URL Eklentisi */}
                  {viewingNote.attachmentUrl && (
                    <div className="col-12">
                      <h6 className="form-label">🔗 Ek Bağlantı</h6>
                      <div className="p-3 bg-light rounded-3">
                        <a 
                          href={viewingNote.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none d-flex align-items-center text-primary fw-semibold"
                        >
                          <i className="bi bi-paperclip me-2"></i>
                          {viewingNote.attachmentName || 'Ek Dosya'}
                          <i className="bi bi-box-arrow-up-right ms-2"></i>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="col-md-6">
                    <small className="text-muted">
                      <strong>📅 Oluşturulma:</strong><br />
                      {formatDate(viewingNote.createdAt)}
                    </small>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">
                      <strong>🔄 Son Güncelleme:</strong><br />
                      {formatDate(viewingNote.updatedAt)}
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-light" 
                  onClick={closeDetailModal}
                >
                  👁️ Kapat
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleEditFromDetail}
                >
                  <i className="bi bi-pencil me-2"></i>Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;