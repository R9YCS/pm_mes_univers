import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Order, OrderStatus, Priority } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, Search, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onCreateOrder: (order: Omit<Order, 'id'>) => void;
  clients: Array<{ id: string; name: string }>;
  printers: Array<{ id: string; name: string }>;
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-blue-100 border-blue-300' },
  printing: { label: 'В работе (3D-печать)', color: 'bg-yellow-100 border-yellow-300' },
  postprocessing: { label: 'Постобработка', color: 'bg-purple-100 border-purple-300' },
  ready: { label: 'Готов к выдаче', color: 'bg-green-100 border-green-300' },
  completed: { label: 'Выполнен', color: 'bg-gray-100 border-gray-300' }
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Низкая', color: 'bg-gray-500' },
  medium: { label: 'Средняя', color: 'bg-blue-500' },
  high: { label: 'Высокая', color: 'bg-orange-500' },
  urgent: { label: 'Срочная', color: 'bg-red-500' }
};

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  printers: Array<{ id: string; name: string }>;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange, printers }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'order',
    item: { id: order.id, currentStatus: order.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const printerName = order.printerId 
    ? printers.find(p => p.id === order.printerId)?.name 
    : null;

  return (
    <div
      ref={drag}
      className={`p-4 bg-white border rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-600">{order.orderNumber}</span>
        <div className={`w-3 h-3 rounded-full ${priorityConfig[order.priority].color}`} 
             title={priorityConfig[order.priority].label} />
      </div>
      
      <h4 className="mb-1">{order.clientName}</h4>
      <p className="text-sm text-gray-600 mb-2">{order.modelName}</p>
      
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Calendar className="w-4 h-4" />
        <span>{new Date(order.deadline).toLocaleDateString('ru-RU')}</span>
      </div>

      {printerName && (
        <div className="mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
          {printerName}
        </div>
      )}
    </div>
  );
};

interface ColumnProps {
  status: OrderStatus;
  orders: Order[];
  onDrop: (orderId: string, newStatus: OrderStatus) => void;
  printers: Array<{ id: string; name: string }>;
}

const Column: React.FC<ColumnProps> = ({ status, orders, onDrop, printers }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'order',
    drop: (item: { id: string; currentStatus: OrderStatus }) => {
      if (item.currentStatus !== status) {
        onDrop(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-[280px] p-4 rounded-lg ${statusConfig[status].color} ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="mb-4">
        <h3 className="mb-1">{statusConfig[status].label}</h3>
        <span className="text-sm text-gray-600">{orders.length} заказов</span>
      </div>
      
      <div className="space-y-3">
        {orders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onStatusChange={onDrop}
            printers={printers}
          />
        ))}
      </div>
    </div>
  );
};

const NewOrderDialog: React.FC<{
  clients: Array<{ id: string; name: string }>;
  printers: Array<{ id: string; name: string }>;
  onCreateOrder: (order: Omit<Order, 'id'>) => void;
}> = ({ clients, printers, onCreateOrder }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    modelName: '',
    priority: 'medium' as Priority,
    deadline: '',
    material: '',
    color: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.modelName || !formData.deadline) {
      toast.error('Заполните обязательные поля');
      return;
    }

    const client = clients.find(c => c.id === formData.clientId);
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    onCreateOrder({
      orderNumber,
      clientId: formData.clientId,
      clientName: client?.name || '',
      status: 'new',
      priority: formData.priority,
      modelName: formData.modelName,
      deadline: formData.deadline,
      material: formData.material || undefined,
      color: formData.color || undefined,
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    });

    toast.success('Заказ успешно создан');
    setOpen(false);
    setFormData({
      clientId: '',
      modelName: '',
      priority: 'medium',
      deadline: '',
      material: '',
      color: '',
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Новый заказ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание нового заказа</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Клиент *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select value={formData.priority} onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelName">Название модели *</Label>
            <Input 
              id="modelName"
              value={formData.modelName}
              onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              placeholder="Название модели или детали"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Срок сдачи *</Label>
              <Input 
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Материал</Label>
              <Input 
                id="material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="PLA, ABS, Resin..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Цвет</Label>
              <Input 
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Черный, Белый..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea 
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительные требования и комментарии"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">
              Создать заказ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  orders, 
  onUpdateOrder, 
  onCreateOrder,
  clients,
  printers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const handleDrop = (orderId: string, newStatus: OrderStatus) => {
    onUpdateOrder(orderId, { status: newStatus });
    toast.success('Статус заказа обновлен');
  };

  // Фильтрация заказов
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.modelName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statuses: OrderStatus[] = ['new', 'printing', 'postprocessing', 'ready', 'completed'];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Фильтры и действия */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по номеру, клиенту, модели..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все приоритеты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <NewOrderDialog 
            clients={clients} 
            printers={printers}
            onCreateOrder={onCreateOrder}
          />
        </div>

        {/* Kanban доска */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map(status => (
            <Column
              key={status}
              status={status}
              orders={filteredOrders.filter(order => order.status === status)}
              onDrop={handleDrop}
              printers={printers}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};
