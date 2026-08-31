import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function UserList() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users.php', { params: { admin_token: 'admin123' } });
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      String(u.id).includes(term)
    );
  });

  const handleRoleChange = async (id, role) => {
    if (id === currentUser?.id) {
      toast('You cannot change your own role', 'error');
      return;
    }
    try {
      await api.put('/users.php', { id, role, admin_token: 'admin123' });
      toast('User role updated', 'success');
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update user role';
      toast(msg, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (id === currentUser?.id) {
      toast('You cannot delete your own account', 'error');
      return;
    }
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete('/users.php', { params: { id, admin_token: 'admin123' } });
      toast(`User "${name}" deleted`, 'info');
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete user';
      toast(msg, 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>User Management</h1>
          <p className="admin-subtitle">{users.length} registered users</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-search"
          placeholder="Search by name, email, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td>
                  <strong>{u.full_name}</strong>
                  {u.id === currentUser?.id && <span className="you-badge"> (You)</span>}
                </td>
                <td>{u.email}</td>
                <td>
                  {u.id === currentUser?.id ? (
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  ) : (
                    <select
                      value={u.role}
                      className="role-select"
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  )}
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="table-actions">
                  <button className="btn-action delete" onClick={() => handleDelete(u.id, u.full_name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
