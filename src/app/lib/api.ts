// API клиент для работы с Supabase напрямую
import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const supabaseUrl = 'https://rttikoxslnnifkizeref.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dGlrb3hzbG5uaWZraXplcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQ5NDMsImV4cCI6MjA4MjI0MDk0M30.A9PbLqhQaTApNPB8tcFTX3Gn4thGSS1Ch_exqZy28fc';

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Получаем токен из сессии Supabase
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const session = supabase.auth.getSession();
    return session?.data?.session?.access_token || null;
  }
  return null;
};

// Auth API через Supabase
export const authAPI = {
  signup: async (data: { email: string; password: string; full_name: string; type?: string }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          type: data.type || 'employee'
        }
      }
    });
    
    if (error) throw error;
    return authData;
  },

  signin: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  signout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  }
};

// Persons API через Supabase
export const personsAPI = {
  getAll: (type?: string) => {
    let query = supabase
      .from('persons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    return query;
  },

  getById: (id: number) => {
    return supabase
      .from('persons')
      .select('*')
      .eq('id', id)
      .single();
  },

  create: (data: any) => {
    return supabase
      .from('persons')
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single();
  },

  update: (id: number, data: any) => {
    return supabase
      .from('persons')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
};

// Printers API через Supabase
export const printersAPI = {
  getAll: () => {
    return supabase
      .from('printers')
      .select('*')
      .order('name');
  },

  getById: (id: number) => {
    return supabase
      .from('printers')
      .select('*')
      .eq('id', id)
      .single();
  },

  update: (id: number, data: any) => {
    return supabase
      .from('printers')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
};

// Order Statuses API через Supabase
export const orderStatusesAPI = {
  getAll: () => {
    return supabase
      .from('order_statuses')
      .select('*')
      .order('sort_order');
  },
};

// Materials API через Supabase
export const materialsAPI = {
  getAll: () => {
    return supabase
      .from('materials')
      .select('*')
      .order('name');
  },
};

// Orders API через Supabase
export const ordersAPI = {
  getAll: () => {
    return supabase
      .from('orders')
      .select(`
        *,
        client:persons!client_id(*),
        manager:persons!manager_id(*),
        status:order_statuses(*),
        material:materials(*)
      `)
      .order('created_at', { ascending: false });
  },

  getById: (id: number) => {
    return supabase
      .from('orders')
      .select(`
        *,
        client:persons!client_id(*),
        manager:persons!manager_id(*),
        status:order_statuses(*),
        material:materials(*)
      `)
      .eq('id', id)
      .single();
  },

  create: (data: any) => {
    // Генерация номера заказа
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return supabase
      .from('orders')
      .insert([{
        ...data,
        order_number: orderNumber,
        created_at: new Date().toISOString(),
        status_id: 1 // Новый статус
      }])
      .select()
      .single();
  },

  update: (id: number, data: any) => {
    return supabase
      .from('orders')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  updateStatus: (id: number, statusId: number, userId: number) => {
    return supabase
      .from('orders')
      .update({ 
        status_id: statusId,
        assigned_to: userId
      })
      .eq('id', id)
      .select()
      .single();
  },
};

// Views API через Supabase
export const viewsAPI = {
  getKanban: () => {
    return supabase
      .from('kanban_view')
      .select('*')
      .order('sort_order')
      .order('priority', { ascending: false })
      .order('deadline');
  },

  getPrinters: () => {
    return supabase
      .from('printers_view')
      .select('*');
  },

  getClients: () => {
    return supabase
      .from('clients_view')
      .select('*');
  },
};

// Order History API через Supabase
export const orderHistoryAPI = {
  getAll: (orderId?: number) => {
    let query = supabase
      .from('order_history')
      .select('*')
      .order('changed_at', { ascending: false });
    
    if (orderId) {
      query = query.eq('order_id', orderId);
    }
    
    return query;
  },
};

// Print Logs API через Supabase
export const printLogsAPI = {
  getAll: () => {
    return supabase
      .from('print_logs')
      .select('*')
      .order('started_at', { ascending: false });
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
  supabase
};

export default API;