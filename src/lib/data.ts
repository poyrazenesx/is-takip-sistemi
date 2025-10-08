import { User, Task } from '@/types';

// Önceden tanımlanmış kullanıcılar - Production için sadece admin
export const users: User[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'System Admin',
    role: 'admin'
  }
];

// Örnek görevler
export let tasks: Task[] = [
  {
    id: 1,
    title: 'Proje Planı Hazırla',
    description: 'Yeni proje için detaylı plan hazırlanması',
    status: 'in-progress',
    assignedTo: 1,
    createdBy: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    priority: 'high'
  },
  {
    id: 2,
    title: 'Müşteri Toplantısı',
    description: 'ABC Şirketi ile ürün tanıtım toplantısı',
    status: 'todo',
    assignedTo: 2,
    createdBy: 1,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Rapor Hazırla',
    description: 'Aylık satış raporu hazırlanması',
    status: 'completed',
    assignedTo: 3,
    createdBy: 2,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22'),
    priority: 'low'
  }
];

// Kullanıcı doğrulama - basit versiyon
export async function validateUser(username: string, password: string): Promise<User | null> {
  console.log('validateUser çağrıldı:', { username, password });
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    console.log('Giriş başarılı:', { id: user.id, username: user.username, name: user.name });
    return { ...user, password: '' }; // Şifreyi gizle
  }
  
  console.log('Giriş başarısız');
  return null;
}

// Görev CRUD işlemleri
export function getTasks(): Task[] {
  return tasks;
}

export function getTaskById(id: number): Task | undefined {
  return tasks.find(task => task.id === id);
}

export function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  const newTask: Task = {
    ...task,
    id: Math.max(...tasks.map(t => t.id), 0) + 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  tasks.push(newTask);
  return newTask;
}

export function updateTask(id: number, updates: Partial<Task>): Task | null {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) return null;
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date()
  };
  return tasks[taskIndex];
}

export function deleteTask(id: number): boolean {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) return false;
  
  tasks.splice(taskIndex, 1);
  return true;
}

export function getUserById(id: number): User | undefined {
  return users.find(user => user.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return users.find(user => user.username === username);
}
