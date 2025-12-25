// Mock данные для демонстрации системы

export type OrderStatus = 'new' | 'printing' | 'postprocessing' | 'ready' | 'completed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type PrinterStatus = 'working' | 'idle' | 'error' | 'maintenance';
export type ClientType = 'individual' | 'company';

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  status: OrderStatus;
  priority: Priority;
  modelName: string;
  deadline: string;
  printerId?: string;
  material?: string;
  color?: string;
  createdAt: string;
  notes?: string;
}

export interface Printer {
  id: string;
  name: string;
  model: string;
  status: PrinterStatus;
  currentOrderId?: string;
  progress: number;
  lastMaintenance: string;
  type: string;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  phone: string;
  email: string;
  completedOrders: number;
  lastOrderDate: string;
  preferredMaterials?: string[];
  preferredColors?: string[];
  notes?: string;
}

// Mock заказы
export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    clientId: '1',
    clientName: 'ООО "ТехноПринт"',
    status: 'new',
    priority: 'high',
    modelName: 'Корпус для электроники',
    deadline: '2025-12-28',
    material: 'ABS',
    color: 'Черный',
    createdAt: '2025-12-24',
    notes: 'Требуется высокая точность'
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    clientId: '2',
    clientName: 'Иванов Петр',
    status: 'printing',
    priority: 'medium',
    modelName: 'Прототип детали №45',
    deadline: '2025-12-27',
    printerId: '1',
    material: 'PLA',
    color: 'Белый',
    createdAt: '2025-12-23'
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    clientId: '3',
    clientName: 'Сидорова Анна',
    status: 'printing',
    priority: 'urgent',
    modelName: 'Архитектурный макет',
    deadline: '2025-12-26',
    printerId: '2',
    material: 'Resin',
    color: 'Серый',
    createdAt: '2025-12-22'
  },
  {
    id: '4',
    orderNumber: 'ORD-2025-004',
    clientId: '4',
    clientName: 'ООО "МедТех"',
    status: 'postprocessing',
    priority: 'high',
    modelName: 'Медицинский инструмент',
    deadline: '2025-12-29',
    material: 'Nylon',
    color: 'Натуральный',
    createdAt: '2025-12-21'
  },
  {
    id: '5',
    orderNumber: 'ORD-2025-005',
    clientId: '5',
    clientName: 'Козлов Максим',
    status: 'ready',
    priority: 'low',
    modelName: 'Фигурка персонажа',
    deadline: '2025-12-30',
    material: 'PLA',
    color: 'Синий',
    createdAt: '2025-12-20'
  },
  {
    id: '6',
    orderNumber: 'ORD-2025-006',
    clientId: '1',
    clientName: 'ООО "ТехноПринт"',
    status: 'completed',
    priority: 'medium',
    modelName: 'Держатель для кабелей',
    deadline: '2025-12-24',
    material: 'PETG',
    color: 'Прозрачный',
    createdAt: '2025-12-19'
  },
  {
    id: '7',
    orderNumber: 'ORD-2025-007',
    clientId: '6',
    clientName: 'ИП Смирнов',
    status: 'new',
    priority: 'medium',
    modelName: 'Запчасть для станка',
    deadline: '2026-01-05',
    material: 'ABS',
    color: 'Черный',
    createdAt: '2025-12-25'
  }
];

// Mock принтеры
export const mockPrinters: Printer[] = [
  {
    id: '1',
    name: 'Printer A1',
    model: 'Prusa i3 MK3S+',
    status: 'working',
    currentOrderId: '2',
    progress: 67,
    lastMaintenance: '2025-12-15',
    type: 'FDM'
  },
  {
    id: '2',
    name: 'Printer A2',
    model: 'Prusa i3 MK3S+',
    status: 'working',
    currentOrderId: '3',
    progress: 45,
    lastMaintenance: '2025-12-10',
    type: 'FDM'
  },
  {
    id: '3',
    name: 'Printer B1',
    model: 'Ultimaker S5',
    status: 'idle',
    progress: 0,
    lastMaintenance: '2025-12-20',
    type: 'FDM'
  },
  {
    id: '4',
    name: 'Printer C1',
    model: 'Formlabs Form 3',
    status: 'maintenance',
    progress: 0,
    lastMaintenance: '2025-11-30',
    type: 'SLA'
  },
  {
    id: '5',
    name: 'Printer D1',
    model: 'Creality Ender 3',
    status: 'error',
    progress: 0,
    lastMaintenance: '2025-12-18',
    type: 'FDM'
  },
  {
    id: '6',
    name: 'Printer E1',
    model: 'Bambu Lab X1 Carbon',
    status: 'idle',
    progress: 0,
    lastMaintenance: '2025-12-22',
    type: 'FDM'
  }
];

// Mock клиенты
export const mockClients: Client[] = [
  {
    id: '1',
    name: 'ООО "ТехноПринт"',
    type: 'company',
    phone: '+7 (495) 123-45-67',
    email: 'info@technoprint.ru',
    completedOrders: 15,
    lastOrderDate: '2025-12-24',
    preferredMaterials: ['ABS', 'PETG'],
    preferredColors: ['Черный', 'Серый'],
    notes: 'Постоянный клиент, требуют быстрой обработки'
  },
  {
    id: '2',
    name: 'Иванов Петр Сергеевич',
    type: 'individual',
    phone: '+7 (916) 234-56-78',
    email: 'petr.ivanov@mail.ru',
    completedOrders: 3,
    lastOrderDate: '2025-12-23',
    preferredMaterials: ['PLA'],
    preferredColors: ['Белый', 'Синий']
  },
  {
    id: '3',
    name: 'Сидорова Анна Михайловна',
    type: 'individual',
    phone: '+7 (903) 345-67-89',
    email: 'anna.sidorova@gmail.com',
    completedOrders: 7,
    lastOrderDate: '2025-12-22',
    preferredMaterials: ['Resin'],
    notes: 'Архитектор, часто заказывает макеты'
  },
  {
    id: '4',
    name: 'ООО "МедТех"',
    type: 'company',
    phone: '+7 (495) 987-65-43',
    email: 'orders@medtech.ru',
    completedOrders: 22,
    lastOrderDate: '2025-12-21',
    preferredMaterials: ['Nylon', 'PETG'],
    notes: 'Медицинские изделия, нужны сертификаты'
  },
  {
    id: '5',
    name: 'Козлов Максим Андреевич',
    type: 'individual',
    phone: '+7 (917) 456-78-90',
    email: 'maxkozlov@yandex.ru',
    completedOrders: 1,
    lastOrderDate: '2025-12-20'
  },
  {
    id: '6',
    name: 'ИП Смирнов Владимир Николаевич',
    type: 'company',
    phone: '+7 (495) 111-22-33',
    email: 'smirnov.ip@bk.ru',
    completedOrders: 9,
    lastOrderDate: '2025-12-25',
    preferredMaterials: ['ABS', 'Nylon'],
    notes: 'Производство запчастей для станков'
  }
];
