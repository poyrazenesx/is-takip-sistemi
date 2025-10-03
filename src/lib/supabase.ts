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
}
