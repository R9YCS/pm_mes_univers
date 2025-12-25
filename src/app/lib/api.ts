// Обновленный api.ts для работы с RLS

const supabaseUrl = 'https://rttikoxslnnifkizeref.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dGlrb3hzbG5uaWZraXplcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQ5NDMsImV4cCI6MjA4MjI0MDk0M30.A9PbLqhQaTApNPB8tcFTX3Gn4thGSS1Ch_exqZy28fc';

// Получаем токен из localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('supabase.auth.token');
  }
  return null;
};

// Базовый fetch с поддержкой RLS
const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
    'Authorization': token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`,
    ...options.headers,
  };

  const url = `${supabaseUrl}/rest/v1${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API через Supabase REST API
export const authAPI = {
  signup: async (data: { email: string; password: string; full_name: string; type?: string }) => {
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        data: {
          full_name: data.full_name,
          type: data.type || 'employee'
        }
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.msg || result.error || 'Signup failed');
    }
    
    if (result.access_token) {
      localStorage.setItem('supabase.auth.token', result.access_token);
    }
    
    return result;
  },

  signin: async (email: string, password: string) => {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error_description || result.error || 'Signin failed');
    }
    
    if (result.access_token) {
      localStorage.setItem('supabase.auth.token', result.access_token);
    }
    
    return result;
  },

  signout: () => {
    localStorage.removeItem('supabase.auth.token');
  },
};

// Persons API
export const personsAPI = {
  getAll: (type?: string) => {
    let endpoint = '/persons?select=*&order=created_at.desc';
    if (type) {
      endpoint += `&type=eq.${type}`;
    }
    return supabaseFetch(endpoint);
  },

  getById: (id: number) => {
    return supabaseFetch(`/persons?id=eq.${id}`);
  },

  create: (data: any) => {
    return supabaseFetch('/persons', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        created_at: new Date().toISOString(),
        is_active: true
      }),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },

  update: (id: number, data: any) => {
    return supabaseFetch(`/persons?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },
};

// Printers API
export const printersAPI = {
  getAll: () => {
    return supabaseFetch('/printers?select=*&order=name');
  },

  getById: (id: number) => {
    return supabaseFetch(`/printers?id=eq.${id}`);
  },

  create: (data: any) => {
    return supabaseFetch('/printers', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },

  update: (id: number, data: any) => {
    return supabaseFetch(`/printers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },
};

// Order Statuses API
export const orderStatusesAPI = {
  getAll: () => {
    return supabaseFetch('/order_statuses?select=*&order=sort_order');
  },
};

// Materials API
export const materialsAPI = {
  getAll: () => {
    return supabaseFetch('/materials?select=*&order=name');
  },

  getById: (id: number) => {
    return supabaseFetch(`/materials?id=eq.${id}`);
  },

  create: (data: any) => {
    return supabaseFetch('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },

  update: (id: number, data: any) => {
    return supabaseFetch(`/materials?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },
};

// Orders API
export const ordersAPI = {
  getAll: () => {
    return supabaseFetch('/orders?select=*&order=created_at.desc');
  },

  getById: (id: number) => {
    return supabaseFetch(`/orders?id=eq.${id}`);
  },

  create: (data: any) => {
    // Генерация номера заказа
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return supabaseFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        order_number: orderNumber,
        created_at: new Date().toISOString(),
        status_id: 1
      }),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },

  update: (id: number, data: any) => {
    return supabaseFetch(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },
};

// Order History API
export const orderHistoryAPI = {
  getAll: (orderId?: number) => {
    let endpoint = '/order_history?select=*&order=changed_at.desc';
    if (orderId) {
      endpoint += `&order_id=eq.${orderId}`;
    }
    return supabaseFetch(endpoint);
  },
};

// Print Logs API
export const printLogsAPI = {
  getAll: () => {
    return supabaseFetch('/print_logs?select=*&order=started_at.desc');
  },
};

// Printer Maintenance API
export const printerMaintenanceAPI = {
  getAll: () => {
    return supabaseFetch('/printer_maintenance?select=*&order=performed_at.desc');
  },
};

// Экспорт всех API
export const API = {
  auth: authAPI,
  persons: personsAPI,
  printers: printersAPI,
  orders: ordersAPI,
  orderStatuses: orderStatusesAPI,
  materials: materialsAPI,
  orderHistory: orderHistoryAPI,
  printLogs: printLogsAPI,
  printerMaintenance: printerMaintenanceAPI,
};

export default API;