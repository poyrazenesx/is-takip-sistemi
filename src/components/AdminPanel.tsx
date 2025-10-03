'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService, type DbUser } from '@/lib/supabase';
import { Users, Settings, Database, UserPlus, Trash2, Edit3 } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'member' as 'admin' | 'member'
  });

  const fetchUsers = async () => {
    try {
      const usersData = await DatabaseService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Kullanıcılar alınamadı:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Yeni kullanıcı ekleme API'si çağrılacak
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        fetchUsers();
        setNewUser({ username: '', password: '', name: '', role: 'member' });
        setShowAddUser(false);
      }
    } catch (error) {
      console.error('Kullanıcı eklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Admin kontrolü
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🚫 Erişim Engellendi</h1>
          <p className="text-xl">Bu sayfaya sadece Admin kullanıcıları erişebilir.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
        rel="stylesheet"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800">
        {/* Header */}
        <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="text-white" size={32} />
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              </div>
              <div className="text-white">
                <span className="bg-yellow-500 px-3 py-1 rounded-full text-black font-bold text-sm">
                  👑 {user?.name}
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <Users className="text-blue-400" size={48} />
                <div>
                  <h3 className="text-2xl font-bold text-white">{users.length}</h3>
                  <p className="text-blue-200">Toplam Kullanıcı</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <Database className="text-green-400" size={48} />
                <div>
                  <h3 className="text-2xl font-bold text-white">Aktif</h3>
                  <p className="text-green-200">Veritabanı Durumu</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <Settings className="text-purple-400" size={48} />
                <div>
                  <h3 className="text-2xl font-bold text-white">Yönetici</h3>
                  <p className="text-purple-200">Panel Erişimi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kullanıcı Yönetimi */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <div className="bg-white/5 px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users size={24} />
                  Kullanıcı Yönetimi
                </h2>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <UserPlus size={18} />
                  Yeni Kullanıcı
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-white/70 border-b border-white/10">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Kullanıcı Adı</th>
                      <th className="pb-3">Ad Soyad</th>
                      <th className="pb-3">Rol</th>
                      <th className="pb-3">Oluşturulma</th>
                      <th className="pb-3">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((dbUser) => (
                      <tr key={dbUser.id} className="text-white border-b border-white/5">
                        <td className="py-3">{dbUser.id}</td>
                        <td className="py-3 font-mono">{dbUser.username}</td>
                        <td className="py-3">{dbUser.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            dbUser.role === 'admin' 
                              ? 'bg-yellow-600 text-yellow-100' 
                              : 'bg-blue-600 text-blue-100'
                          }`}>
                            {dbUser.role === 'admin' ? '👑 Admin' : '👤 Member'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-white/70">
                          {dbUser.created_at && new Date(dbUser.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button className="text-blue-400 hover:text-blue-300 p-1">
                              <Edit3 size={16} />
                            </button>
                            {dbUser.role !== 'admin' && (
                              <button className="text-red-400 hover:text-red-300 p-1">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Yeni Kullanıcı Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Yeni Kullanıcı Ekle</h3>
              <form onSubmit={handleAddUser}>
                <div className="mb-4">
                  <label className="block text-white/70 text-sm font-bold mb-2">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white/70 text-sm font-bold mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white/70 text-sm font-bold mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-white/70 text-sm font-bold mb-2">
                    Rol
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'member'})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}