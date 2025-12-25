-- Миграция для создания схемы MES-системы 3D-печати в Supabase
-- Выполните этот скрипт в SQL Editor в вашем Supabase проекте

-- Создаем схему
CREATE SCHEMA IF NOT EXISTS mes_minimal;

-- 1. ПЕРСОНЫ (клиенты и сотрудники) - основная таблица
CREATE TABLE IF NOT EXISTS mes_minimal.persons (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL DEFAULT 'client',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ПРИНТЕРЫ (3D принтеры)
CREATE TABLE IF NOT EXISTS mes_minimal.printers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    model VARCHAR(100),
    status VARCHAR(20) DEFAULT 'idle' 
        CHECK (status IN ('idle', 'printing', 'maintenance', 'error', 'offline')),
    current_task_id INTEGER,
    total_hours DECIMAL(10,2) DEFAULT 0,
    last_maintenance DATE,
    is_active BOOLEAN DEFAULT TRUE,
    location VARCHAR(100),
    tech_notes TEXT
);

-- 3. СТАТУСЫ ДЛЯ KANBAN
CREATE TABLE IF NOT EXISTS mes_minimal.order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#808080',
    is_final BOOLEAN DEFAULT FALSE
);

-- Вставляем базовые статусы
INSERT INTO mes_minimal.order_statuses (name, code, sort_order, color) VALUES
('Новый', 'new', 1, '#4CAF50'),
('Подтвержден', 'confirmed', 2, '#2196F3'),
('В печати', 'printing', 3, '#FF5722'),
('Постобработка', 'postprocessing', 4, '#9C27B0'),
('Готов к выдаче', 'ready', 5, '#8BC34A'),
('Выполнен', 'completed', 6, '#607D8B'),
('Отменен', 'cancelled', 7, '#F44336')
ON CONFLICT (code) DO NOTHING;

-- 4. МАТЕРИАЛЫ
CREATE TABLE IF NOT EXISTS mes_minimal.materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    color VARCHAR(50),
    available_quantity DECIMAL(10,3) DEFAULT 0,
    price_per_kg DECIMAL(10,2),
    min_stock DECIMAL(10,3) DEFAULT 1000,
    is_available BOOLEAN DEFAULT TRUE
);

-- 5. ЗАКАЗЫ (основная таблица для Kanban)
CREATE TABLE IF NOT EXISTS mes_minimal.orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES mes_minimal.persons(id),
    status_id INTEGER NOT NULL REFERENCES mes_minimal.order_statuses(id) DEFAULT 1,
    name VARCHAR(255),
    description TEXT,
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    urgency VARCHAR(20) DEFAULT 'normal' 
        CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
    material_id INTEGER REFERENCES mes_minimal.materials(id),
    infill_percentage DECIMAL(5,2) DEFAULT 20,
    with_supports BOOLEAN DEFAULT FALSE,
    printer_id INTEGER REFERENCES mes_minimal.printers(id),
    assigned_to INTEGER REFERENCES mes_minimal.persons(id),
    estimated_weight DECIMAL(10,3),
    estimated_time INTEGER,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    file_path VARCHAR(500),
    notes TEXT
);

-- 6. ЖУРНАЛ ПЕЧАТИ (логирование всех печатей)
CREATE TABLE IF NOT EXISTS mes_minimal.print_logs (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES mes_minimal.orders(id),
    printer_id INTEGER NOT NULL REFERENCES mes_minimal.printers(id),
    operator_id INTEGER REFERENCES mes_minimal.persons(id),
    material_used DECIMAL(10,3),
    print_time INTEGER,
    success BOOLEAN DEFAULT TRUE,
    issues TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    notes TEXT
);

-- 7. ОБСЛУЖИВАНИЕ ПРИНТЕРОВ
CREATE TABLE IF NOT EXISTS mes_minimal.printer_maintenance (
    id SERIAL PRIMARY KEY,
    printer_id INTEGER NOT NULL REFERENCES mes_minimal.printers(id),
    technician_id INTEGER REFERENCES mes_minimal.persons(id),
    type VARCHAR(50) DEFAULT 'routine' 
        CHECK (type IN ('routine', 'repair', 'calibration', 'cleaning')),
    description TEXT NOT NULL,
    actions TEXT,
    hours_spent DECIMAL(5,2),
    parts_cost DECIMAL(10,2),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 8. ИСТОРИЯ СТАТУСОВ ЗАКАЗОВ
CREATE TABLE IF NOT EXISTS mes_minimal.order_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES mes_minimal.orders(id),
    old_status_id INTEGER REFERENCES mes_minimal.order_statuses(id),
    new_status_id INTEGER NOT NULL REFERENCES mes_minimal.order_statuses(id),
    changed_by INTEGER REFERENCES mes_minimal.persons(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- ==================== ИНДЕКСЫ ====================
CREATE INDEX IF NOT EXISTS idx_orders_status ON mes_minimal.orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON mes_minimal.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON mes_minimal.orders(deadline);
CREATE INDEX IF NOT EXISTS idx_orders_printer ON mes_minimal.orders(printer_id);
CREATE INDEX IF NOT EXISTS idx_persons_type ON mes_minimal.persons(type);
CREATE INDEX IF NOT EXISTS idx_persons_active ON mes_minimal.persons(is_active);
CREATE INDEX IF NOT EXISTS idx_printers_status ON mes_minimal.printers(status);
CREATE INDEX IF NOT EXISTS idx_printers_active ON mes_minimal.printers(is_active);
CREATE INDEX IF NOT EXISTS idx_logs_order ON mes_minimal.print_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_logs_printer ON mes_minimal.print_logs(printer_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON mes_minimal.print_logs(started_at);

-- ==================== ФУНКЦИИ ====================

-- Автогенерация номера заказа
CREATE OR REPLACE FUNCTION mes_minimal.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD-' || 
            EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
            LPAD(NEXTVAL('mes_minimal.orders_id_seq')::VARCHAR, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
    BEFORE INSERT ON mes_minimal.orders
    FOR EACH ROW
    EXECUTE FUNCTION mes_minimal.generate_order_number();

-- Автозапись истории изменения статуса
CREATE OR REPLACE FUNCTION mes_minimal.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        INSERT INTO mes_minimal.order_history 
        (order_id, old_status_id, new_status_id, changed_by)
        VALUES 
        (NEW.id, OLD.status_id, NEW.status_id, NEW.assigned_to);
        
        -- Обновляем статус принтера при начале печати
        IF NEW.status_id = (SELECT id FROM mes_minimal.order_statuses WHERE code = 'printing' LIMIT 1) THEN
            UPDATE mes_minimal.printers 
            SET status = 'printing', current_task_id = NEW.id
            WHERE id = NEW.printer_id;
        END IF;
        
        -- Возвращаем принтер в idle при завершении
        IF OLD.status_id = (SELECT id FROM mes_minimal.order_statuses WHERE code = 'printing' LIMIT 1) 
           AND NEW.status_id > OLD.status_id THEN
            UPDATE mes_minimal.printers 
            SET status = 'idle', current_task_id = NULL
            WHERE id = OLD.printer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_status
    AFTER UPDATE OF status_id ON mes_minimal.orders
    FOR EACH ROW
    EXECUTE FUNCTION mes_minimal.log_status_change();

-- ==================== ПРЕДСТАВЛЕНИЯ (VIEWS) ====================

-- Вью для Kanban доски
CREATE OR REPLACE VIEW mes_minimal.kanban_view AS
SELECT 
    o.id,
    o.order_number,
    o.name as order_name,
    o.description,
    o.priority,
    o.urgency,
    o.deadline,
    s.name as status_name,
    s.color as status_color,
    s.sort_order,
    p.full_name as client_name,
    p.company_name,
    pr.name as printer_name,
    m.name as material_name,
    o.estimated_time,
    o.estimated_cost,
    o.created_at,
    o.started_at,
    o.completed_at
FROM mes_minimal.orders o
JOIN mes_minimal.order_statuses s ON o.status_id = s.id
JOIN mes_minimal.persons p ON o.client_id = p.id
LEFT JOIN mes_minimal.printers pr ON o.printer_id = pr.id
LEFT JOIN mes_minimal.materials m ON o.material_id = m.id
ORDER BY s.sort_order, o.priority DESC, o.deadline;

-- Вью для мониторинга принтеров
CREATE OR REPLACE VIEW mes_minimal.printers_view AS
SELECT 
    p.id,
    p.name,
    p.model,
    p.status,
    p.total_hours,
    p.last_maintenance,
    p.location,
    o.order_number as current_order,
    o.name as order_name,
    per.full_name as operator_name
FROM mes_minimal.printers p
LEFT JOIN mes_minimal.orders o ON p.current_task_id = o.id
LEFT JOIN mes_minimal.persons per ON o.assigned_to = per.id
ORDER BY p.status, p.name;

-- Вью для списка клиентов
CREATE OR REPLACE VIEW mes_minimal.clients_view AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.company_name,
    COUNT(o.id) as total_orders,
    MAX(o.created_at) as last_order_date,
    SUM(o.actual_cost) as total_spent
FROM mes_minimal.persons p
LEFT JOIN mes_minimal.orders o ON p.id = o.client_id
WHERE p.type = 'client'
GROUP BY p.id, p.full_name, p.email, p.phone, p.company_name
ORDER BY p.full_name;

-- ==================== ТЕСТОВЫЕ ДАННЫЕ ====================

-- Добавляем тестовых клиентов
INSERT INTO mes_minimal.persons (type, full_name, email, phone, company_name) VALUES
('client', 'Иван Петров', 'ivan@email.com', '+79161234567', 'ООО "ТехноПринт"'),
('client', 'Анна Сидорова', 'anna@email.com', '+79161234568', 'ИП Сидорова'),
('client', 'Петр Иванов', 'petr@email.com', '+79161234569', NULL)
ON CONFLICT (email) DO NOTHING;

-- Добавляем сотрудников
INSERT INTO mes_minimal.persons (type, full_name, email, phone, position) VALUES
('employee', 'Алексей Смирнов', 'alex@company.ru', '+79161234570', 'Оператор'),
('employee', 'Мария Волкова', 'maria@company.ru', '+79161234571', 'Менеджер'),
('admin', 'Дмитрий Орлов', 'admin@company.ru', '+79161234572', 'Администратор')
ON CONFLICT (email) DO NOTHING;

-- Добавляем принтеры
INSERT INTO mes_minimal.printers (name, model, status, location) VALUES
('Printer-01', 'Creality Ender 3', 'idle', 'Цех 1'),
('Printer-02', 'Anycubic Mega S', 'idle', 'Цех 1'),
('Printer-03', 'Prusa i3 MK3S', 'maintenance', 'Цех 2'),
('Printer-04', 'Flashforge Creator Pro', 'idle', 'Цех 2')
ON CONFLICT (name) DO NOTHING;

-- Добавляем материалы
INSERT INTO mes_minimal.materials (name, type, color, available_quantity, price_per_kg) VALUES
('PLA Белый', 'PLA', 'Белый', 5000, 1200),
('PLA Черный', 'PLA', 'Черный', 2500, 1200),
('ABS Серый', 'ABS', 'Серый', 3000, 1800),
('PETG Прозрачный', 'PETG', 'Прозрачный', 1500, 2200)
ON CONFLICT (name) DO NOTHING;

-- Добавляем тестовые заказы
INSERT INTO mes_minimal.orders 
(client_id, status_id, name, priority, urgency, material_id, deadline) 
SELECT 
    (SELECT id FROM mes_minimal.persons WHERE email = 'ivan@email.com' LIMIT 1),
    (SELECT id FROM mes_minimal.order_statuses WHERE code = 'new' LIMIT 1),
    'Корпус устройства',
    2,
    'normal',
    (SELECT id FROM mes_minimal.materials WHERE name = 'PLA Белый' LIMIT 1),
    CURRENT_TIMESTAMP + INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM mes_minimal.orders WHERE name = 'Корпус устройства');

-- Включаем Row Level Security (опционально, для дополнительной безопасности)
-- ALTER TABLE mes_minimal.persons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mes_minimal.printers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mes_minimal.orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mes_minimal.order_statuses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mes_minimal.materials ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mes_minimal.print_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mes_minimal.order_history ENABLE ROW LEVEL SECURITY;

-- Создаем политики доступа (примеры)
-- CREATE POLICY "Allow authenticated users to read all data" ON mes_minimal.orders FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Allow authenticated users to modify data" ON mes_minimal.orders FOR ALL TO authenticated USING (true);
