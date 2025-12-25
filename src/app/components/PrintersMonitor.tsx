import React, { useState } from 'react';
import { Printer, PrinterStatus } from '../data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Printer as PrinterIcon, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { toast } from 'sonner';

interface PrintersMonitorProps {
  printers: Printer[];
  orders: Array<{ id: string; orderNumber: string }>;
  onUpdatePrinter: (printerId: string, updates: Partial<Printer>) => void;
}

const statusConfig: Record<PrinterStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  working: { 
    label: 'Работает', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />
  },
  idle: { 
    label: 'Простой', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Clock className="w-5 h-5 text-gray-600" />
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
  }
};

interface PrinterCardProps {
  printer: Printer;
  currentOrder?: { id: string; orderNumber: string };
  onEdit: (printer: Printer) => void;
}

const PrinterCard: React.FC<PrinterCardProps> = ({ printer, currentOrder, onEdit }) => {
  const config = statusConfig[printer.status];
  
  return (
    <div 
      className={`p-6 border-2 rounded-lg ${config.bgColor} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onEdit(printer)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <PrinterIcon className="w-6 h-6 text-gray-700" />
          <div>
            <h3 className="mb-0.5">{printer.name}</h3>
            <p className="text-sm text-gray-600">{printer.model}</p>
          </div>
        </div>
        {config.icon}
      </div>

      <div className="space-y-3">
        <div>
          <span className={`text-sm ${config.color}`}>{config.label}</span>
        </div>

        {printer.status === 'working' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Прогресс</span>
              <span>{printer.progress}%</span>
            </div>
            <Progress value={printer.progress} className="h-2" />
            {currentOrder && (
              <p className="text-sm text-gray-600">
                Заказ: {currentOrder.orderNumber}
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Последнее ТО</span>
            <span>{new Date(printer.lastMaintenance).toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Тип</span>
            <Badge variant="outline">{printer.type}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditPrinterDialog: React.FC<{
  printer: Printer | null;
  open: boolean;
  onClose: () => void;
  onSave: (printerId: string, updates: Partial<Printer>) => void;
}> = ({ printer, open, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Printer>>({});

  React.useEffect(() => {
    if (printer) {
      setFormData({
        status: printer.status,
        progress: printer.progress,
        lastMaintenance: printer.lastMaintenance
      });
    }
  }, [printer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (printer) {
      onSave(printer.id, formData);
      toast.success('Данные принтера обновлены');
      onClose();
    }
  };

  if (!printer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование принтера: {printer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Модель</Label>
            <Input value={printer.model} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: PrinterStatus) => setFormData({ ...formData, status: value })}
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

          {formData.status === 'working' && (
            <div className="space-y-2">
              <Label htmlFor="progress">Прогресс (%)</Label>
              <Input 
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress || 0}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maintenance">Дата последнего ТО</Label>
            <Input 
              id="maintenance"
              type="date"
              value={formData.lastMaintenance}
              onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
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

export const PrintersMonitor: React.FC<PrintersMonitorProps> = ({ 
  printers, 
  orders,
  onUpdatePrinter 
}) => {
  const [statusFilter, setStatusFilter] = useState<PrinterStatus | 'all'>('all');
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);

  const filteredPrinters = printers.filter(printer => 
    statusFilter === 'all' || printer.status === statusFilter
  );

  const stats = {
    total: printers.length,
    working: printers.filter(p => p.status === 'working').length,
    idle: printers.filter(p => p.status === 'idle').length,
    error: printers.filter(p => p.status === 'error').length,
    maintenance: printers.filter(p => p.status === 'maintenance').length
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white border rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Всего принтеров</p>
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 mb-1">Ошибка</p>
          <p className="text-2xl text-red-700">{stats.error}</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 mb-1">Обслуживание</p>
          <p className="text-2xl text-orange-700">{stats.maintenance}</p>
        </div>
      </div>

      {/* Фильтр */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PrinterStatus | 'all')}>
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

      {/* Сетка принтеров */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrinters.map(printer => {
          const currentOrder = printer.currentOrderId 
            ? orders.find(o => o.id === printer.currentOrderId)
            : undefined;
          
          return (
            <PrinterCard
              key={printer.id}
              printer={printer}
              currentOrder={currentOrder}
              onEdit={setEditingPrinter}
            />
          );
        })}
      </div>

      {/* Диалог редактирования */}
      <EditPrinterDialog
        printer={editingPrinter}
        open={!!editingPrinter}
        onClose={() => setEditingPrinter(null)}
        onSave={onUpdatePrinter}
      />
    </div>
  );
};
