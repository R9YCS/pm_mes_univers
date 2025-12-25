import React, { useState } from 'react';
import { Client, ClientType } from '../data/mockData';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Plus, Building2, User, Mail, Phone, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ClientsDatabaseProps {
  clients: Client[];
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
  onCreateClient: (client: Omit<Client, 'id'>) => void;
}

const ClientDetailsDialog: React.FC<{
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onSave: (clientId: string, updates: Partial<Client>) => void;
  isNew?: boolean;
  onCreate?: (client: Omit<Client, 'id'>) => void;
}> = ({ client, open, onClose, onSave, isNew = false, onCreate }) => {
  const [formData, setFormData] = useState<Partial<Client>>({});

  React.useEffect(() => {
    if (client) {
      setFormData(client);
    } else if (isNew) {
      setFormData({
        name: '',
        type: 'individual',
        phone: '',
        email: '',
        completedOrders: 0,
        lastOrderDate: new Date().toISOString().split('T')[0],
        preferredMaterials: [],
        preferredColors: [],
        notes: ''
      });
    }
  }, [client, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Заполните обязательные поля');
      return;
    }

    if (isNew && onCreate) {
      onCreate(formData as Omit<Client, 'id'>);
      toast.success('Клиент успешно создан');
    } else if (client) {
      onSave(client.id, formData);
      toast.success('Данные клиента обновлены');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Создание нового клиента' : `Клиент: ${client?.name}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">ФИО / Название компании *</Label>
              <Input 
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иванов Иван Иванович или ООО «Компания»"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Тип клиента</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: ClientType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Физическое лицо</SelectItem>
                  <SelectItem value="company">Юридическое лицо</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input 
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@mail.ru"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Предпочитаемые материалы</Label>
              <Input 
                id="materials"
                value={formData.preferredMaterials?.join(', ') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  preferredMaterials: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                })}
                placeholder="PLA, ABS, Resin..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colors">Предпочитаемые цвета</Label>
              <Input 
                id="colors"
                value={formData.preferredColors?.join(', ') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  preferredColors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                })}
                placeholder="Черный, Белый, Синий..."
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea 
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация о клиенте"
                rows={3}
              />
            </div>
          </div>

          {!isNew && client && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Выполнено заказов</p>
                <p className="text-xl">{client.completedOrders}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Последний заказ</p>
                <p className="text-xl">
                  {new Date(client.lastOrderDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              {isNew ? 'Создать' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ClientsDatabase: React.FC<ClientsDatabaseProps> = ({ 
  clients, 
  onUpdateClient,
  onCreateClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ClientType | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || client.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const stats = {
    total: clients.length,
    companies: clients.filter(c => c.type === 'company').length,
    individuals: clients.filter(c => c.type === 'individual').length,
    totalOrders: clients.reduce((sum, c) => sum + c.completedOrders, 0)
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-600" />
            <p className="text-sm text-gray-600">Всего клиентов</p>
          </div>
          <p className="text-2xl">{stats.total}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">Юр. лица</p>
          </div>
          <p className="text-2xl text-blue-700">{stats.companies}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">Физ. лица</p>
          </div>
          <p className="text-2xl text-green-700">{stats.individuals}</p>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-purple-700">Всего заказов</p>
          </div>
          <p className="text-2xl text-purple-700">{stats.totalOrders}</p>
        </div>
      </div>

      {/* Фильтры и действия */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск по имени, телефону, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ClientType | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="individual">Физические лица</SelectItem>
              <SelectItem value="company">Юридические лица</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-2" onClick={() => setShowNewClientDialog(true)}>
          <Plus className="w-4 h-4" />
          Новый клиент
        </Button>
      </div>

      {/* Таблица клиентов */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО / Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Контакты</TableHead>
              <TableHead>Заказов</TableHead>
              <TableHead>Последний заказ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map(client => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedClient(client)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {client.type === 'company' ? (
                      <Building2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                    <span>{client.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={client.type === 'company' ? 'default' : 'secondary'}>
                    {client.type === 'company' ? 'Юр. лицо' : 'Физ. лицо'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span>{client.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{client.completedOrders}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(client.lastOrderDate).toLocaleDateString('ru-RU')}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Диалоги */}
      <ClientDetailsDialog
        client={selectedClient}
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        onSave={onUpdateClient}
      />

      <ClientDetailsDialog
        client={null}
        open={showNewClientDialog}
        onClose={() => setShowNewClientDialog(false)}
        onSave={onUpdateClient}
        isNew
        onCreate={onCreateClient}
      />
    </div>
  );
};
