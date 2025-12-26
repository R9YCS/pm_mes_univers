import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { db } from "./db.tsx";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware для проверки авторизации
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
};

// Health check endpoint
app.get("/make-server-ff36f543/health", (c) => {
  return c.json({ status: "ok" });
});

// ========== AUTH ENDPOINTS ==========

// Регистрация нового пользователя
app.post("/make-server-ff36f543/auth/signup", async (c) => {
  try {
    const { email, password, full_name, type = 'employee' } = await c.req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Создаем пользователя в Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Автоматически подтверждаем email
      user_metadata: { full_name, type }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Создаем запись в таблице persons
    const person = await db.createPerson({
      type,
      full_name,
      email,
      is_active: true
    });

    return c.json({ user: authData.user, person });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Вход пользователя
app.post("/make-server-ff36f543/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Signin error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== PERSONS ENDPOINTS ==========

app.get("/make-server-ff36f543/persons", requireAuth, async (c) => {
  try {
    const type = c.req.query('type');
    const data = await db.getPersons(type);
    return c.json(data);
  } catch (error) {
    console.error('Get persons error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get("/make-server-ff36f543/persons/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const data = await db.getPersonById(id);
    return c.json(data);
  } catch (error) {
    console.error('Get person error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post("/make-server-ff36f543/persons", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const data = await db.createPerson(body);
    return c.json(data);
  } catch (error) {
    console.error('Create person error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put("/make-server-ff36f543/persons/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const data = await db.updatePerson(id, body);
    return c.json(data);
  } catch (error) {
    console.error('Update person error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== PRINTERS ENDPOINTS ==========

app.get("/make-server-ff36f543/printers", requireAuth, async (c) => {
  try {
    const data = await db.getPrinters();
    return c.json(data);
  } catch (error) {
    console.error('Get printers error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put("/make-server-ff36f543/printers/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const data = await db.updatePrinter(id, body);
    return c.json(data);
  } catch (error) {
    console.error('Update printer error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== ORDER STATUSES ENDPOINTS ==========

app.get("/make-server-ff36f543/order-statuses", requireAuth, async (c) => {
  try {
    const data = await db.getOrderStatuses();
    return c.json(data);
  } catch (error) {
    console.error('Get order statuses error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== MATERIALS ENDPOINTS ==========

app.get("/make-server-ff36f543/materials", requireAuth, async (c) => {
  try {
    const data = await db.getMaterials();
    return c.json(data);
  } catch (error) {
    console.error('Get materials error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post("/make-server-ff36f543/materials", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data, error } = await supabase
      .from('mes_minimal.materials')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    return c.json(data);
  } catch (error) {
    console.error('Create material error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put("/make-server-ff36f543/materials/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data, error } = await supabase
      .from('mes_minimal.materials')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return c.json(data);
  } catch (error) {
    console.error('Update material error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== PRINTERS CREATE ENDPOINT ==========

app.post("/make-server-ff36f543/printers", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data, error } = await supabase
      .from('mes_minimal.printers')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    return c.json(data);
  } catch (error) {
    console.error('Create printer error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== PRINT LOGS CREATE ENDPOINT ==========

app.post("/make-server-ff36f543/print-logs", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data, error } = await supabase
      .from('mes_minimal.print_logs')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    return c.json(data);
  } catch (error) {
    console.error('Create print log error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== ORDERS ENDPOINTS ==========

app.get("/make-server-ff36f543/orders", requireAuth, async (c) => {
  try {
    const data = await db.getOrders();
    return c.json(data);
  } catch (error) {
    console.error('Get orders error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get("/make-server-ff36f543/orders/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const data = await db.getOrderById(id);
    return c.json(data);
  } catch (error) {
    console.error('Get order error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post("/make-server-ff36f543/orders", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const data = await db.createOrder(body);
    return c.json(data);
  } catch (error) {
    console.error('Create order error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put("/make-server-ff36f543/orders/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const data = await db.updateOrder(id, body);
    return c.json(data);
  } catch (error) {
    console.error('Update order error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== ORDER HISTORY ENDPOINTS ==========

app.get("/make-server-ff36f543/order-history", requireAuth, async (c) => {
  try {
    const orderId = c.req.query('order_id');
    const data = await db.getOrderHistory(orderId ? parseInt(orderId) : undefined);
    return c.json(data);
  } catch (error) {
    console.error('Get order history error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== PRINT LOGS ENDPOINTS ==========

app.get("/make-server-ff36f543/print-logs", requireAuth, async (c) => {
  try {
    const data = await db.getPrintLogs();
    return c.json(data);
  } catch (error) {
    console.error('Get print logs error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========== VIEWS ENDPOINTS ==========

app.get("/make-server-ff36f543/kanban-view", requireAuth, async (c) => {
  try {
    const data = await db.getKanbanView();
    return c.json(data);
  } catch (error) {
    console.error('Get kanban view error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get("/make-server-ff36f543/printers-view", requireAuth, async (c) => {
  try {
    const data = await db.getPrintersView();
    return c.json(data);
  } catch (error) {
    console.error('Get printers view error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get("/make-server-ff36f543/clients-view", requireAuth, async (c) => {
  try {
    const data = await db.getClientsView();
    return c.json(data);
  } catch (error) {
    console.error('Get clients view error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);