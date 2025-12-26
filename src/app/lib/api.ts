// API клиент для работы с backend
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;

// Получаем токен из localStorage
export const getAuthToken = (): string | null => {
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

// Базовый fetch для REST API
const restFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${token || publicAnonKey}`,
    'Prefer': 'return=representation', // для получения данных после INSERT/UPDATE
    ...options.headers,
  };

  const response = await fetch(`${SUPABASE_REST_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  // Для DELETE запросов может не быть тела
  if (options.method === 'DELETE' && response.status === 204) {
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

// Auth API - используем прямой доступ к Supabase Auth
export const authAPI = {
  signup: async (data: { email: string; password: string; full_name: string; type?: string }) => {
    // Создаем пользователя в Supabase Auth
    const authResponse = await authFetch('/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        data: { full_name: data.full_name, type: data.type }
      }),
    });

    // Создаем запись в таблице persons
    if (authResponse.user) {
      await restFetch('/persons', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          full_name: data.full_name,
          type: data.type || 'user',
          auth_id: authResponse.user.id
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
};

// Printers API
export const printersAPI = {
  getAll: () => {
    return restFetch('/printers?select=*&order=name');
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
};

// Order Statuses API
export const orderStatusesAPI = {
  getAll: () => {
    return restFetch('/order_statuses?select=*&order=id');
  },
};

// Materials API
export const materialsAPI = {
  getAll: () => {
    return restFetch('/materials?select=*&order=name');
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
};

// Order History API
export const orderHistoryAPI = {
  getAll: (orderId?: number) => {
    const query = orderId ? `?order_id=eq.${orderId}` : '';
    return restFetch(`/order_history${query}&select=*&order=created_at.desc`);
  },
};

// Print Logs API
export const printLogsAPI = {
  getAll: () => {
    return restFetch('/print_logs?select=*&order=created_at.desc');
  },
};

// Views API - оставляем через функции если нужно, или переделываем на прямые запросы
export const viewsAPI = {
  getKanban: () => {
    // Если есть материализованное представление
    return restFetch('/kanban_view?select=*');
  },

  getPrinters: () => {
    return restFetch('/printers_view?select=*');
  },

  getClients: () => {
    return restFetch('/clients_view?select=*');
  },
};
