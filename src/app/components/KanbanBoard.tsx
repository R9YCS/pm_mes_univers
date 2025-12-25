import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  orders: any[];
  onUpdateOrder: (orderId: number, updates: any) => void;
  onCreateOrder: (order: any) => void;
  clients: any[];
  printers: any[];
  statuses: any[];
  materials: any[];
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Низкая', color: 'bg-gray-500' },
  normal: { label: 'Средняя', color: 'bg-blue-500' },
  high: { label: 'Высокая', color: 'bg-orange-500' },
  critical: { label: 'Критическая', color: 'bg-red-500' }
};

interface OrderCardProps {
  order: any;
  onStatusChange: (orderId: number, newStatusId: number) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'order',
    item: { id: order.id, currentStatusId: order.status_id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const getClientName = () => {
    // Проверяем все возможные варианты структуры данных
    if (order.client_full_name) return order.client_full_name;
    if (order.client_company) return order.client_company;
    if (order.client?.full_name) return order.client.full_name;
    if (order.client?.company_name) return order.client.company_name;
    return 'Неизвестный клиент';
  };
  
  const clientName = getClientName();
  const printerName = order.printer?.name;
  const urgency = order.urgency || 'normal';

  return (
    <div
      ref={drag}
      className={`p-4 bg-white border rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-600">{order.order_number}</span>
        <div 
          className={`w-3 h-3 rounded-full ${urgencyConfig[urgency].color}`} 
          title={urgencyConfig[urgency].label} 
        />
      </div>
      
      <h4 className="mb-1">{clientName}</h4>
      <p className="text-sm text-gray-600 mb-2">{order.name || 'Без названия'}</p>
      
      {order.deadline && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar className="w-4 h-4" />
          <span>{new Date(order.deadline).toLocaleDateString('ru-RU')}</span>
        </div>
      )}

      {printerName && (
        <div className="mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
          {printerName}
        </div>
      )}

      {order.material && (
        <div className="mt-2 text-xs text-gray-500">
          {order.material.name}
        </div>
      )}
    </div>
  );
};

interface ColumnProps {
  status: any;
  orders: any[];
  onDrop: (orderId: number, newStatusId: number) => void;
}

const Column: React.FC<ColumnProps> = ({ status, orders, onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'order',
    drop: (item: { id: number; currentStatusId: number }) => {
      if (item.currentStatusId !== status.id) {
        onDrop(item.id, status.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  const bgColor = status.color ? `#${status.color.replace('#', '')}20` : '#f3f4f6';
  const borderColor = status.color || '#d1d5db';

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-[280px] p-4 rounded-lg border-2 ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ 
        backgroundColor: bgColor,
        borderColor: borderColor
      }}
    >
      <div className="mb-4">
        <h3 className="mb-1">{status.name}</h3>
        <span className="text-sm text-gray-600">{orders.length} заказов</span>
      </div>
      
      <div className="space-y-3">
        {orders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onStatusChange={onDrop}
          />
        ))}
      </div>
    </div>
  );
};

const NewOrderDialog: React.FC<{
  clients: any[];
  printers: any[];
  materials: any[];
  statuses: any[];
  onCreateOrder: (order: any) => void;
}> = ({ clients, printers, materials, statuses, onCreateOrder }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    description: '',
    priority: 3,
    urgency: 'normal',
    material_id: '',
    deadline: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.name) {
      toast.error('Заполните обязательные поля');
      return;
    }

    const newStatusId = statuses.find(s => s.code === 'new')?.id || statuses[0]?.id;

    onCreateOrder({
      client_id: parseInt(formData.client_id),
      status_id: newStatusId,
      name: formData.name,
      description: formData.description || undefined,
      priority: formData.priority,
      urgency: formData.urgency,
      material_id: formData.material_id ? parseInt(formData.material_id) : undefined,
      deadline: formData.deadline || undefined,
      notes: formData.notes || undefined
    });

    setOpen(false);
    setFormData({
      client_id: '',
      name: '',
      description: '',
      priority: 3,
      urgency: 'normal',
      material_id: '',
      deadline: '',
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Новый заказ
      </Button>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание нового заказа</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="client">Клиент *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.full_name || client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Название заказа *</Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Корпус устройства"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Детальное описание заказа"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет (1-5)</Label>
              <Input 
                id="priority"
                type="number"
                min="1"
                max="5"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 3 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Срочность</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(urgencyConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Материал</Label>
              <Select value={formData.material_id} onValueChange={(value) => setFormData({ ...formData, material_id: value })}>
                <SelectTrigger id="material">
                  <SelectValue placeholder="Выберите материал" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(material => (
                    <SelectItem key={material.id} value={String(material.id)}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Срок сдачи</Label>
              <Input 
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea 
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительные требования"
                rows={2}
              />
            </div>
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
  printers,
  statuses,
  materials
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  const handleDrop = (orderId: number, newStatusId: number) => {
    onUpdateOrder(orderId, { status_id: newStatusId });
  };

  // Фильтрация заказов
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || String(order.status_id) === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || order.urgency === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Фильтры и действия */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по номеру, клиенту, названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status.id} value={String(status.id)}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все срочности" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все срочности</SelectItem>
                {Object.entries(urgencyConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <NewOrderDialog 
            clients={clients} 
            printers={printers}
            materials={materials}
            statuses={statuses}
            onCreateOrder={onCreateOrder}
          />
        </div>

        {/* Kanban доска */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(status => (
              <Column
                key={status.id}
                status={status}
                orders={filteredOrders.filter(order => order.status_id === status.id)}
                onDrop={handleDrop}
              />
            ))}
        </div>
      </div>
    </DndProvider>
  );
};
