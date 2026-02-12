'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { FiUsers, FiEdit2, FiTrash2, FiCheck, FiX, FiSearch, FiFilter, FiUserPlus } from 'react-icons/fi';
import { Button, Card, Input } from '@/components';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_approved: boolean;
  is_active: boolean;
}

export default function UserManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'admin')) {
      router.push('/');
    } else if (user) {
      fetchUsers();
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await authAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await authAPI.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleApproveTutor = async (id: number) => {
    try {
      await authAPI.approveTutor(id);
      setUsers(users.map(u => u.id === id ? { ...u, is_approved: true } : u));
      toast.success('Tutor approved');
    } catch (error) {
      console.error('Error approving tutor:', error);
      toast.error('Failed to approve tutor');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await authAPI.updateUser(editingUser.id, editingUser);
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || u.user_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FiUsers className="mr-3 text-primary-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage all system users, tutors, and students</p>
          </div>
          <Button variant="primary">
            <FiUserPlus className="mr-2" />
            Add New User
          </Button>
        </div>

        <Card className="mb-8">
          <div className="p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="tutor">Tutors</option>
                <option value="student">Students</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-bold">{u.username[0].toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</div>
                        <div className="text-sm text-gray-500">@{u.username} • {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      u.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.user_type === 'tutor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {u.user_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${
                        u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {u.user_type === 'tutor' && (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${
                          u.is_approved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {u.is_approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {u.user_type === 'tutor' && !u.is_approved && (
                        <button
                          onClick={() => handleApproveTutor(u.id)}
                          className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-lg"
                          title="Approve Tutor"
                        >
                          <FiCheck className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingUser(u)}
                        className="text-primary-600 hover:text-primary-900 bg-primary-50 p-2 rounded-lg"
                        title="Edit User"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg"
                        title="Delete User"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <Input
                      value={editingUser.first_name}
                      onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <Input
                      value={editingUser.last_name}
                      onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.user_type}
                    onChange={(e) => setEditingUser({ ...editingUser, user_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="student">Student</option>
                    <option value="tutor">Tutor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingUser.is_active}
                    onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700 font-medium">Account Active</label>
                </div>
                <div className="flex space-x-3 pt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" className="flex-1" type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
