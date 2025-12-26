// API клиент для работы с backend
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;

// Получаем токен из localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Сохраняем токен
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

// Удаляем токен
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// Базовый fetch для REST API
const restFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${token || publicAnonKey}`,
    ...options.headers,
  };

  // Добавляем Prefer для определенных методов
  if (options.method === 'POST' || options.method === 'PATCH' || options.method === 'PUT') {
    headers['Prefer'] = 'return=representation';
  }

  const response = await fetch(`${SUPABASE_REST_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  // Для DELETE запросов может не быть тела
  if (response.status === 204 || response.status === 201) {
    return { success: true };
  }

  return response.json();
};

// Базовый fetch для Auth API
const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey,
    ...options.headers,
  };

  const response = await fetch(`${SUPABASE_AUTH_URL}${endpoint}`, {
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
    // Создаем пользователя в Supabase Auth
    const authResponse = await authFetch('/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        data: { 
          full_name: data.full_name,
          type: data.type || 'user'
        }
      }),
    });

    if (authResponse.access_token) {
      setAuthToken(authResponse.access_token);
      
      // Создаем запись в таблице persons
      await restFetch('/persons', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          full_name: data.full_name,
          type: data.type || 'user',
          auth_id: authResponse.user?.id
        }),
      });
    }

    return authResponse;
  },

  signin: async (email: string, password: string) => {
    const data = await authFetch('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    
    return data;
  },

  signout: () => {
    removeAuthToken();
  },

  // Проверка текущей сессии
  getSession: async () => {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
      return await authFetch('/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      removeAuthToken();
      return null;
    }
  }
};

// Persons API
export const personsAPI = {
  getAll: (type?: string) => {
    const query = type ? `?type=eq.${type}` : '';
    return restFetch(`/persons${query}&select=*&order=created_at.desc`);
  },

  getById: (id: number) => {
    return restFetch(`/persons?id=eq.${id}&select=*`);
  },

  create: (data: any) => {
    return restFetch('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: any) => {
    return restFetch(`/persons?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: number) => {
    return restFetch(`/persons?id=eq.${id}`, {
      method: 'DELETE',
    });
  }
};

// Printers API
export const printersAPI = {
  getAll: () => {
    return restFetch('/printers?select=*&order=name');
  },

  getById: (id: number) => {
    return restFetch(`/printers?id=eq.${id}&select=*`);
  },

  create: (data: any) => {
    return restFetch('/printers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: any) => {
    return restFetch(`/printers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: number) => {
    return restFetch(`/printers?id=eq.${id}`, {
      method: 'DELETE',
    });
  }
};

// Order Statuses API
export const orderStatusesAPI = {
  getAll: () => {
    return restFetch('/order_statuses?select=*&order=id');
  },

  getById: (id: number) => {
    return restFetch(`/order_statuses?id=eq.${id}&select=*`);
  }
};

// Materials API
export const materialsAPI = {
  getAll: () => {
    return restFetch('/materials?select=*&order=name');
  },

  getById: (id: number) => {
    return restFetch(`/materials?id=eq.${id}&select=*`);
  },

  create: (data: any) => {
    return restFetch('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: any) => {
    return restFetch(`/materials?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: number) => {
    return restFetch(`/materials?id=eq.${id}`, {
      method: 'DELETE',
    });
  }
};

// Orders API
export const ordersAPI = {
  getAll: () => {
    return restFetch('/orders?select=*&order=created_at.desc');
  },

  getById: (id: number) => {
    return restFetch(`/orders?id=eq.${id}&select=*`);
  },

  create: (data: any) => {
    return restFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: any) => {
    return restFetch(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: number) => {
    return restFetch(`/orders?id=eq.${id}`, {
      method: 'DELETE',
    });
  }
};

// Order History API
export const orderHistoryAPI = {
  getAll: (orderId?: number) => {
    const query = orderId ? `?order_id=eq.${orderId}` : '';
    return restFetch(`/order_history${query}&select=*&order=created_at.desc`);
  },

  create: (data: any) => {
    return restFetch('/order_history', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// Print Logs API
export const printLogsAPI = {
  getAll: () => {
    return restFetch(`/print_logs?select=*&order=created_at.desc`);
  },

  create: (data: any) => {
    return restFetch('/print_logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// Views API
export const viewsAPI = {
  getKanban: () => {
    return restFetch('/kanban_view?select=*');
  },

  getPrinters: () => {
    return restFetch('/printers_view?select=*');
  },

  getClients: () => {
    return restFetch('/clients_view?select=*');
  }
};

// Storage API (если нужен)
export const storageAPI = {
  uploadFile: async (bucket: string, file: File, path: string) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || publicAnonKey}`,
        'apikey': publicAnonKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  },

  getFileUrl: (bucket: string, path: string) => {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
};
