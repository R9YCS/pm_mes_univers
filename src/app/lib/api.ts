// API клиент для работы с backend

// Прямые значения вместо импорта
const supabaseUrl = 'https://rttikoxslnnifkizeref.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dGlrb3hzbG5uaWZraXplcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQ5NDMsImV4cCI6MjA4MjI0MDk0M30.A9PbLqhQaTApNPB8tcFTX3Gn4thGSS1Ch_exqZy28fc';

// Получаем токен из localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('supabase.auth.token');
};

// Сохраняем токен
export const setAuthToken = (token: string) => {
  localStorage.setItem('supabase.auth.token', token);
};

// Удаляем токен
export const removeAuthToken = () => {
  localStorage.removeItem('supabase.auth.token');
};

// Базовый fetch для REST API Supabase с RLS
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

// Базовый fetch для Edge Functions (если потребуется)
const edgeFunctionFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Используем Edge Functions URL
  const apiBaseUrl = `${supabaseUrl}/functions/v1`;
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Определяем какой метод использовать (прямой REST API по умолчанию)
const useDirectAPI = true;
const apiFetch = useDirectAPI ? supabaseFetch : edgeFunctionFetch;

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

  assignTask: async (printerId: number, orderId: number) => {
    try {
      // Получаем текущее время
      const now = new Date().toISOString();
      
      // Обновляем принтер: устанавливаем задание и статус "printing"
      const printerUpdate = await supabaseFetch(`/printers?id=eq.${printerId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          current_task_id: orderId,
          status: 'printing',
          updated_at: now
        })
      });
      
      // Обновляем заказ: устанавливаем printer_id и статус "В печати" (status_id = 3)
      const orderUpdate = await supabaseFetch(`/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          printer_id: printerId,
          status_id: 3, // Статус "В печати"
          started_at: now
        })
      });
      
      // Запись в историю заказа
      await supabaseFetch('/order_history', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          new_status_id: 3,
          changed_at: now,
          notes: `Заказ назначен на принтер #${printerId}`
        })
      });
      
      return { printerUpdate, orderUpdate };
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  },

  completeTask: async (printerId: number, jobData: any) => {
    try {
      const now = new Date().toISOString();
      const startedAt = new Date(Date.now() - (jobData.actual_time * 60 * 1000)).toISOString();
      const success = jobData.success !== false;
      const newStatusId = success ? 4 : 5; // 4 - Завершен, 5 - Проблема
      
      // Создаем запись в журнале печати
      const printLog = await supabaseFetch('/print_logs', {
        method: 'POST',
        body: JSON.stringify({
          order_id: jobData.order_id,
          printer_id: printerId,
          material_used: jobData.material_used,
          print_time: jobData.actual_time,
          success: success,
          issues: jobData.issues,
          quality: jobData.quality,
          started_at: startedAt,
          completed_at: now,
          notes: jobData.notes
        })
      });
      
      // Обновляем принтер: снимаем задание и меняем статус
      const printerUpdate = await supabaseFetch(`/printers?id=eq.${printerId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          current_task_id: null,
          status: success ? 'idle' : 'error',
          updated_at: now
        })
      });
      
      // Обновляем заказ: завершаем его
      const orderUpdate = await supabaseFetch(`/orders?id=eq.${jobData.order_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status_id: newStatusId,
          completed_at: now,
          actual_cost: jobData.material_used * 0.1 // Пример расчета стоимости
        })
      });
      
      // Запись в историю заказа
      await supabaseFetch('/order_history', {
        method: 'POST',
        body: JSON.stringify({
          order_id: jobData.order_id,
          new_status_id: newStatusId,
          changed_at: now,
          notes: jobData.success ? 'Заказ успешно напечатан' : `Проблемы при печати: ${jobData.issues}`
        })
      });
      
      return { printLog, printerUpdate, orderUpdate };
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  deletePrinter: (id: number) => {
    return supabaseFetch(`/printers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        is_active: false,
        status: 'offline',
        updated_at: new Date().toISOString()
      })
    });
  }
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
    return supabaseFetch('/orders?select=*,client:persons!client_id(full_name,company_name,email,phone),printer:printers!printer_id(name,model)&order=created_at.desc');
  },

  getAvailableForPrinting: () => {
    // Возвращаем заказы, которые можно назначить на печать (статусы 2 и 3)
    return supabaseFetch('/orders?select=*,client:persons!client_id(full_name,company_name),material:materials!material_id(name)&status_id=in.(2,3)&printer_id=is.null&order=priority.asc,created_at.asc');
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
      body: JSON.stringify({
        ...data,
        updated_at: new Date().toISOString()
      }),
      headers: {
        'Prefer': 'return=representation'
      }
    });
  },
};

// Order History API
export const orderHistoryAPI = {
  getAll: (orderId?: number) => {
    let endpoint = '/order_history?select=*,old_status:order_statuses!old_status_id(name),new_status:order_statuses!new_status_id(name),changed_by_user:persons!changed_by(full_name)&order=changed_at.desc';
    if (orderId) {
      endpoint += `&order_id=eq.${orderId}`;
    }
    return supabaseFetch(endpoint);
  },
};

// Print Logs API
export const printLogsAPI = {
  getAll: () => {
    return supabaseFetch('/print_logs?select=*,order:orders!order_id(order_number,name),printer:printers!printer_id(name,model),operator:persons!operator_id(full_name)&order=started_at.desc');
  },
};

// Printer Maintenance API
export const printerMaintenanceAPI = {
  getAll: () => {
    return supabaseFetch('/printer_maintenance?select=*,printer:printers!printer_id(name,model),technician:persons!technician_id(full_name)&order=performed_at.desc');
  },
};

// Views API (если используете Edge Functions)
export const viewsAPI = {
  getKanban: () => {
    // Если используете Edge Functions
    if (!useDirectAPI) {
      return edgeFunctionFetch('/kanban-view');
    }
    // Иначе делаем обычный запрос
    return ordersAPI.getAll();
  },

  getPrinters: () => {
    if (!useDirectAPI) {
      return edgeFunctionFetch('/printers-view');
    }
    return printersAPI.getAll();
  },

  getClients: () => {
    if (!useDirectAPI) {
      return edgeFunctionFetch('/clients-view');
    }
    return personsAPI.getAll('client');
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
  views: viewsAPI,
};

export default API;