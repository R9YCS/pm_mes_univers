// API клиент для работы с Supabase через REST API напрямую

// Конфигурация Supabase
const supabaseUrl = 'https://rttikoxslnnifkizeref.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dGlrb3hzbG5uaWZraXplcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQ5NDMsImV4cCI6MjA4MjI0MDk0M30.A9PbLqhQaTApNPB8tcFTX3Gn4thGSS1Ch_exqZy28fc';

// Получаем токен из localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('supabase.auth.token');
  }
  return null;
};

// Сохраняем токен
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase.auth.token', token);
  }
};

// Удаляем токен
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase.auth.token');
  }
};

// Базовый fetch для Supabase REST API
const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
      throw new Error(result.message || result.error || 'Signup failed');
    }
    
    if (result.access_token) {
      setAuthToken(result.access_token);
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
      throw new Error(result.message || result.error || 'Signin failed');
    }
    
    if (result.access_token) {
      setAuthToken(result.access_token);
    }
    
    return result;
  },

  signout: async () => {
    const token = getAuthToken();
    if (token) {
      await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`
        },
      });
    }
    removeAuthToken();
  },

  getSession: async () => {
    const token = getAuthToken();
    if (!token) return null;
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) return null;
    return response.json();
  }
};

// Persons API через Supabase REST API
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
    });
  },

  update: (id: number, data: any) => {
    return supabaseFetch(`/persons?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Printers API через Supabase REST API
export const printersAPI = {
  getAll: () => {
    return supabaseFetch('/printers?select=*&order=name');
  },

  getById: (id: number) => {
    return supabaseFetch(`/printers?id=eq.${id}`);
  },

  update: (id: number, data: any) => {
    return supabaseFetch(`/printers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Order Statuses API через Supabase REST API
export const orderStatusesAPI = {
  getAll: () => {
    return supabaseFetch('/order_statuses?select=*&order=sort_order');
  },
};

// Materials API через Supabase REST API
export const materialsAPI = {
  getAll: () => {
    return supabaseFetch('/materials?select=*&order=name');
  },
};

// Orders API через Supabase REST API
export const ordersAPI = {
  getAll: () => {
    return supabaseFetch(`
      /orders?select=*,
      client:persons(*),
      status:order_statuses(*),
      material:materials(*)
      &order=created_at.desc
    `);
  },

  getById: (id: number) => {
    return supabaseFetch(`
      /orders?select=*,
      client:persons(*),
      status:order_statuses(*),
      material:materials(*)
      &id=eq.${id}
    `);
  },

  create: (data: any) => {
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return supabaseFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        order_number: orderNumber,
        created_at: new Date().toISOString(),
        status_id: 1
      }),
    });
  },

  update: (id: number, data: any) => {
    return supabaseFetch(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateStatus: (id: number, statusId: number, userId: number) => {
    return supabaseFetch(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status_id: statusId,
        assigned_to: userId
      }),
    });
  },
};

// Views API - используем RPC или прямые запросы
export const viewsAPI = {
  getKanban: async () => {
    // Если представление не создано, делаем JOIN вручную
    const orders = await ordersAPI.getAll();
    const statuses = await orderStatusesAPI.getAll();
    
    // Преобразуем данные для Kanban
    return orders.map((order: any) => ({
      ...order,
      status_name: statuses.find((s: any) => s.id === order.status_id)?.name || 'Неизвестно',
      status_color: statuses.find((s: any) => s.id === order.status_id)?.color || '#808080'
    }));
  },

  getPrinters: async () => {
    const printers = await printersAPI.getAll();
    const orders = await ordersAPI.getAll();
    
    // Обогащаем данные о принтерах информацией о текущем заказе
    return printers.map((printer: any) => {
      const currentOrder = orders.find((order: any) => 
        order.printer_id === printer.id && 
        order.status_id === 3 // статус "В печати"
      );
      
      return {
        ...printer,
        current_order: currentOrder?.order_number,
        order_name: currentOrder?.name
      };
    });
  },

  getClients: async () => {
    const persons = await personsAPI.getAll('client');
    const orders = await ordersAPI.getAll();
    
    // Агрегируем данные по клиентам
    return persons.map((person: any) => {
      const clientOrders = orders.filter((order: any) => order.client_id === person.id);
      
      return {
        ...person,
        total_orders: clientOrders.length,
        last_order_date: clientOrders.length > 0 
          ? clientOrders[0].created_at 
          : null,
        total_spent: clientOrders.reduce((sum: number, order: any) => 
          sum + (order.actual_cost || 0), 0
        )
      };
    });
  },
};

// Order History API через Supabase REST API
export const orderHistoryAPI = {
  getAll: (orderId?: number) => {
    let endpoint = '/order_history?select=*&order=changed_at.desc';
    if (orderId) {
      endpoint += `&order_id=eq.${orderId}`;
    }
    return supabaseFetch(endpoint);
  },
};

// Print Logs API через Supabase REST API
export const printLogsAPI = {
  getAll: () => {
    return supabaseFetch('/print_logs?select=*&order=started_at.desc');
  },
};

// Statistics API
export const statisticsAPI = {
  getDashboardStats: async () => {
    const [orders, printers, persons] = await Promise.all([
      ordersAPI.getAll(),
      printersAPI.getAll(),
      personsAPI.getAll('client')
    ]);

    return {
      total_orders: orders.length,
      active_orders: orders.filter((order: any) => 
        order.status_id !== 6 && order.status_id !== 7
      ).length,
      printers: printers.length,
      total_clients: persons.length,
      active_printers: printers.filter((printer: any) => 
        printer.status === 'printing'
      ).length
    };
  },
};

// Экспорт для удобства
export const API = {
  auth: authAPI,
  persons: personsAPI,
  printers: printersAPI,
  orders: ordersAPI,
  orderStatuses: orderStatusesAPI,
  materials: materialsAPI,
  orderHistory: orderHistoryAPI,
  printLogs: printLogsAPI,
  views: viewsAPI,
  statistics: statisticsAPI,
};

export default API;