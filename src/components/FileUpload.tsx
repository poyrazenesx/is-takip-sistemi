'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Attachment } from '@/types';

interface FileUploadProps {
  onUploadComplete?: (attachments: Attachment[]) => void;
  onUploadStart?: () => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  showPreview?: boolean;
}

const FileUpload = ({ 
  onUploadComplete, 
  onUploadStart,
  maxFiles = 5,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  showPreview = true 
}: FileUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([]);
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!files.length) return;

    setError('');
    setUploading(true);
    onUploadStart?.();

    const fileArray = Array.from(files).slice(0, maxFiles);
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const progressKey = file.name + Date.now();

      try {
        // Dosya boyut kontrolü
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name}: Dosya boyutu 10MB'dan büyük olamaz`);
          continue;
        }

        setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadedBy', user?.id?.toString() || '1');
        formData.append('description', '');

        // Simulated progress (gerçek progress için daha karmaşık implementasyon gerekir)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: Math.min((prev[progressKey] || 0) + 10, 90)
          }));
        }, 100);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          const result = await response.json();
          setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
          newAttachments.push(result.attachment);
          
          // Progress'i temizle
          setTimeout(() => {
            setUploadProgress(prev => {
              const updated = { ...prev };
              delete updated[progressKey];
              return updated;
            });
          }, 1000);
        } else {
          const errorData = await response.json();
          setError(`${file.name}: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setError(`${file.name}: Yükleme hatası`);
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[progressKey];
          return updated;
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...newAttachments]);
    setUploading(false);
    
    if (newAttachments.length > 0) {
      onUploadComplete?.(newAttachments);
    }
  }, [maxFiles, user?.id, onUploadComplete, onUploadStart]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <style jsx>{`
        .upload-container {
          border: 2px dashed #e0e6ed;
          border-radius: 15px;
          background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .upload-container.drag-active {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%);
          transform: scale(1.02);
        }
        
        .upload-container:hover {
          border-color: #667eea;
          background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
        }
        
        .upload-icon {
          width: 60px;
          height: 60px;
          border-radius: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .upload-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 25px;
          padding: 12px 30px;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .upload-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        
        .upload-btn:hover::before {
          left: 100%;
        }
        
        .file-preview {
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.1);
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .file-preview:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .progress-bar {
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        
        .file-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        }
        
        .remove-btn {
          background: rgba(255, 107, 107, 0.1);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff6b6b;
          transition: all 0.2s ease;
        }
        
        .remove-btn:hover {
          background: rgba(255, 107, 107, 0.2);
          transform: scale(1.1);
        }
        
        .image-preview {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #f8f9fa;
        }
        
        .error-message {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 20px;
          margin-top: 15px;
        }
      `}</style>

      <div className="mb-4">
        <div
          className={`upload-container p-4 text-center ${dragActive ? 'drag-active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
          style={{ cursor: 'pointer' }}
        >
          <div className="upload-icon">
            <svg width="30" height="30" fill="currentColor" className="text-white" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
          </div>
          
          <h5 className="fw-bold text-dark mb-2">
            📤 Dosya Yükle
          </h5>
          
          <p className="text-muted mb-3">
            Dosyalarınızı buraya sürükleyip bırakın veya
          </p>
          
          <button 
            className="upload-btn"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Yükleniyor...
              </>
            ) : (
              '🔍 Dosya Seç'
            )}
          </button>
          
          <div className="mt-3">
            <small className="text-muted">
              <strong>Desteklenen formatlar:</strong> JPG, PNG, GIF, PDF, DOC, TXT<br />
              <strong>Maksimum boyut:</strong> 10MB | <strong>Maksimum dosya:</strong> {maxFiles} adet
            </small>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Progress Indicators */}
        {Object.entries(uploadProgress).map(([key, progress]) => (
          <div key={key} className="mt-3 p-3 bg-light rounded-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="fw-semibold">Yükleniyor...</small>
              <small className="text-muted">{progress}%</small>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ))}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <div className="d-flex align-items-center">
              <span className="me-2">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* File Previews */}
        {showPreview && uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h6 className="fw-bold text-dark mb-3">📁 Yüklenen Dosyalar ({uploadedFiles.length})</h6>
            <div className="row g-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="col-12">
                  <div className="file-preview p-3">
                    <div className="d-flex align-items-center">
                      {file.isImage ? (
                        <img 
                          src={file.filePath} 
                          alt={file.originalName}
                          className="image-preview me-3"
                        />
                      ) : (
                        <div className="file-icon me-3">
                          {file.fileType.split('/')[1]?.toUpperCase().slice(0, 3) || 'FILE'}
                        </div>
                      )}
                      
                      <div className="flex-grow-1">
                        <h6 className="fw-semibold text-dark mb-1">{file.originalName}</h6>
                        <div className="d-flex align-items-center gap-3">
                          <small className="text-muted">
                            📊 {formatFileSize(file.fileSize)}
                          </small>
                          <small className="text-muted">
                            📅 {new Date(file.uploadedAt).toLocaleString('tr-TR')}
                          </small>
                        </div>
                      </div>
                      
                      <button
                        className="remove-btn ms-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        title="Dosyayı kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FileUpload;