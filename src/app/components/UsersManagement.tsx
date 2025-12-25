import React, { useState, useEffect } from 'react';
import { personsAPI, authAPI } from '../lib/api';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Plus, User, Building2, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Person {
  id: number;
  type: string;
  full_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  position?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<Person | null>(null);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await personsAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Load users error:', error);
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (id: number, updates: Partial<Person>) => {
    try {
      await personsAPI.update(id, updates);
      toast.success('Пользователь обновлен');
      loadUsers();
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Ошибка обновления пользователя');
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      // Если это сотрудник или админ, создаем через auth
      if (userData.type !== 'client' && userData.password) {
        await authAPI.signup({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          type: userData.type
        });
      } else {
        // Клиента создаем напрямую
        await personsAPI.create(userData);
      }
      toast.success('Пользователь создан');
      loadUsers();
    } catch (error) {
      console.error('Create user error:', error);
      toast.error('Ошибка создания пользователя');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || user.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    if (type === 'admin') return <Shield className="w-4 h-4 text-purple-600" />;
    if (type === 'client') return <User className="w-4 h-4 text-blue-600" />;
    if (type === 'employee' || type === 'manager') return <Building2 className="w-4 h-4 text-green-600" />;
    return <User className="w-4 h-4 text-gray-600" />;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      admin: 'Администратор',
      employee: 'Сотрудник',
      manager: 'Менеджер',
      client: 'Клиент'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-600" />
            <p className="text-sm text-gray-600">Всего пользователей</p>
          </div>
          <p className="text-2xl">{users.length}</p>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-purple-700">Администраторы</p>
          </div>
          <p className="text-2xl text-purple-700">{users.filter(u => u.type === 'admin').length}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">Сотрудники</p>
          </div>
          <p className="text-2xl text-green-700">
            {users.filter(u => u.type === 'employee' || u.type === 'manager').length}
          </p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">Клиенты</p>
          </div>
          <p className="text-2xl text-blue-700">{users.filter(u => u.type === 'client').length}</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск по имени, email, телефону..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="admin">Администраторы</SelectItem>
              <SelectItem value="employee">Сотрудники</SelectItem>
              <SelectItem value="manager">Менеджеры</SelectItem>
              <SelectItem value="client">Клиенты</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-2" onClick={() => setShowNewUserDialog(true)}>
          <Plus className="w-4 h-4" />
          Новый пользователь
        </Button>
      </div>

      {/* Таблица */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Должность/Компания</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow 
                key={user.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedUser(user)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(user.type)}
                    <span>{user.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.type === 'admin' ? 'default' : 'secondary'}>
                    {getTypeLabel(user.type)}
                  </Badge>
                </TableCell>
                <TableCell>{user.email || '—'}</TableCell>
                <TableCell>{user.phone || '—'}</TableCell>
                <TableCell>{user.position || user.company_name || '—'}</TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'destructive'}>
                    {user.is_active ? 'Активен' : 'Неактивен'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Диалоги */}
      <UserDialog
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onSave={handleUpdateUser}
      />

      <NewUserDialog
        open={showNewUserDialog}
        onClose={() => setShowNewUserDialog(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
};

// Диалог редактирования пользователя
const UserDialog: React.FC<{
  user: Person | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Person>) => void;
}> = ({ user, open, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Person>>({});

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onSave(user.id, formData);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактирование: {user.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input 
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input 
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Должность</Label>
              <Input 
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Статус</Label>
              <Select 
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Примечания</Label>
              <Textarea 
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Диалог создания пользователя
const NewUserDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (user: any) => void;
}> = ({ open, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    type: 'employee',
    full_name: '',
    email: '',
    password: '',
    phone: '',
    position: '',
    company_name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    onClose();
    setFormData({
      type: 'employee',
      full_name: '',
      email: '',
      password: '',
      phone: '',
      position: '',
      company_name: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Создание нового пользователя</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="client">Клиент</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ФИО *</Label>
              <Input 
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            {formData.type !== 'client' && (
              <div className="space-y-2">
                <Label>Пароль *</Label>
                <Input 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={formData.type !== 'client'}
                  placeholder="Минимум 6 символов"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            {formData.type !== 'client' ? (
              <div className="space-y-2">
                <Label>Должность</Label>
                <Input 
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Компания</Label>
                <Input 
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
