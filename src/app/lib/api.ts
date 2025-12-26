// API клиент для работы с backend
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-ff36f543`;

// Получаем токен из localStorage
export const getAuthToken = (): string | null => {  // <-- Добавлен export
  return localStorage.getItem('auth_token');
};

// Сохраняем токен
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

// Удаляем токен
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

// Базовый fetch с авторизацией
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  signup: async (data: { email: string; password: string; full_name: string; type?: string }) => {
    return apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  signin: async (email: string, password: string) => {
    const data = await apiFetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.session?.access_token) {
      setAuthToken(data.session.access_token);
    }
    
    return data;
  },

  signout: () => {
    removeAuthToken();
  },
};

// Persons API
export const personsAPI = {
  getAll: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return apiFetch(`/persons${query}`);
  },

  getById: (id: number) => {
    return apiFetch(`/persons/${id}`);
  },

  create: (data: any) => {
    return apiFetch('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: any) => {
    return apiFetch(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Printers API
export const printersAPI = {
  getAll: () => {
    return apiFetch('/printers');
  },

  update: (id: number, data: any) => {
    return apiFetch(`/printers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Order Statuses API
export const orderStatusesAPI = {
  getAll: () => {
    return apiFetch('/order-statuses');
  },
};

// Materials API
export const materialsAPI = {
  getAll: () => {
    return apiFetch('/materials');
  },

  update: (id: number, data: any) => {
    return apiFetch(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Orders API
export const ordersAPI = {
  getAll: () => {
    return apiFetch('/orders');
  },

  getById: (id: number) => {
    return apiFetch(`/orders/${id}`);
  },

  create: (data: any) => {
    return apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: any) => {
    return apiFetch(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Order History API
export const orderHistoryAPI = {
  getAll: (orderId?: number) => {
    const query = orderId ? `?order_id=${orderId}` : '';
    return apiFetch(`/order-history${query}`);
  },
};

// Print Logs API
export const printLogsAPI = {
  getAll: () => {
    return apiFetch('/print-logs');
  },
};

// Views API
export const viewsAPI = {
  getKanban: () => {
    return apiFetch('/kanban-view');
  },

  getPrinters: () => {
    return apiFetch('/printers-view');
  },

  getClients: () => {
    return apiFetch('/clients-view');
  },
};