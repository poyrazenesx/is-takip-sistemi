'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: number;
  title: string;
  content?: string;
  description?: string;
  category?: string;
  status?: string;
  priority?: string;
  type: 'note' | 'task';
  searchRelevance: number;
  createdAt: string;
  updatedAt: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'notes' | 'tasks'>('all');
  const [results, setResults] = useState<{
    notes: SearchResult[];
    tasks: SearchResult[];
    totalCount: number;
  }>({ notes: [], tasks: [], totalCount: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const performSearch = async () => {
    if (searchTerm.trim().length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${searchType}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      } else {
        console.error('Arama hatası');
      }
    } catch (error) {
      console.error('Arama sırasında hata:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const toggleItemSelection = (type: 'note' | 'task', id: number) => {
    const itemKey = `${type}-${id}`;
    const newSelected = new Set(selectedItems);
    
    if (newSelected.has(itemKey)) {
      newSelected.delete(itemKey);
    } else {
      newSelected.add(itemKey);
    }
    
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    const allItems = new Set<string>();
    results.notes.forEach(note => allItems.add(`note-${note.id}`));
    results.tasks.forEach(task => allItems.add(`task-${task.id}`));
    setSelectedItems(allItems);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    const selectedNotes = Array.from(selectedItems)
      .filter(item => item.startsWith('note-'))
      .map(item => parseInt(item.split('-')[1]));
    
    const selectedTasks = Array.from(selectedItems)
      .filter(item => item.startsWith('task-'))
      .map(item => parseInt(item.split('-')[1]));

    try {
      // Notları sil
      for (const noteId of selectedNotes) {
        await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
      }

      // Görevleri sil
      for (const taskId of selectedTasks) {
        await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      }

      // Arama sonuçlarını güncelle
      performSearch();
      setSelectedItems(new Set());
      setShowDeleteConfirm(false);
      
      alert(`✅ ${selectedNotes.length + selectedTasks.length} öğe başarıyla silindi!`);
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('❌ Silme işlemi sırasında hata oluştu');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'servis': '🏥',
      'poliklinikler': '👩‍⚕️',
      'eczane': '💊',
      'genel-hasta-kayit': '📋',
      'kalite': '⭐',
      'dilekceler': '📝',
      'idare': '🏛️'
    };
    return icons[category] || '📄';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      'todo': '⏳',
      'in-progress': '🔄',
      'completed': '✅'
    };
    return icons[status] || '📋';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'high': '#ff6b6b',
      'medium': '#feca57',
      'low': '#48cab2'
    };
    return colors[priority] || '#6c757d';
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ background: '#fff3cd', padding: '2px 4px', borderRadius: '3px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .search-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 50px 20px;
          overflow-y: auto;
        }
        
        .search-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .search-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px 30px;
          position: relative;
        }
        
        .search-input {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 25px;
          padding: 12px 20px;
          font-size: 16px;
          background: rgba(255, 255, 255, 0.95);
          transition: all 0.3s ease;
          width: 100%;
        }
        
        .search-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.8);
          background: white;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }
        
        .filter-tabs {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .filter-tab {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-tab.active {
          background: white;
          color: #667eea;
        }
        
        .search-results {
          padding: 0;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .result-item {
          padding: 20px 30px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: background-color 0.2s ease;
          position: relative;
        }
        
        .result-item:hover {
          background-color: #f8f9ff;
        }
        
        .result-item.selected {
          background-color: rgba(102, 126, 234, 0.1);
          border-left: 4px solid #667eea;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .result-type-badge {
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 10px;
        }
        
        .note-badge {
          background: linear-gradient(135deg, #48cab2 0%, #54a0ff 100%);
          color: white;
        }
        
        .task-badge {
          background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
          color: white;
        }
        
        .result-content {
          color: #666;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        
        .result-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 13px;
          color: #999;
        }
        
        .bulk-actions {
          background: #f8f9fa;
          padding: 20px 30px;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: between;
          align-items: center;
        }
        
        .close-btn {
          position: absolute;
          top: 20px;
          right: 25px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }
        
        .selection-checkbox {
          position: absolute;
          top: 20px;
          left: 10px;
          cursor: pointer;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 30px;
          color: #999;
        }
        
        .search-stats {
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 20px;
          margin-top: 15px;
          border-radius: 10px;
          font-size: 14px;
        }
      `}</style>

      <div className="search-modal" onClick={onClose}>
        <div className="search-content" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="search-header">
            <button className="close-btn" onClick={onClose}>✕</button>
            
            <h3 className="fw-bold mb-3">🔍 Evrensel Arama</h3>
            
            <form onSubmit={handleSearch}>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Notlarda ve görevlerde ara... (örn: &apos;has&apos; yazarak &apos;hastane&apos; kelimesini bulun)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </form>
            
            <div className="filter-tabs">
              <button
                className={`filter-tab ${searchType === 'all' ? 'active' : ''}`}
                onClick={() => setSearchType('all')}
              >
                🔍 Tümü
              </button>
              <button
                className={`filter-tab ${searchType === 'notes' ? 'active' : ''}`}
                onClick={() => setSearchType('notes')}
              >
                📝 Notlar
              </button>
              <button
                className={`filter-tab ${searchType === 'tasks' ? 'active' : ''}`}
                onClick={() => setSearchType('tasks')}
              >
                📋 Görevler
              </button>
            </div>
            
            {results.totalCount > 0 && (
              <div className="search-stats">
                📊 {results.totalCount} sonuç bulundu ({results.notes.length} not, {results.tasks.length} görev)
              </div>
            )}
          </div>

          {/* Results */}
          <div className="search-results">
            {isSearching ? (
              <div className="empty-state">
                <div className="spinner-border text-primary mb-3" />
                <p>Aranıyor...</p>
              </div>
            ) : results.totalCount === 0 && searchTerm ? (
              <div className="empty-state">
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
                <h5>Sonuç bulunamadı</h5>
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                <p>&quot;{searchTerm}&quot; için herhangi bir sonuç bulunamadı</p>
                <small className="text-muted">
                  • En az 2 karakter girin<br />
                  • Farklı kelimeler deneyin<br />
                  • Türkçe karakter kullanın
                </small>
              </div>
            ) : (
              <>
                {/* Notlar */}
                {results.notes.map((note) => (
                  <div
                    key={`note-${note.id}`}
                    className={`result-item ${selectedItems.has(`note-${note.id}`) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="selection-checkbox"
                      checked={selectedItems.has(`note-${note.id}`)}
                      onChange={() => toggleItemSelection('note', note.id)}
                    />
                    
                    <div className="result-header">
                      <h6 className="fw-bold text-dark mb-0">
                        {getCategoryIcon(note.category || '')} {highlightText(note.title, searchTerm)}
                      </h6>
                      <span className="result-type-badge note-badge">📝 Not</span>
                    </div>
                    
                    <div className="result-content">
                      {highlightText((note.content || '').slice(0, 200), searchTerm)}
                      {(note.content || '').length > 200 && '...'}
                    </div>
                    
                    <div className="result-meta">
                      <span>📂 {note.category}</span>
                      <span>📅 {new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
                      <span>📊 Skor: {note.searchRelevance}</span>
                    </div>
                  </div>
                ))}

                {/* Görevler */}
                {results.tasks.map((task) => (
                  <div
                    key={`task-${task.id}`}
                    className={`result-item ${selectedItems.has(`task-${task.id}`) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="selection-checkbox"
                      checked={selectedItems.has(`task-${task.id}`)}
                      onChange={() => toggleItemSelection('task', task.id)}
                    />
                    
                    <div className="result-header">
                      <h6 className="fw-bold text-dark mb-0">
                        {getStatusIcon(task.status || '')} {highlightText(task.title, searchTerm)}
                      </h6>
                      <span className="result-type-badge task-badge">📋 Görev</span>
                    </div>
                    
                    <div className="result-content">
                      {highlightText((task.description || '').slice(0, 200), searchTerm)}
                      {(task.description || '').length > 200 && '...'}
                    </div>
                    
                    <div className="result-meta">
                      <span>📊 {task.status}</span>
                      <span style={{ color: getPriorityColor(task.priority || '') }}>
                        ⚡ {task.priority}
                      </span>
                      <span>📅 {new Date(task.updatedAt).toLocaleDateString('tr-TR')}</span>
                      <span>🎯 Skor: {task.searchRelevance}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Bulk Actions */}
          {results.totalCount > 0 && (
            <div className="bulk-actions">
              <div>
                <span className="me-3 text-muted">
                  {selectedItems.size} öğe seçili
                </span>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={selectAll}
                >
                  Tümünü Seç
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={clearSelection}
                >
                  Seçimi Temizle
                </button>
              </div>
              
              {selectedItems.size > 0 && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  🗑️ Seçilenleri Sil ({selectedItems.size})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">⚠️ Silme Onayı</h5>
              </div>
              <div className="modal-body">
                <p>
                  <strong>{selectedItems.size} öğeyi</strong> kalıcı olarak silmek istediğinizden emin misiniz?
                </p>
                <p className="text-muted small mb-0">
                  Bu işlem geri alınamaz!
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ❌ İptal
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleBulkDelete}
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchModal;