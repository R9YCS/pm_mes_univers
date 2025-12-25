import { createClient } from 'jsr:@supabase/supabase-js@2';

// Создаем клиент Supabase для работы с БД
export const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// Типы данных
export interface Person {
  id: number;
  type: string;
  full_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  position?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Printer {
  id: number;
  name: string;
  model?: string;
  status: string;
  current_task_id?: number;
  total_hours: number;
  last_maintenance?: string;
  is_active: boolean;
  location?: string;
  tech_notes?: string;
}

export interface OrderStatus {
  id: number;
  name: string;
  code: string;
  sort_order: number;
  color: string;
  is_final: boolean;
}

export interface Material {
  id: number;
  name: string;
  type: string;
  color?: string;
  available_quantity: number;
  price_per_kg?: number;
  min_stock: number;
  is_available: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  client_id: number;
  status_id: number;
  name?: string;
  description?: string;
  priority: number;
  urgency: string;
  material_id?: number;
  infill_percentage: number;
  with_supports: boolean;
  printer_id?: number;
  assigned_to?: number;
  estimated_weight?: number;
  estimated_time?: number;
  estimated_cost?: number;
  actual_cost?: number;
  created_at: string;
  deadline?: string;
  started_at?: string;
  completed_at?: string;
  file_path?: string;
  notes?: string;
}

export interface PrintLog {
  id: number;
  order_id: number;
  printer_id: number;
  operator_id?: number;
  material_used?: number;
  print_time?: number;
  success: boolean;
  issues?: string;
  started_at: string;
  completed_at?: string;
  notes?: string;
}

export interface OrderHistory {
  id: number;
  order_id: number;
  old_status_id?: number;
  new_status_id: number;
  changed_by?: number;
  changed_at: string;
  notes?: string;
}

// Функции для работы с данными
export const db = {
  // Persons (клиенты и сотрудники)
  async getPersons(type?: string) {
    const supabase = getSupabaseClient();
    let query = supabase.from('mes_minimal.persons').select('*');
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getPersonById(id: number) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.persons')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createPerson(person: Partial<Person>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.persons')
      .insert(person)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePerson(id: number, updates: Partial<Person>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.persons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Printers
  async getPrinters() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.printers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async updatePrinter(id: number, updates: Partial<Printer>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.printers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Order Statuses
  async getOrderStatuses() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.order_statuses')
      .select('*')
      .order('sort_order');
    
    if (error) throw error;
    return data;
  },

  // Materials
  async getMaterials() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.materials')
      .select('*')
      .eq('is_available', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Orders
  async getOrders() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.orders')
      .select(`
        *,
        client:mes_minimal.persons!client_id(*),
        status:mes_minimal.order_statuses!status_id(*),
        material:mes_minimal.materials!material_id(*),
        printer:mes_minimal.printers!printer_id(*),
        operator:mes_minimal.persons!assigned_to(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getOrderById(id: number) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.orders')
      .select(`
        *,
        client:mes_minimal.persons!client_id(*),
        status:mes_minimal.order_statuses!status_id(*),
        material:mes_minimal.materials!material_id(*),
        printer:mes_minimal.printers!printer_id(*),
        operator:mes_minimal.persons!assigned_to(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createOrder(order: Partial<Order>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.orders')
      .insert(order)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateOrder(id: number, updates: Partial<Order>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Order History
  async getOrderHistory(orderId?: number) {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('mes_minimal.order_history')
      .select(`
        *,
        order:mes_minimal.orders!order_id(*),
        old_status:mes_minimal.order_statuses!old_status_id(*),
        new_status:mes_minimal.order_statuses!new_status_id(*),
        changed_by_person:mes_minimal.persons!changed_by(*)
      `)
      .order('changed_at', { ascending: false });
    
    if (orderId) {
      query = query.eq('order_id', orderId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Print Logs
  async getPrintLogs() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.print_logs')
      .select(`
        *,
        order:mes_minimal.orders!order_id(*),
        printer:mes_minimal.printers!printer_id(*),
        operator:mes_minimal.persons!operator_id(*)
      `)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Kanban View
  async getKanbanView() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.kanban_view')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Printers View
  async getPrintersView() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.printers_view')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Clients View
  async getClientsView() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('mes_minimal.clients_view')
      .select('*');
    
    if (error) throw error;
    return data;
  }
};
