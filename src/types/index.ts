export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'member';
}



export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface Attachment {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: number;
  uploadedAt: Date;
  isImage: boolean;
  thumbnailPath?: string;
  description?: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  category: 'servis' | 'poliklinikler' | 'eczane' | 'genel-hasta-kayit' | 'kalite' | 'dilekceler' | 'idare';
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachments?: Attachment[];
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
  attachments?: Attachment[];
}

export interface NoteCategory {
  id: string;
  name: string;
  icon: string;
}

export interface NoteHistory {
  id: number;
  noteId: number;
  action: 'created' | 'updated' | 'deleted';
  oldContent?: string;
  newContent?: string;
  changedBy: number;
  changedAt: Date;
  changeDescription: string;
  userName?: string;
}
