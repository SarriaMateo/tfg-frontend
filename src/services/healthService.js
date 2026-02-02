import api from '../api/api';

export const getHealth = () => {
  return api.get('/health');
};
