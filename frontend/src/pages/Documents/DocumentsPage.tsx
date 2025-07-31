import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { fetchDocuments, uploadDocument, deleteDocument, updateDocument, getDocumentFile } from '../../api/documentService';
import { useAuth } from '../../context/AuthContext';
import { Document, Page } from 'react-pdf';

export default function DocumentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  // Upload mutation (updates cache instantly)
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (newDoc) => {
      queryClient.setQueryData(['documents'], (old: any) =>
        old ? [...old, newDoc] : [newDoc]
      );
    },
  });

  // Delete mutation with cache update
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['documents'], (old: any) =>
        old ? old.filter((doc: any) => doc.id !== deletedId) : []
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updateDocument(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [previewUrl, setPreviewUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDocId, setEditDocId] = useState<string>('');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    uploadMutation.mutate(formData);
    setTitle('');
    setDescription('');
    setFile(null);
  };

  const handleEdit = (doc: any) => {
    setEditDocId(doc.id);
    setTitle(doc.title);
    setDescription(doc.description);
    setShowEditModal(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) formData.append('file', file);
    updateMutation.mutate({ id: editDocId, data: formData });
    setShowEditModal(false);
  };

  const handlePreview = async (filePath: string) => {
    const response = await fetch(filePath);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setFileType(blob.type);
    setShowPreviewModal(true);
  };

  const handleDelete = (id: string) => {
    // Ask for confirmation before delete
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Documents</h1>

      {/* Upload form */}
      {(user?.role === 'admin' || user?.role === 'editor') && (
        <form onSubmit={handleUpload} className="bg-white p-4 rounded shadow mb-6 space-y-2">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded w-full"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={uploadMutation.isLoading}
          >
            {uploadMutation.isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      )}

      {/* Documents list */}
      {isLoading ? (
        <p>Loading documents...</p>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Title</th>
              <th className="p-2">Description</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc: any) => (
              <tr key={doc.id} className="border-t">
                <td className="p-2">{doc.title}</td>
                <td className="p-2">{doc.description}</td>
                <td className="p-2">{doc.status}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handlePreview(doc.filePath)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Preview
                  </button>
                  {(user?.role === 'admin' || user?.id === doc.userId) && (
                    <>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-lg font-bold mb-2">Edit Document</h2>
            <form onSubmit={handleUpdate} className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border p-2 rounded w-full"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border p-2 rounded w-full"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-400 text-white px-3 py-1 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-3/4 h-3/4 overflow-auto relative">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
            >
              Close
            </button>
            {fileType === 'application/pdf' ? (
              <Document file={previewUrl}>
                <Page pageNumber={1} />
              </Document>
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-auto" />
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}