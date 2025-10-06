'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Note, NoteCategory } from '@/types';

interface NotesProps {
  categories: NoteCategory[];
}

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: '',
    attachmentUrl: '',
    attachmentName: ''
  });

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
        // Güncelleme
        const response = await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNote.id,
            ...noteForm,
            updatedBy: user?.id || 1
          }),
        });

        if (response.ok) {
          fetchNotes();
          resetForm();
          alert('✅ Not başarıyla güncellendi!');
        } else {
          const errorData = await response.text();
          alert('❌ Not güncellenemedi: ' + errorData);
        }
      } else {
        // Yeni not
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...noteForm,
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
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '📄' };
  };

  const getNotesForCategory = (categoryId: string) => {
    return notes.filter(note => note.category === categoryId);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('tr-TR');
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary fw-bold">
              📝 Hastane Birim Notları
            </h2>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Yeni Not Ekle
            </button>
          </div>

          {/* Kategori Filtreleme */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSelectedCategory('')}
                    >
                      🏥 Tümü
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        className={`btn ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        {category.icon} {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Not Kartları */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
          ) : (
            <div className="row">
              {categories.map(category => {
                const categoryNotes = getNotesForCategory(category.id);
                if (selectedCategory && selectedCategory !== category.id) return null;
                
                return (
                  <div key={category.id} className="col-xl-4 col-lg-6 col-md-6 mb-4">
                    <div className="card h-100 shadow-sm border-0">
                      <div className="card-header bg-primary text-white">
                        <h5 className="card-title mb-0">
                          {category.icon} {category.name}
                          <span className="badge bg-light text-primary ms-2">
                            {categoryNotes.length}
                          </span>
                        </h5>
                      </div>
                      <div className="card-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {categoryNotes.length === 0 ? (
                          <div className="text-center py-4 text-muted">
                            <i className="bi bi-file-text fs-1 mb-3"></i>
                            <p>Bu birime ait not bulunmuyor</p>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => {
                                resetForm();
                                setNoteForm(prev => ({ ...prev, category: category.id }));
                                setShowModal(true);
                              }}
                            >
                              İlk Notu Ekle
                            </button>
                          </div>
                        ) : (
                          categoryNotes.map(note => (
                            <div key={note.id} className="border-bottom p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                                  {note.title}
                                </h6>
                                <div className="dropdown">
                                  <button
                                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                  >
                                    <i className="bi bi-three-dots"></i>
                                  </button>
                                  <ul className="dropdown-menu">
                                    <li>
                                      <button
                                        className="dropdown-item"
                                        onClick={() => handleEditNote(note)}
                                      >
                                        <i className="bi bi-pencil me-2"></i>Düzenle
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        className="dropdown-item text-danger"
                                        onClick={() => handleDeleteNote(note.id)}
                                      >
                                        <i className="bi bi-trash me-2"></i>Sil
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              <p className="text-muted small mb-2" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {note.content}
                              </p>
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                  {formatDate(note.updatedAt)}
                                </small>
                                {note.attachmentUrl && (
                                  <span className="badge bg-info">
                                    <i className="bi bi-paperclip me-1"></i>
                                    Ek dosya
                                  </span>
                                )}
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingNote ? 'Not Düzenle' : 'Yeni Not Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleNoteSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-select"
                      value={noteForm.category}
                      onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                      required
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Başlık</label>
                    <input
                      type="text"
                      className="form-control"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">İçerik</label>
                    <textarea
                      className="form-control"
                      rows={8}
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ek Dosya URL (İsteğe Bağlı)</label>
                    <input
                      type="url"
                      className="form-control"
                      value={noteForm.attachmentUrl}
                      onChange={(e) => setNoteForm({ ...noteForm, attachmentUrl: e.target.value })}
                      placeholder="https://example.com/dosya.pdf"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingNote ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;