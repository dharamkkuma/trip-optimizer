import { useState, useEffect } from 'react'
import { User, authAPI } from '../utils/api'
import { useAlert } from './AlertProvider'

interface AdminUserManagementProps {
  user: User
}

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
  role: 'user' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastLogin: string
}

export default function AdminUserManagement({ user }: AdminUserManagementProps) {
  const { success, error, warning, info } = useAlert()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all')

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'user' as 'user' | 'admin'
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getAllUsers({
        page: 1,
        limit: 100
      })
      
      const userList = response.users || response.data || []
      const formattedUsers: UserData[] = userList.map((user: any) => ({
        id: user._id || user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || 'user',
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || 'Never'
      }))
      
      setUsers(formattedUsers)
    } catch (err) {
      console.error('Error loading users:', err)
      error(`Failed to load users: ${err instanceof Error ? err.message : 'Unknown error'}`)
      // Fallback to sample data if API fails
      const sampleUsers: UserData[] = [
        {
          id: 'user_1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          role: 'user',
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z',
          lastLogin: '2024-01-20T14:30:00Z'
        },
        {
          id: 'user_2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-10T09:00:00Z',
          lastLogin: '2024-01-20T16:45:00Z'
        }
      ]
      setUsers(sampleUsers)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.username || !newUser.password) {
      warning('Please fill in all required fields')
      return
    }

    try {
      const response = await authAPI.createUser({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role
      })

      await loadUsers()
      
      setNewUser({ firstName: '', lastName: '', email: '', username: '', password: '', role: 'user' })
      setShowAddForm(false)
      
      success('User created successfully!')
    } catch (err) {
      console.error('Error creating user:', err)
      error('Failed to create user. Please try again.')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await authAPI.deleteUser(userId)
        await loadUsers() // Reload users list
        success('User deleted successfully!')
      } catch (err) {
        console.error('Error deleting user:', err)
        error('Failed to delete user. Please try again.')
      }
    }
  }

  const handleUpdateUser = async (updatedUser: UserData) => {
    try {
      await authAPI.updateUser(updatedUser.id, {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status
      })
      
      await loadUsers() // Reload users list
      setEditingUser(null)
      success('User updated successfully!')
    } catch (err) {
      console.error('Error updating user:', err)
      error('Failed to update user. Please try again.')
    }
  }

  const handleChangePassword = async (userId: string) => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      warning('Passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      warning('Password must be at least 6 characters')
      return
    }
    
    try {
      await authAPI.resetUserPassword(userId, null, passwordData.newPassword)
      
      success('Password changed successfully')
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setShowPasswordForm(null)
    } catch (err) {
      console.error('Error changing password:', err)
      error(`Failed to change password: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return
      
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      await authAPI.updateUser(userId, { status: newStatus })
      
      await loadUsers() // Reload users list
      success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`)
    } catch (err) {
      console.error('Error toggling user status:', err)
      error('Failed to update user status. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
            <p className="text-gray-600">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={newUser.firstName}
                onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={newUser.lastName}
                onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add User
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.firstName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin === 'Never' ? 'Never' : new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="flex items-center text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit User"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setShowPasswordForm(user.id)}
                        className="flex items-center text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        title="Change Password"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Password
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`flex items-center px-2 py-1 rounded transition-colors ${
                          user.status === 'active' 
                            ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="flex items-center text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete User"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value as 'user' | 'admin' } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, status: e.target.value as 'active' | 'inactive' | 'suspended' } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => editingUser && handleUpdateUser(editingUser)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleChangePassword(showPasswordForm)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={() => setShowPasswordForm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
