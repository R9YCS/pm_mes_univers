import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Printer as PrinterIcon, AlertCircle, CheckCircle, Clock, Wrench, Plus, Play, Square, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { printersAPI, ordersAPI, materialsAPI, printLogsAPI } from '../lib/api';

interface PrintersMonitorProps {
  printers: any[];
  orders: any[];
  materials: any[];
  onUpdatePrinter: (printerId: number, updates: any) => void;
  onUpdateOrder: (orderId: number, updates: any) => void;
  onRefresh: () => void;
}

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  idle: { 
    label: 'Простой', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Clock className="w-5 h-5 text-gray-600" />
  },
  printing: {
    label: 'Печать',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: <PrinterIcon className="w-5 h-5 text-blue-600" />
  },
  error: { 
    label: 'Ошибка', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50 border-red-200',
    icon: <AlertCircle className="w-5 h-5 text-red-600" />
  },
  maintenance: { 
    label: 'Обслуживание', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50 border-orange-200',
    icon: <Wrench className="w-5 h-5 text-orange-600" />
  },
  offline: {
    label: 'Отключен',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 border-gray-300',
    icon: <AlertCircle className="w-5 h-5 text-gray-500" />
  }
};

interface PrinterCardProps {
  printer: any;
  currentOrder?: any;
  onEdit: (printer: any) => void;
  onAssignTask: (printer: any) => void;
  onCompleteTask: (printer: any, order: any) => void;
}

const PrinterCard: React.FC<PrinterCardProps> = ({ printer, currentOrder, onEdit, onAssignTask, onCompleteTask }) => {
  const config = statusConfig[printer.status] || statusConfig.idle;
  
  const canAssignTask = printer.status === 'idle';
  const canCompleteTask = printer.status === 'printing' && currentOrder;
  
  return (
    <div className={`p-6 border-2 rounded-lg ${config.bgColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <PrinterIcon className="w-6 h-6 text-gray-700" />
          <div>
            <h3 className="mb-0.5">{printer.name}</h3>
            <p className="text-sm text-gray-600">{printer.model || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config.icon}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(printer)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <span className={`text-sm ${config.color}`}>{config.label}</span>
        </div>

        {currentOrder && (
          <div className="space-y-2 p-3 bg-white rounded border">
            <p className="text-sm">
              <span className="text-gray-600">Заказ:</span> {currentOrder.order_number}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Название:</span> {currentOrder.name}
            </p>
            {currentOrder.estimated_time && (
              <p className="text-sm">
                <span className="text-gray-600">Время:</span> {currentOrder.estimated_time} мин
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 space-y-1">
          {printer.total_hours > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Всего часов</span>
              <span>{printer.total_hours.toFixed(1)} ч</span>
            </div>
          )}
          {printer.last_maintenance && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Последнее ТО</span>
              <span>{new Date(printer.last_maintenance).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
          {printer.location && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Расположение</span>
              <span>{printer.location}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3">
          {canAssignTask && (
            <Button 
              className="w-full gap-2" 
              onClick={() => onAssignTask(printer)}
            >
              <Play className="w-4 h-4" />
              Назначить задание
            </Button>
          )}
          {canCompleteTask && (
            <Button 
              className="w-full gap-2" 
              variant="default"
              onClick={() => onCompleteTask(printer, currentOrder)}
            >
              <Square className="w-4 h-4" />
              Завершить задание
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Диалог добавления/редактирования принтера
const PrinterDialog: React.FC<{
  printer: any | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isNew?: boolean;
}> = ({ printer, open, onClose, onSave, isNew = false }) => {
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (printer) {
      setFormData(printer);
    } else if (isNew) {
      setFormData({
        name: '',
        model: '',
        status: 'idle',
        location: '',
        last_maintenance: '',
        tech_notes: ''
      });
    }
  }, [printer, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Укажите название принтера');
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Добавление принтера' : `Редактирование: ${printer?.name}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input 
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Printer-01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Модель</Label>
            <Input 
              id="model"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Creality Ender 3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Расположение</Label>
            <Input 
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Цех 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance">Дата последнего ТО</Label>
            <Input 
              id="maintenance"
              type="date"
              value={formData.last_maintenance || ''}
              onChange={(e) => setFormData({ ...formData, last_maintenance: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Технические заметки</Label>
            <Textarea 
              id="notes"
              value={formData.tech_notes || ''}
              onChange={(e) => setFormData({ ...formData, tech_notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              {isNew ? 'Добавить' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Диалог назначения задания
const AssignTaskDialog: React.FC<{
  printer: any | null;
  orders: any[];
  open: boolean;
  onClose: () => void;
  onAssign: (orderId: number) => void;
}> = ({ printer, orders, open, onClose, onAssign }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Фильтруем заказы: статус "Подтвержден" или другие готовые к печати
  const availableOrders = orders.filter(order => {
    const status = order.status?.code || '';
    return status === 'confirmed' || status === 'new';
  });

  const filteredOrders = availableOrders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUrgency = urgencyFilter === 'all' || order.urgency === urgencyFilter;
    const matchesPriority = priorityFilter === 'all' || String(order.priority) === priorityFilter;

    return matchesSearch && matchesUrgency && matchesPriority;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Назначить задание на {printer?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Фильтры */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Поиск заказа..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Срочность" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="low">Низкая</SelectItem>
                <SelectItem value="normal">Средняя</SelectItem>
                <SelectItem value="high">Высокая</SelectItem>
                <SelectItem value="critical">Критическая</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Список заказов */}
          <div className="border rounded-lg overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Срочность</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Нет доступных заказов
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.name || '—'}</TableCell>
                      <TableCell>{order.client?.full_name || order.client?.company_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={order.urgency === 'critical' || order.urgency === 'high' ? 'destructive' : 'secondary'}>
                          {order.urgency || 'normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.priority || 3}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm"
                          onClick={() => {
                            onAssign(order.id);
                            onClose();
                          }}
                        >
                          Назначить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Диалог завершения задания
const CompleteTaskDialog: React.FC<{
  printer: any | null;
  order: any | null;
  materials: any[];
  open: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}> = ({ printer, order, materials, open, onClose, onComplete }) => {
  const [formData, setFormData] = useState({
    success: true,
    actual_time: order?.estimated_time || 0,
    material_used: order?.estimated_weight || 0,
    material_id: order?.material_id || '',
    issues: '',
    notes: ''
  });

  React.useEffect(() => {
    if (order) {
      setFormData({
        success: true,
        actual_time: order.estimated_time || 0,
        material_used: order.estimated_weight || 0,
        material_id: order.material_id || '',
        issues: '',
        notes: ''
      });
    }
  }, [order]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Завершение задания</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded border">
            <p className="text-sm"><span className="text-gray-600">Принтер:</span> {printer?.name}</p>
            <p className="text-sm"><span className="text-gray-600">Заказ:</span> {order?.order_number}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="success">Результат печати</Label>
            <Select 
              value={formData.success ? 'true' : 'false'} 
              onValueChange={(value) => setFormData({ ...formData, success: value === 'true' })}
            >
              <SelectTrigger id="success">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Успешно</SelectItem>
                <SelectItem value="false">С ошибками</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual_time">Фактическое время (мин)</Label>
              <Input 
                id="actual_time"
                type="number"
                value={formData.actual_time}
                onChange={(e) => setFormData({ ...formData, actual_time: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_used">Использовано материала (г)</Label>
              <Input 
                id="material_used"
                type="number"
                step="0.1"
                value={formData.material_used}
                onChange={(e) => setFormData({ ...formData, material_used: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Материал</Label>
            <Select 
              value={String(formData.material_id)} 
              onValueChange={(value) => setFormData({ ...formData, material_id: parseInt(value) })}
            >
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

          {!formData.success && (
            <div className="space-y-2">
              <Label htmlFor="issues">Описание проблем</Label>
              <Textarea 
                id="issues"
                value={formData.issues}
                onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea 
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              Завершить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const PrintersMonitor: React.FC<PrintersMonitorProps> = ({ 
  printers, 
  orders,
  materials,
  onUpdatePrinter,
  onUpdateOrder,
  onRefresh
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPrinter, setEditingPrinter] = useState<any | null>(null);
  const [showNewPrinter, setShowNewPrinter] = useState(false);
  const [assigningPrinter, setAssigningPrinter] = useState<any | null>(null);
  const [completingTask, setCompletingTask] = useState<{ printer: any; order: any } | null>(null);

  const filteredPrinters = printers.filter(printer => 
    statusFilter === 'all' || printer.status === statusFilter
  );

  const stats = {
    total: printers.length,
    working: printers.filter(p => p.status === 'printing').length,
    idle: printers.filter(p => p.status === 'idle').length,
    error: printers.filter(p => p.status === 'error').length,
    maintenance: printers.filter(p => p.status === 'maintenance').length
  };

  const handleCreatePrinter = async (data: any) => {
    try {
      const response = await fetch(`https://${(window as any).SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-ff36f543/printers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to create printer');

      toast.success('Принтер добавлен');
      onRefresh();
    } catch (error) {
      console.error('Create printer error:', error);
      toast.error('Ошибка добавления принтера');
    }
  };

  const handleAssignTask = async (orderId: number) => {
    if (!assigningPrinter) return;

    try {
      const printingStatusId = orders.find(o => o.id === orderId)?.status_id;
      const printingStatus = await fetch(`https://${(window as any).SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-ff36f543/order-statuses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      }).then(r => r.json()).then(statuses => statuses.find((s: any) => s.code === 'printing'));

      // Обновляем принтер
      await onUpdatePrinter(assigningPrinter.id, {
        status: 'printing',
        current_task_id: orderId
      });

      // Обновляем заказ
      await onUpdateOrder(orderId, {
        status_id: printingStatus.id,
        printer_id: assigningPrinter.id,
        started_at: new Date().toISOString()
      });

      toast.success('Задание назначено');
      onRefresh();
    } catch (error) {
      console.error('Assign task error:', error);
      toast.error('Ошибка назначения задания');
    }
  };

  const handleCompleteTask = async (data: any) => {
    if (!completingTask) return;

    const { printer, order } = completingTask;

    try {
      // Получаем статус "Постобработка"
      const postprocessingStatus = await fetch(`https://${(window as any).SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-ff36f543/order-statuses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      }).then(r => r.json()).then(statuses => statuses.find((s: any) => s.code === 'postprocessing'));

      // Вычисляем добавочные часы
      const addHours = (data.actual_time / 60) || 0;

      // Обновляем принтер
      await onUpdatePrinter(printer.id, {
        status: 'idle',
        current_task_id: null,
        total_hours: (printer.total_hours || 0) + addHours
      });

      // Обновляем заказ
      await onUpdateOrder(order.id, {
        status_id: postprocessingStatus.id,
        printer_id: null,
        completed_at: new Date().toISOString(),
        actual_cost: order.estimated_cost
      });

      // Вычитаем материал из склада
      if (data.material_id && data.material_used) {
        const material = materials.find(m => m.id === data.material_id);
        if (material) {
          await materialsAPI.update(data.material_id, {
            available_quantity: Math.max(0, material.available_quantity - data.material_used)
          });
        }
      }

      // Создаем лог печати
      await fetch(`https://${(window as any).SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-ff36f543/print-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          order_id: order.id,
          printer_id: printer.id,
          material_used: data.material_used,
          print_time: data.actual_time,
          success: data.success,
          issues: data.issues,
          started_at: order.started_at,
          completed_at: new Date().toISOString(),
          notes: data.notes
        })
      });

      toast.success('Задание завершено');
      onRefresh();
    } catch (error) {
      console.error('Complete task error:', error);
      toast.error('Ошибка завершения задания');
    }
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white border rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Всего принтеров</p>
          <p className="text-2xl">{stats.total}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-1">Печатают</p>
          <p className="text-2xl text-blue-700">{stats.working}</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">Простой</p>
          <p className="text-2xl text-gray-700">{stats.idle}</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 mb-1">Ошибка</p>
          <p className="text-2xl text-red-700">{stats.error}</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 mb-1">Обслуживание</p>
          <p className="text-2xl text-orange-700">{stats.maintenance}</p>
        </div>
      </div>

      {/* Фильтры и действия */}
      <div className="flex items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="gap-2" onClick={() => setShowNewPrinter(true)}>
          <Plus className="w-4 h-4" />
          Добавить принтер
        </Button>
      </div>

      {/* Сетка принтеров */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrinters.map(printer => {
          const currentOrder = printer.current_task_id 
            ? orders.find(o => o.id === printer.current_task_id)
            : undefined;
          
          return (
            <PrinterCard
              key={printer.id}
              printer={printer}
              currentOrder={currentOrder}
              onEdit={setEditingPrinter}
              onAssignTask={setAssigningPrinter}
              onCompleteTask={(printer, order) => setCompletingTask({ printer, order })}
            />
          );
        })}
      </div>

      {/* Диалоги */}
      <PrinterDialog
        printer={editingPrinter}
        open={!!editingPrinter}
        onClose={() => setEditingPrinter(null)}
        onSave={(data) => onUpdatePrinter(editingPrinter.id, data)}
      />

      <PrinterDialog
        printer={null}
        open={showNewPrinter}
        onClose={() => setShowNewPrinter(false)}
        onSave={handleCreatePrinter}
        isNew
      />

      <AssignTaskDialog
        printer={assigningPrinter}
        orders={orders}
        open={!!assigningPrinter}
        onClose={() => setAssigningPrinter(null)}
        onAssign={handleAssignTask}
      />

      <CompleteTaskDialog
        printer={completingTask?.printer}
        order={completingTask?.order}
        materials={materials}
        open={!!completingTask}
        onClose={() => setCompletingTask(null)}
        onComplete={handleCompleteTask}
      />
    </div>
  );
};
