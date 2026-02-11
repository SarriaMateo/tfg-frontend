import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const registerCompany = async (companyData) => {
  const response = await axios.post(
    'http://localhost:8000/api/v1/companies/register',
    {
      company: {
        name: companyData.companyName,
        email: companyData.companyEmail,
        nif: companyData.companyNif,
      },
      admin_user: {
        name: companyData.adminName,
        username: companyData.adminUsername,
        password: companyData.adminPassword,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export default api;
