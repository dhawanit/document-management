import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { fetchDocuments, uploadDocument, deleteDocument, updateDocument } from '../../api/documentService';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Document, Page } from 'react-pdf';
import mammoth from 'mammoth';

export default function DocumentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  // ✅ Add Document state
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);

  // ✅ Edit Document state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editDocId, setEditDocId] = useState('');
  const [existingFilePath, setExistingFilePath] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ Preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ✅ TXT and DOCX text preview
  const [textContent, setTextContent] = useState('');

  // ✅ Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  // ✅ Upload document
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setAddTitle('');
      setAddDescription('');
      setAddFile(null);
    },
  });

  // ✅ Delete document
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    },
  });

  // ✅ Update document
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      handleCloseEditModal();
    },
  });

  // --------------------
  // HANDLERS
  // --------------------
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFile) return;
    const formData = new FormData();
    formData.append('file', addFile);
    formData.append('title', addTitle);
    formData.append('description', addDescription);
    uploadMutation.mutate(formData);
  };

  const handleEdit = (doc: any) => {
    setEditDocId(doc.id);
    setEditTitle(doc.title);
    setEditDescription(doc.description);
    setExistingFilePath(doc.filePath);
    setEditFile(null);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditDocId('');
    setEditTitle('');
    setEditDescription('');
    setEditFile(null);
    setExistingFilePath('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDescription);
    if (editFile) {
      formData.append('file', editFile);
    } else {
      formData.append('existingFilePath', existingFilePath);
    }
    updateMutation.mutate({ id: editDocId, data: formData });
  };

  // ✅ Preview document based on file type
  const handlePreview = async (doc: any) => {
    try {
      setTextContent('');
      let url = '';
      if (doc.storageLocation === 'local') {
        url = `${import.meta.env.VITE_API_BASE_URL}/${doc.filePath}`;
      } else if (doc.storageLocation === 's3') {
        url = doc.filePath;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('File not accessible');

      const blob = await response.blob();
      const type = blob.type || doc.fileType;

      if (type === 'application/pdf') {
        setFileType('pdf');
        setPreviewUrl(URL.createObjectURL(blob));
      } else if (type === 'text/plain') {
        const text = await blob.text();
        setFileType('txt');
        setTextContent(text);
      } else if (
        type === 'application/msword' ||
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setFileType('docx');
        setTextContent(result.value);
      } else {
        setFileType('unsupported');
      }

      setShowPreviewModal(true);
    } catch (error) {
      console.error('Preview error:', error);
      alert('Unable to load document preview.');
    }
  };

  const confirmDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this document?',
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Documents</h1>

      {/* Add Document */}
      {(user?.role === 'admin' || user?.role === 'editor') && (
        <form onSubmit={handleUpload} className="bg-white p-4 rounded shadow mb-6 space-y-2">
          <input
            type="text"
            placeholder="Title"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <textarea
            placeholder="Description"
            value={addDescription}
            onChange={(e) => setAddDescription(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="file"
            onChange={(e) => setAddFile(e.target.files?.[0] || null)}
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

      {/* Document list */}
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
                    onClick={() => handlePreview(doc)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Preview
                  </button>
                  {(user?.role === 'admin' || user?.id === doc.user?.id) && (
                    <>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(doc.id)}
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

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

            {fileType === 'pdf' && (
              <Document file={previewUrl}>
                <Page pageNumber={1} />
              </Document>
            )}

            {fileType === 'txt' && (
              <pre className="whitespace-pre-wrap">{textContent}</pre>
            )}

            {fileType === 'docx' && (
              <div className="prose max-w-none whitespace-pre-wrap">{textContent}</div>
            )}

            {fileType === 'unsupported' && (
              <div className="text-center text-gray-600">
                Preview not supported for this file type. Please download the file.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 relative">
            <button
              onClick={handleCloseEditModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Edit Document</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Title"
                required
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Description"
                required
              ></textarea>
              <div className="text-sm text-gray-500">
                Current file: <span className="font-medium">{existingFilePath.split('/').pop()}</span>
              </div>
              <input
                type="file"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                className="border p-2 rounded w-full"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}