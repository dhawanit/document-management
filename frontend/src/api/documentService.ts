import api from './axiosInstance';

export const fetchDocuments = async () => {
  const res = await api.get('/documents');
  return res.data;
};

export const uploadDocument = async (formData: FormData) => {
  const res = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteDocument = async (id: string) => {
  const res = await api.delete(`/documents/${id}`);
  return res.data;
};

export const updateDocument = async (id: string, formData: FormData) => {
  const res = await api.patch(`/documents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getDocumentFile = async (url: string) => {
  // We assume the backend returns direct file path
  const response = await fetch(url);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};