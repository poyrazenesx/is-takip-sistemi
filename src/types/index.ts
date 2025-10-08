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
  title?: string;
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
  dueDate?: string; // ISO date string for calendar view
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

export interface Hardware {
  id: number;
  device_type: string;
  make_model: string;
  serial_number: string;
  asset_tag: string;
  location: string;
  department: string;
  assigned_to: string;
  status: string;
  purchase_date: string;
  warranty_expiry: string;
  processor: string;
  memory_gb: number;
  storage_gb: number;
  operating_system: string;
  ip_address: string;
  mac_address: string;
  notes: string;
  created_at?: Date;
  updated_at?: Date;
}
