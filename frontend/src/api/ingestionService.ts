// src/api/ingestionService.ts

import api from './axiosInstance';

export const fetchIngestionLogs = async (
  status = 'ALL',
  search = '',
  page = 1,
  limit = 50
) => {
  const params: any = {
    page,
    limit,
  };
  if (status && status !== 'ALL' && status !== 'all') params.status = status;
  if (search && search.trim() !== '') params.search = search;

  const res = await api.get('/ingestion/history', { params });
  return res.data;
};

export const triggerIngestion = async (documentId: string) => {
  const res = await api.post(`/ingestion/trigger/${documentId}`);
  return res.data;
};

export const retryIngestion = async (logId: string) => {
  const res = await api.post(`/ingestion/retry/${logId}`);
  return res.data;
};