import React, { useState } from 'react';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Plus, Building2, User, Mail, Phone, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ClientsDatabaseProps {
  clients: any[];
  onUpdateClient: (clientId: number, updates: any) => void;
  onCreateClient: (client: any) => void;
}

const ClientDetailsDialog: React.FC<{
  client: any | null;
  open: boolean;
  onClose: () => void;
  onSave: (clientId: number, updates: any) => void;
  isNew?: boolean;
  onCreate?: (client: any) => void;
}> = ({ client, open, onClose, onSave, isNew = false, onCreate }) => {
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (client) {
      setFormData(client);
    } else if (isNew) {
      setFormData({
        full_name: '',
        company_name: '',
        email: '',
        phone: '',
        notes: '',
        is_active: true
      });
    }
  }, [client, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name && !formData.company_name) {
      toast.error('Укажите ФИО или название компании');
      return;
    }

    if (isNew && onCreate) {
      onCreate({
        ...formData,
        type: 'client'
      });
    } else if (client) {
      onSave(client.id, formData);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Создание нового клиента' : `Клиент: ${client?.full_name || client?.company_name}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">ФИО</Label>
              <Input 
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Название компании</Label>
              <Input 
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="ООО «Компания»"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input 
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@mail.ru"
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
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: clients.length,
    companies: clients.filter(c => c.company_name).length,
    individuals: clients.filter(c => c.full_name && !c.company_name).length,
    active: clients.filter(c => c.is_active).length
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
            <p className="text-sm text-blue-700">Компании</p>
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
            <p className="text-sm text-purple-700">Активных</p>
          </div>
          <p className="text-2xl text-purple-700">{stats.active}</p>
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
              <TableHead>Контакты</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
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
                    {client.company_name ? (
                      <Building2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                    <div>
                      <div>{client.full_name || client.company_name}</div>
                      {client.full_name && client.company_name && (
                        <div className="text-sm text-gray-500">{client.company_name}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{client.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={client.is_active ? 'default' : 'secondary'}>
                    {client.is_active ? 'Активен' : 'Неактивен'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {client.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(client.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  )}
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