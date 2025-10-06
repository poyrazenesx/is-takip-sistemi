import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Anon client (frontend için)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client (backend işlemler için - RLS bypass)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback olarak anon client kullan

// Kullanıcı tablosu için tip tanımları
export interface DbUser {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'member';
  created_at?: string;
}

// Görev tablosu için tip tanımları
export interface DbTask {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  assigned_to: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  priority: 'low' | 'medium' | 'high';
}

// Not tablosu için tip tanımları
export interface DbNote {
  id: number;
  title: string;
  content: string;
  category: 'servis' | 'poliklinikler' | 'eczane' | 'genel-hasta-kayit' | 'kalite' | 'dilekceler' | 'idare';
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

// Not geçmiş tablosu için tip tanımları
export interface DbNoteHistory {
  id: number;
  note_id: number;
  action: 'created' | 'updated' | 'deleted';
  old_content?: string;
  new_content?: string;
  changed_by: number;
  changed_at: string;
  change_description: string;
}

// Veritabanı işlemleri
export class DatabaseService {
  
  // Kullanıcı işlemleri
  static async getUsers(): Promise<DbUser[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  static async getUserById(id: number): Promise<DbUser | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  static async getUserByUsername(username: string): Promise<DbUser | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return null;
    return data;
  }

  // Görev işlemleri
  static async getTasks(): Promise<DbTask[]> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createTask(task: Omit<DbTask, 'id' | 'created_at' | 'updated_at'>): Promise<DbTask> {
    console.log('🔍 Supabase createTask çağrıldı:', task);
    console.log('🔑 Using admin client:', !!supabaseServiceKey);
    
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([task])
      .select()
      .single();
    
    console.log('📊 Supabase response:', { data, error });
    
    if (error) {
      console.error('❌ Supabase createTask error:', {
        message: error?.message || String(error),
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      throw error;
    }
    return data;
  }

  static async updateTask(id: number, updates: Partial<DbTask>): Promise<DbTask> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteTask(id: number): Promise<boolean> {
    console.log('🔍 Supabase deleteTask çağrıldı:', id);
    
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);
    
    console.log('📊 Supabase delete response:', { error });
    
    if (error) {
      console.error('❌ Supabase deleteTask error:', {
        message: error?.message || String(error),
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
    }
    
    return !error;
  }

  // Veritabanı initialization
  static async initializeDatabase(): Promise<void> {
    try {
      // Kullanıcıları ekle (eğer yoksa)
      const existingUsers = await this.getUsers();
      if (existingUsers.length === 0) {
        const initialUsers = [
          { username: 'epoyraz', password: 'epoyraz43', name: 'Enes Poyraz', role: 'admin' as const },
          { username: 'ismail', password: '123', name: 'İsmail Arslan', role: 'member' as const },
          { username: 'köroğlu', password: '123', name: 'Ali Köroğlu', role: 'member' as const },
          { username: 'serkan', password: '123', name: 'Serkan Özil', role: 'member' as const }
        ];

        const { error } = await supabase
          .from('users')
          .insert(initialUsers);

        if (error) {
          console.error('Kullanıcılar eklenirken hata:', error);
        } else {
          console.log('İlk kullanıcılar başarıyla eklendi');
        }
      }

      // Örnek görevleri ekle (eğer yoksa)
      const existingTasks = await this.getTasks();
      if (existingTasks.length === 0) {
        const initialTasks = [
          {
            title: 'Sistem Kurulumu',
            description: 'Yeni iş takip sisteminin kurulumu ve test edilmesi',
            status: 'in-progress' as const,
            assigned_to: 1,
            created_by: 1,
            priority: 'high' as const
          },
          {
            title: 'Kullanıcı Eğitimi',
            description: 'Ekip üyelerine sistemin nasıl kullanılacağı konusunda eğitim verilmesi',
            status: 'todo' as const,
            assigned_to: 2,
            created_by: 1,
            priority: 'medium' as const
          }
        ];

        const { error } = await supabase
          .from('tasks')
          .insert(initialTasks);

        if (error) {
          console.error('Görevler eklenirken hata:', error);
        } else {
          console.log('İlk görevler başarıyla eklendi');
        }
      }
    } catch (error) {
      console.error('Veritabanı initialization hatası:', error);
    }
  }

  // ================================
  // NOT İŞLEMLERİ
  // ================================
  
  // Notları getir
  static async getNotes(category?: string | null): Promise<DbNote[]> {
    console.log('🔍 Supabase getNotes çağrıldı:', { category });
    
    let query = supabaseAdmin
      .from('notes')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Supabase getNotes error:', error);
      throw error;
    }
    
    console.log('✅ Supabase notes found:', data?.length || 0);
    return data || [];
  }

  // Not oluştur
  static async createNote(noteData: Partial<DbNote> & {
    title: string;
    content: string;
    category: string;
    created_by: number;
    updated_by: number;
  }): Promise<DbNote> {
    console.log('🔍 Supabase createNote çağrıldı:', noteData);

    // Default değerleri ekle
    const noteWithDefaults = {
      is_active: true,
      ...noteData
    };
    
    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert([noteWithDefaults])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase createNote error:', error);
      throw error;
    }
    
    console.log('✅ Supabase note created:', data);
    return data;
  }

  // Not güncelle
  static async updateNote(id: number, updateData: Partial<DbNote>): Promise<DbNote> {
    console.log('🔍 Supabase updateNote çağrıldı:', { id, updateData, idType: typeof id });
    
    // ID validasyonu
    if (!id || isNaN(id) || id <= 0) {
      console.error('❌ Geçersiz ID:', id);
      throw new Error(`Geçersiz not ID'si: ${id}`);
    }
    
    // Önce notun var olup olmadığını kontrol et
    const { data: existingNote, error: fetchError } = await supabaseAdmin
      .from('notes')
      .select('id, title, content, category, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (fetchError) {
      console.error('❌ Not arama hatası:', { id, fetchError });
      throw new Error(`Not arama hatası: ${fetchError.message}`);
    }
    
    if (!existingNote) {
      console.error('❌ Not bulunamadı:', { id, searchResult: existingNote });
      throw new Error(`ID ${id} ile not bulunamadı`);
    }
    
    console.log('✅ Mevcut not bulundu:', existingNote);
    
    const { data, error } = await supabaseAdmin
      .from('notes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase updateNote error:', error);
      throw new Error(`Güncelleme hatası: ${error.message}`);
    }
    
    if (!data) {
      console.error('❌ Güncelleme sonrası veri dönmedi');
      throw new Error('Güncelleme başarısız');
    }
    
    console.log('✅ Supabase note updated:', data);
    return data;
  }

  // Not sil (soft delete)
  static async deleteNote(id: number): Promise<boolean> {
    console.log('🔍 Supabase deleteNote çağrıldı:', id);
    
    const { error } = await supabaseAdmin
      .from('notes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('❌ Supabase deleteNote error:', error);
      throw error;
    }
    
    console.log('✅ Supabase note deleted (soft)');
    return true;
  }

  // Not geçmişini getir
  static async getNoteHistory(noteId: number): Promise<DbNoteHistory[]> {
    console.log('🔍 Supabase getNoteHistory çağrıldı:', noteId);
    
    const { data, error } = await supabaseAdmin
      .from('note_history')
      .select(`
        *,
        users!changed_by (name)
      `)
      .eq('note_id', noteId)
      .order('changed_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase getNoteHistory error:', error);
      throw error;
    }
    
    console.log('✅ Supabase note history found:', data?.length || 0);
    return data || [];
  }

  // ================================
  // DOSYA STORAGE İŞLEMLERİ
  // ================================
  
  // Dosya yükle
  static async uploadFile(filePath: string, fileBuffer: Buffer, contentType: string) {
    console.log('📤 Supabase Storage upload:', { filePath, contentType, size: fileBuffer.length });
    
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('attachments')
        .upload(filePath, fileBuffer, {
          contentType: contentType,
          duplex: 'half'
        });
      
      if (error) {
        console.error('❌ Storage upload error:', error);
        return { data: null, error };
      }
      
      console.log('✅ File uploaded to storage:', data);
      return { data, error: null };
    } catch (err) {
      console.error('💥 Storage upload exception:', err);
      return { data: null, error: err };
    }
  }
  
  // Public URL al
  static getPublicUrl(filePath: string): string {
    const { data } = supabaseAdmin.storage
      .from('attachments')
      .getPublicUrl(filePath);
    
    console.log('🔗 Public URL generated:', data.publicUrl);
    return data.publicUrl;
  }
  
  // Dosya sil
  static async deleteFile(filePath: string) {
    console.log('🗑️ Deleting file from storage:', filePath);
    
    const { data, error } = await supabaseAdmin.storage
      .from('attachments')
      .remove([filePath]);
    
    if (error) {
      console.error('❌ Storage delete error:', error);
      return { data: null, error };
    }
    
    console.log('✅ File deleted from storage');
    return { data, error: null };
  }

  // ================================
  // ATTACHMENT İŞLEMLERİ
  // ================================
  
  // Attachment kaydet
  static async createAttachment(attachmentData: {
    note_id: number;
    file_name: string;
    original_name: string;
    file_type: string;
    file_size: number;
    file_path: string;
    is_image: boolean;
    title?: string;
    description?: string;
    uploaded_by: number;
  }) {
    console.log('📎 Supabase createAttachment:', attachmentData);
    
    const { data, error } = await supabaseAdmin
      .from('attachments')
      .insert([attachmentData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Attachment create error:', error);
      throw error;
    }
    
    console.log('✅ Attachment created:', data);
    return data;
  }
  
  // Note'a ait attachments'ları getir
  static async getAttachmentsByNoteId(noteId: number) {
    console.log('📎 Getting attachments for note:', noteId);
    
    const { data, error } = await supabaseAdmin
      .from('attachments')
      .select('*')
      .eq('note_id', noteId)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      console.error('❌ Get attachments error:', error);
      throw error;
    }
    
    console.log('✅ Attachments found:', data?.length || 0);
    return data || [];
  }
  
  // Attachment sil
  static async deleteAttachment(id: number) {
    console.log('🗑️ Deleting attachment:', id);
    
    const { error } = await supabaseAdmin
      .from('attachments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Delete attachment error:', error);
      throw error;
    }
    
    console.log('✅ Attachment deleted');
    return true;
  }
}


// Vercel Dashboard → is-takip-sistemi → Settings → Advanced → Delete Project
