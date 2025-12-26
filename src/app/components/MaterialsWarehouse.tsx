import React, { useState } from 'react';
import { materialsAPI } from '../lib/api';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Plus, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MaterialsWarehouseProps {
  materials: any[];
  onRefresh: () => void;
}

const materialTypes = [
  { value: 'PLA', label: 'PLA' },
  { value: 'ABS', label: 'ABS' },
  { value: 'PETG', label: 'PETG' },
  { value: 'TPU', label: 'TPU' },
  { value: 'Nylon', label: 'Nylon' },
  { value: 'RESIN', label: 'Смола' }
];

const getStockStatus = (available: number, minStock: number) => {
  if (available <= minStock) return 'critical';
  if (available <= minStock * 1.5) return 'warning';
  return 'ok';
};

const MaterialDialog: React.FC<{
  material: any | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isNew?: boolean;
}> = ({ material, open, onClose, onSave, isNew = false }) => {
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (material) {
      setFormData(material);
    } else if (isNew) {
      setFormData({
        name: '',
        type: 'PLA',
        color: '',
        available_quantity: 0,
        price_per_kg: 0,
        min_stock: 1000,
        is_available: true
      });
    }
  }, [material, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      if (isNew) {
        // Создание нового материала
        const response = await fetch(`https://${(window as any).SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-ff36f543/materials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            color: formData.color || undefined,
            available_quantity: parseFloat(formData.available_quantity) || 0,
            price_per_kg: parseFloat(formData.price_per_kg) || undefined,
            min_stock: parseFloat(formData.min_stock) || 1000,
            is_available: formData.is_available
          })
        });

        if (!response.ok) throw new Error('Failed to create material');
        toast.success('Материал добавлен');
      } else {
        // Обновление материала
        await materialsAPI.update(material.id, {
          name: formData.name,
          type: formData.type,
          color: formData.color || undefined,
          available_quantity: parseFloat(formData.available_quantity),
          price_per_kg: parseFloat(formData.price_per_kg) || undefined,
          min_stock: parseFloat(formData.min_stock),
          is_available: formData.is_available
        });
        toast.success('Материал обновлен');
      }

      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Material save error:', error);
      toast.error('Ошибка сохранения материала');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Добавление материала' : `Редактирование: ${material?.name}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input 
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="PLA Белый"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Тип *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Цвет</Label>
              <Input 
                id="color"
                value={formData.color || ''}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Белый"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Количество (г)</Label>
              <Input 
                id="quantity"
                type="number"
                step="0.1"
                value={formData.available_quantity || ''}
                onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                placeholder="5000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена за кг (₽)</Label>
              <Input 
                id="price"
                type="number"
                step="0.01"
                value={formData.price_per_kg || ''}
                onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                placeholder="1200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">Минимальный запас (г)</Label>
              <Input 
                id="min_stock"
                type="number"
                step="0.1"
                value={formData.min_stock || ''}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="is_available">Доступность</Label>
              <Select 
                value={formData.is_available ? 'true' : 'false'} 
                onValueChange={(value) => setFormData({ ...formData, is_available: value === 'true' })}
              >
                <SelectTrigger id="is_available">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Доступен</SelectItem>
                  <SelectItem value="false">Недоступен</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

export const MaterialsWarehouse: React.FC<MaterialsWarehouseProps> = ({ materials, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [showNewMaterial, setShowNewMaterial] = useState(false);

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.color?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || material.type === typeFilter;
    
    const stockStatus = getStockStatus(material.available_quantity, material.min_stock);
    const matchesStock = stockFilter === 'all' || stockFilter === stockStatus;

    return matchesSearch && matchesType && matchesStock;
  });

  const stats = {
    total: materials.length,
    lowStock: materials.filter(m => getStockStatus(m.available_quantity, m.min_stock) === 'critical').length,
    warning: materials.filter(m => getStockStatus(m.available_quantity, m.min_stock) === 'warning').length,
    ok: materials.filter(m => getStockStatus(m.available_quantity, m.min_stock) === 'ok').length
  };

  const handleSave = () => {
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-600" />
            <p className="text-sm text-gray-600">Всего материалов</p>
          </div>
          <p className="text-2xl">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">В наличии</p>
          </div>
          <p className="text-2xl text-green-700">{stats.ok}</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-sm text-orange-700">Заканчивается</p>
          </div>
          <p className="text-2xl text-orange-700">{stats.warning}</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">Критический запас</p>
          </div>
          <p className="text-2xl text-red-700">{stats.lowStock}</p>
        </div>
      </div>

      {/* Фильтры и действия */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск по названию, типу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {materialTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Все запасы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все запасы</SelectItem>
              <SelectItem value="ok">В наличии</SelectItem>
              <SelectItem value="warning">Заканчивается</SelectItem>
              <SelectItem value="critical">Критический</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-2" onClick={() => setShowNewMaterial(true)}>
          <Plus className="w-4 h-4" />
          Добавить материал
        </Button>
      </div>

      {/* Таблица материалов */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Цвет</TableHead>
              <TableHead>Остаток (г)</TableHead>
              <TableHead>Мин. запас (г)</TableHead>
              <TableHead>Цена за кг (₽)</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.map(material => {
              const stockStatus = getStockStatus(material.available_quantity, material.min_stock);
              
              return (
                <TableRow 
                  key={material.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setEditingMaterial(material)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      {material.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.type}</Badge>
                  </TableCell>
                  <TableCell>{material.color || '—'}</TableCell>
                  <TableCell>
                    <span className={
                      stockStatus === 'critical' ? 'text-red-700 font-semibold' :
                      stockStatus === 'warning' ? 'text-orange-700 font-semibold' :
                      ''
                    }>
                      {material.available_quantity.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>{material.min_stock.toFixed(1)}</TableCell>
                  <TableCell>{material.price_per_kg ? material.price_per_kg.toFixed(2) : '—'}</TableCell>
                  <TableCell>
                    {stockStatus === 'critical' && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Критический
                      </Badge>
                    )}
                    {stockStatus === 'warning' && (
                      <Badge className="gap-1 bg-orange-500">
                        <AlertTriangle className="w-3 h-3" />
                        Мало
                      </Badge>
                    )}
                    {stockStatus === 'ok' && (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="w-3 h-3" />
                        В наличии
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Диалоги */}
      <MaterialDialog
        material={editingMaterial}
        open={!!editingMaterial}
        onClose={() => setEditingMaterial(null)}
        onSave={handleSave}
      />

      <MaterialDialog
        material={null}
        open={showNewMaterial}
        onClose={() => setShowNewMaterial(false)}
        onSave={handleSave}
        isNew
      />
    </div>
  );
};
