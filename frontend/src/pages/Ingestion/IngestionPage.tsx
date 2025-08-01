import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  fetchIngestionLogs,
  triggerIngestion
} from '../../api/ingestionService';
import { fetchDocuments } from '../../api/documentService';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function IngestionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  // Fetch ingestion logs
  const { data: logsResponse = { data: [], total: 0, totalPages: 1 }, isLoading } = useQuery({
    queryKey: ['ingestionLogs', statusFilter, search, page, limit],
    queryFn: () => fetchIngestionLogs(statusFilter, search, page, limit),
    keepPreviousData: true,
  });

  const logs = logsResponse.data ?? [];

  // Load available documents for triggering ingestion
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };
    loadDocs();
  }, []);

  // Mutations
  const triggerMutation = useMutation({
    mutationFn: (documentId: string) => triggerIngestion(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestionLogs'] });
      setSelectedDocument('');
    },
  });

  if (!(user?.role === 'admin' || user?.canTriggerIngestion)) {
    return <div className="p-6 text-red-500">Access Denied: You do not have ingestion permissions.</div>;
  }

  // Trigger ingestion
  const handleTrigger = () => {
    if (!selectedDocument) {
      alert('Please select a document to trigger ingestion.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      message: 'Are you sure you want to trigger ingestion for this document?',
      onConfirm: () => triggerMutation.mutate(selectedDocument),
    });
  };

  // Retry ingestion for a FAILED or CANCELLED log (re-trigger document ingestion)
  const handleRetry = (documentId: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Are you sure you want to retry ingestion for this document?',
      onConfirm: () => triggerMutation.mutate(documentId),
    });
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Ingestion Management</h1>

      {/* ✅ Trigger New Ingestion */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Trigger New Ingestion</h2>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="border p-2 rounded w-full md:w-1/2"
          >
            <option value="">-- Select Document --</option>
            {documents.map((doc: any) => (
              <option key={doc.id} value={doc.id}>
                {doc.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleTrigger}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Trigger
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by document title"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded flex-grow"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
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

      {/* ✅ Ingestion Logs Table */}
      {isLoading ? (
        <p>Loading ingestion logs...</p>
      ) : logs.length === 0 ? (
        <p>No ingestion logs found.</p>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Document Title</th>
              <th className="p-2">Status</th>
              <th className="p-2">Triggered By</th>
              <th className="p-2">Created At</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t">
                <td className="p-2">{log.documentTitle}</td>
                <td
                  className={`p-2 font-semibold ${
                    log.status === 'FAILED'
                      ? 'text-red-500'
                      : log.status === 'COMPLETED'
                      ? 'text-green-600'
                      : log.status === 'PENDING'
                      ? 'text-yellow-500'
                      : 'text-gray-600'
                  }`}
                >
                  {log.status}
                </td>
                <td className="p-2">{log.triggeredBy}</td>
                <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  {(log.status === 'failed' || log.status === 'cancelled') && (
                    <button
                      onClick={() => handleRetry(log.documentId)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Retry Ingestion
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1">
          Page {page} / {logsResponse.totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, logsResponse.totalPages))}
          disabled={page === logsResponse.totalPages}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </DashboardLayout>
  );
}