export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'member';
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  assignedTo: number; // User ID
  createdBy: number; // User ID
  createdAt: Date;
  updatedAt: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}
