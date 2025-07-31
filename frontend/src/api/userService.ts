import api from './axiosInstance';

export const fetchUsers = async (
  page: number = 1,
  limit: number = 50,
  search: string = ''
) => {
  const res = await api.get('/users', {
    params: {
      page,
      limit,
      ...(search ? { search } : {}), // only include search if provided
    },
  });
  return res.data;
};


export const updateUserRole = async (id: string, role: string) => {
  const res = await api.patch(`/users/${id}/role`, { role });
  return res.data;
};

export const updateUserPermission = async (id: string, canTriggerIngestion: boolean) => {
  const res = await api.patch(`/users/${id}/permissions`, { canTriggerIngestion });
  return res.data;
};