import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Printer as PrinterIcon, AlertCircle, CheckCircle, Clock, Wrench, Plus, Search, X, ListFilter, Check, Package } from 'lucide-react';
import { toast } from 'sonner';

interface PrintersMonitorProps {
  printers: any[];
  orders: any[];
  materials: any[];
  onUpdatePrinter: (printerId: number, updates: any) => void;
  onAddPrinter: (printerData: any) => void;
  onDeletePrinter: (printerId: number) => void;
  onAssignOrder: (printerId: number, orderId: number) => Promise<void>;
  onCompleteJob: (printerId: number, jobData: any) => Promise<void>;
}

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
  canAssignOrder: boolean;
  canCompleteJob: boolean;
}> = {
  working: { 
    label: 'Работает', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    canAssignOrder: true,
    canCompleteJob: false
  },
  idle: { 
    label: 'Простой', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Clock className="w-5 h-5 text-gray-600" />,
    canAssignOrder: true,
    canCompleteJob: false
  },
  printing: {
    label: 'Печать',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: <PrinterIcon className="w-5 h-5 text-blue-600" />,
    canAssignOrder: false,
    canCompleteJob: true
  },
  error: { 
    label: 'Ошибка', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50 border-red-200',
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    canAssignOrder: false,
    canCompleteJob: false
  },
  maintenance: { 
    label: 'Обслуживание', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50 border-orange-200',
    icon: <Wrench className="w-5 h-5 text-orange-600" />,
    canAssignOrder: false,
    canCompleteJob: false
  },
  offline: {
    label: 'Отключен',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 border-gray-300',
    icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
    canAssignOrder: false,
    canCompleteJob: false
  }
};

interface PrinterCardProps {
  printer: any;
  currentOrder?: any;
  onEdit: (printer: any) => void;
  onDelete: (printerId: number) => void;
  onAssignOrder?: (printer: any) => void;
  onCompleteJob?: (printer: any) => void;
}

const PrinterCard: React.FC<PrinterCardProps> = ({ 
  printer, 
  currentOrder, 
  onEdit, 
  onDelete,
  onAssignOrder,
  onCompleteJob 
}) => {
  const config = statusConfig[printer.status] || statusConfig.idle;
  const progress = printer.status === 'printing' && currentOrder ? 50 : 0;
  
  return (
    <div className={`p-6 border-2 rounded-lg ${config.bgColor} hover:shadow-md transition-shadow`}>
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
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onEdit(printer)}
              title="Редактировать"
            >
              ✏️
            </Button>
            {config.canAssignOrder && onAssignOrder && (
              <Button 
                size="sm"
                variant="default"
                onClick={() => onAssignOrder(printer)}
                title="Назначить задание"
              >
                📝
              </Button>
            )}
            {config.canCompleteJob && onCompleteJob && (
              <Button 
                size="sm"
                variant="success"
                onClick={() => onCompleteJob(printer)}
                title="Завершить задание"
              >
                ✓
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onDelete(printer.id)}
              title="Удалить принтер"
              disabled={printer.status === 'printing'}
            >
              🗑️
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <span className={`text-sm ${config.color}`}>{config.label}</span>
        </div>

        {printer.status === 'printing' && currentOrder && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Прогресс</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600">
              Заказ: {currentOrder.order_number} - {currentOrder.name}
            </p>
            {currentOrder.deadline && (
              <p className="text-xs text-gray-500">
                Срок: {new Date(currentOrder.deadline).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 space-y-2">
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
          {printer.total_hours && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Наработка часов</span>
              <span>{parseFloat(printer.total_hours).toFixed(1)} ч</span>
            </div>
          )}
          {printer.serial_number && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Серийный номер</span>
              <span className="font-mono text-xs">{printer.serial_number}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Диалог добавления нового принтера
const AddPrinterDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (printerData: any) => void;
}> = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    location: '',
    status: 'idle',
    tech_notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.model) {
      toast.error('Заполните обязательные поля');
      return;
    }
    onSave(formData);
    onClose();
    setFormData({
      name: '',
      model: '',
      serial_number: '',
      location: '',
      status: 'idle',
      tech_notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить новый принтер</DialogTitle>
          <DialogDescription>Заполните информацию о принтере</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название принтера *</Label>
            <Input 
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Printer-01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Модель *</Label>
            <Input 
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Creality Ender 3"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial">Серийный номер</Label>
            <Input 
              id="serial"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="SN123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Расположение</Label>
            <Input 
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Цех 1, Стеллаж А"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Начальный статус</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Простой</SelectItem>
                <SelectItem value="offline">Отключен</SelectItem>
                <SelectItem value="maintenance">Обслуживание</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Технические примечания</Label>
            <Textarea 
              id="notes"
              value={formData.tech_notes}
              onChange={(e) => setFormData({ ...formData, tech_notes: e.target.value })}
              placeholder="Особенности настройки, проблемы и т.д."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              Добавить принтер
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Диалог редактирования принтера
const EditPrinterDialog: React.FC<{
  printer: any | null;
  open: boolean;
  onClose: () => void;
  onSave: (printerId: number, updates: any) => void;
}> = ({ printer, open, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (printer) {
      setFormData({
        name: printer.name || '',
        model: printer.model || '',
        serial_number: printer.serial_number || '',
        location: printer.location || '',
        status: printer.status || 'idle',
        tech_notes: printer.tech_notes || '',
        last_maintenance: printer.last_maintenance ? printer.last_maintenance.split('T')[0] : ''
      });
    }
  }, [printer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (printer) {
      onSave(printer.id, formData);
      onClose();
    }
  };

  if (!printer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактирование принтера: {printer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название принтера</Label>
            <Input 
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Модель</Label>
            <Input 
              id="model"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
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
            <Label htmlFor="tech_notes">Технические примечания</Label>
            <Textarea 
              id="tech_notes"
              value={formData.tech_notes || ''}
              onChange={(e) => setFormData({ ...formData, tech_notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Диалог назначения задания на принтер
const AssignJobDialog: React.FC<{
  printer: any | null;
  orders: any[];
  open: boolean;
  onClose: () => void;
  onAssign: (printerId: number, orderId: number) => Promise<void>;
}> = ({ printer, orders, open, onClose, onAssign }) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('2'); // По умолчанию "Подтвержден"
  const [isLoading, setIsLoading] = useState(false);

  // Фильтруем заказы: только те, что можно назначить (статусы 2,3 - Подтвержден, В подготовке)
  const availableOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || String(order.status_id) === statusFilter;
    
    // Проверяем, не назначен ли уже заказ другому принтеру
    const isAlreadyAssigned = order.printer_id;
    
    return matchesSearch && matchesStatus && 
           (order.status_id === 2 || order.status_id === 3) && // Подтвержден или В подготовке
           !isAlreadyAssigned;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !printer) {
      toast.error('Выберите заказ для назначения');
      return;
    }
    
    setIsLoading(true);
    try {
      await onAssign(printer.id, parseInt(selectedOrderId));
      onClose();
      setSelectedOrderId('');
    } catch (error) {
      toast.error('Ошибка при назначении задания');
    } finally {
      setIsLoading(false);
    }
  };

  if (!printer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Назначение задания на принтер: {printer.name}</DialogTitle>
          <DialogDescription>Выберите заказ для печати на этом принтере</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Фильтры */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по номеру, клиенту или названию заказа..."
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
                <SelectItem value="2">Подтвержден</SelectItem>
                <SelectItem value="3">В подготовке</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Список доступных заказов */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h4 className="font-medium">Доступные заказы ({availableOrders.length})</h4>
            </div>
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {availableOrders.map(order => (
                <div 
                  key={order.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedOrderId === String(order.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedOrderId(String(order.id))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{order.order_number}</h5>
                      <p className="text-sm text-gray-600">{order.name || 'Без названия'}</p>
                      <p className="text-sm text-gray-500">
                        Клиент: {order.client?.full_name || order.client?.company_name || 'Неизвестный'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>Приоритет: {order.priority || 3}</span>
                        {order.estimated_weight && <span>Вес: {order.estimated_weight}г</span>}
                        {order.estimated_time && <span>Время: {order.estimated_time}мин</span>}
                        {order.deadline && (
                          <span>Срок: {new Date(order.deadline).toLocaleDateString('ru-RU')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={order.priority <= 2 ? "destructive" : "default"}>
                        Приоритет: {order.priority || 3}
                      </Badge>
                      <div className="mt-2">
                        <Badge variant="outline">
                          {order.status_id === 2 ? 'Подтвержден' : 'В подготовке'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {availableOrders.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Нет доступных заказов для назначения</p>
                  <p className="text-sm mt-2">Все заказы уже назначены или находятся в других статусах</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="pt-4">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedOrderId || isLoading}
              >
                {isLoading ? 'Назначение...' : 'Назначить задание'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Диалог завершения задания
const CompleteJobDialog: React.FC<{
  printer: any | null;
  currentOrder: any | null;
  materials: any[];
  open: boolean;
  onClose: () => void;
  onComplete: (printerId: number, jobData: any) => Promise<void>;
}> = ({ printer, currentOrder, materials, open, onClose, onComplete }) => {
  const [formData, setFormData] = useState({
    actual_time: '',
    material_used: '',
    quality: '3',
    success: true,
    issues: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentOrder) {
      setFormData({
        actual_time: currentOrder.estimated_time?.toString() || '',
        material_used: currentOrder.estimated_weight?.toString() || '',
        quality: '3',
        success: true,
        issues: '',
        notes: ''
      });
    }
  }, [currentOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printer || !currentOrder) return;

    if (!formData.actual_time || !formData.material_used) {
      toast.error('Заполните обязательные поля: время и материал');
      return;
    }

    const jobData = {
      order_id: currentOrder.id,
      actual_time: parseInt(formData.actual_time) || 0,
      material_used: parseFloat(formData.material_used) || 0,
      quality: parseInt(formData.quality),
      success: formData.success,
      issues: formData.issues,
      notes: formData.notes
    };

    setIsLoading(true);
    try {
      await onComplete(printer.id, jobData);
      onClose();
      setFormData({
        actual_time: '',
        material_used: '',
        quality: '3',
        success: true,
        issues: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Ошибка при завершении задания');
    } finally {
      setIsLoading(false);
    }
  };

  if (!printer || !currentOrder) return null;

  const currentMaterial = materials.find(m => m.id === currentOrder.material_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Завершение задания на принтере: {printer.name}</DialogTitle>
          <DialogDescription>
            Завершение печати заказа: {currentOrder.order_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Информация о задании:</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Заказ:</strong> {currentOrder.order_number}</p>
            <p><strong>Название:</strong> {currentOrder.name || 'Без названия'}</p>
            {currentOrder.estimated_time && (
              <p><strong>Плановое время:</strong> {currentOrder.estimated_time} мин</p>
            )}
            {currentOrder.estimated_weight && (
              <p><strong>Плановый вес:</strong> {currentOrder.estimated_weight} г</p>
            )}
            {currentMaterial && (
              <p><strong>Материал:</strong> {currentMaterial.name} {currentMaterial.color && `(${currentMaterial.color})`}</p>
            )}
            {currentOrder.client && (
              <p><strong>Клиент:</strong> {currentOrder.client.full_name || currentOrder.client.company_name}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actual_time">Фактическое время печати (минуты) *</Label>
            <Input 
              id="actual_time"
              type="number"
              min="1"
              value={formData.actual_time}
              onChange={(e) => setFormData({ ...formData, actual_time: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material_used">Использованный материал (граммы) *</Label>
            <Input 
              id="material_used"
              type="number"
              step="0.1"
              min="0"
              value={formData.material_used}
              onChange={(e) => setFormData({ ...formData, material_used: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Качество печати (1-5)</Label>
            <Select 
              value={formData.quality} 
              onValueChange={(value) => setFormData({ ...formData, quality: value })}
            >
              <SelectTrigger id="quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Очень плохо</SelectItem>
                <SelectItem value="2">2 - Плохо</SelectItem>
                <SelectItem value="3">3 - Удовлетворительно</SelectItem>
                <SelectItem value="4">4 - Хорошо</SelectItem>
                <SelectItem value="5">5 - Отлично</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="success"
                checked={formData.success}
                onChange={(e) => setFormData({ ...formData, success: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="success" className="cursor-pointer">Печать успешна</Label>
            </div>
          </div>

          {!formData.success && (
            <div className="space-y-2">
              <Label htmlFor="issues">Причины проблем *</Label>
              <Textarea 
                id="issues"
                value={formData.issues}
                onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                placeholder="Опишите возникшие проблемы..."
                rows={2}
                required={!formData.success}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания оператора</Label>
            <Textarea 
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительные замечания..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" variant="success" disabled={isLoading}>
              {isLoading ? 'Завершение...' : 'Завершить задание'}
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
  onAddPrinter,
  onDeletePrinter,
  onAssignOrder,
  onCompleteJob
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any | null>(null);
  const [assigningPrinter, setAssigningPrinter] = useState<any | null>(null);
  const [completingPrinter, setCompletingPrinter] = useState<any | null>(null);

  const filteredPrinters = printers.filter(printer => 
    statusFilter === 'all' || printer.status === statusFilter
  );

  const stats = {
    total: printers.length,
    working: printers.filter(p => p.status === 'working' || p.status === 'printing').length,
    idle: printers.filter(p => p.status === 'idle').length,
    error: printers.filter(p => p.status === 'error').length,
    maintenance: printers.filter(p => p.status === 'maintenance').length,
    printing: printers.filter(p => p.status === 'printing').length,
    offline: printers.filter(p => p.status === 'offline').length
  };

  const handleDeletePrinter = async (printerId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот принтер?')) {
      const printer = printers.find(p => p.id === printerId);
      if (printer?.status === 'printing') {
        toast.error('Нельзя удалить принтер, который выполняет задание');
        return;
      }
      
      try {
        await onDeletePrinter(printerId);
        toast.success('Принтер удален');
      } catch (error) {
        toast.error('Ошибка удаления принтера');
      }
    }
  };

  const handleAssignOrder = async (printerId: number, orderId: number) => {
    try {
      await onAssignOrder(printerId, orderId);
    } catch (error) {
      console.error('Error assigning order:', error);
    }
  };

  const handleCompleteJob = async (printerId: number, jobData: any) => {
    try {
      await onCompleteJob(printerId, jobData);
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 bg-white border rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Всего</p>
          <p className="text-2xl">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 mb-1">Работают</p>
          <p className="text-2xl text-green-700">{stats.working}</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">Простой</p>
          <p className="text-2xl text-gray-700">{stats.idle}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-1">Печатают</p>
          <p className="text-2xl text-blue-700">{stats.printing}</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 mb-1">Ошибка</p>
          <p className="text-2xl text-red-700">{stats.error}</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 mb-1">Обслуживание</p>
          <p className="text-2xl text-orange-700">{stats.maintenance}</p>
        </div>
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Отключены</p>
          <p className="text-2xl text-gray-600">{stats.offline}</p>
        </div>
      </div>

      {/* Фильтр и кнопки */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
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
        </div>

        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
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
              onDelete={handleDeletePrinter}
              onAssignOrder={onAssignOrder ? () => setAssigningPrinter(printer) : undefined}
              onCompleteJob={onCompleteJob ? () => setCompletingPrinter(printer) : undefined}
            />
          );
        })}
        
        {filteredPrinters.length === 0 && (
          <div className="col-span-full p-8 text-center border rounded-lg">
            <PrinterIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Принтеры не найдены</p>
            <p className="text-sm mt-2">Измените фильтр или добавьте новые принтеры</p>
          </div>
        )}
      </div>

      {/* Диалоги */}
      <AddPrinterDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={onAddPrinter}
      />

      <EditPrinterDialog
        printer={editingPrinter}
        open={!!editingPrinter}
        onClose={() => setEditingPrinter(null)}
        onSave={onUpdatePrinter}
      />

      <AssignJobDialog
        printer={assigningPrinter}
        orders={orders}
        open={!!assigningPrinter}
        onClose={() => setAssigningPrinter(null)}
        onAssign={handleAssignOrder}
      />

      <CompleteJobDialog
        printer={completingPrinter}
        currentOrder={completingPrinter ? orders.find(o => o.id === completingPrinter.current_task_id) : null}
        materials={materials}
        open={!!completingPrinter}
        onClose={() => setCompletingPrinter(null)}
        onComplete={handleCompleteJob}
      />
    </div>
  );
};