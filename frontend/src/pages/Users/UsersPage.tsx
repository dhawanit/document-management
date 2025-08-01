import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { fetchUsers, updateUserRole, updateUserPermission } from '../../api/userService';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const { data = { data: [], total: 0, totalPages: 1 }, isLoading } = useQuery({
    queryKey: ['users', page, limit, search],
    queryFn: () => fetchUsers(page, limit, search),
    keepPreviousData: true,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const permissionMutation = useMutation({
    mutationFn: ({ id, canTriggerIngestion }: { id: string; canTriggerIngestion: boolean }) =>
      updateUserPermission(id, canTriggerIngestion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  if (user?.role !== 'admin') {
    return <div className="p-6 text-red-500">Access Denied: Admins only.</div>;
  }

  const totalPages = data.totalPages;

  const handleRoleChange = (id: string, newRole: string) => {
    setConfirmDialog({
      isOpen: true,
      message: `Are you sure you want to change this user's role to '${newRole}'?`,
      onConfirm: () => {
        roleMutation.mutate({ id, role: newRole });
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleToggleIngestion = (id: string, currentState: boolean) => {
    const action = currentState ? 'Revoke' : 'Grant';
    setConfirmDialog({
      isOpen: true,
      message: `Are you sure you want to ${action} ingestion permission for this user?`,
      onConfirm: () => {
        permissionMutation.mutate({ id, canTriggerIngestion: !currentState });
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      {/* Search and pagination size */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search by email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded w-1/3"
        />
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border p-2 rounded"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={150}>150</option>
          <option value={200}>200</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <table className="w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Can Trigger Ingestion</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.canTriggerIngestion ? 'Yes' : 'No'}</td>
                  <td className="p-2 space-x-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {u.role !== 'viewer' && (
                      <button
                        onClick={() => handleToggleIngestion(u.id, u.canTriggerIngestion)}
                        className={`px-2 py-1 rounded ${
                          u.canTriggerIngestion ? 'bg-green-500' : 'bg-gray-400'
                        } text-white`}
                      >
                        {u.canTriggerIngestion ? 'Revoke' : 'Grant'} Ingestion
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </DashboardLayout>
  );
}