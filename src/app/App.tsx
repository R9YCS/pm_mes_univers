import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { AuthPage } from './components/AuthPage';
import { KanbanBoard } from './components/KanbanBoard';
import { PrintersMonitor } from './components/PrintersMonitor';
import { ClientsDatabase } from './components/ClientsDatabase';
import { UsersManagement } from './components/UsersManagement';
import { OrderHistory } from './components/OrderHistory';
import { Toaster } from './components/ui/sonner';
import { LayoutGrid, Printer as PrinterIcon, Users, Shield, History, LogOut } from 'lucide-react';
import { authAPI, ordersAPI, printersAPI, personsAPI, orderStatusesAPI, materialsAPI } from './lib/api';
import { getAuthToken } from './lib/api';
import { toast } from 'sonner';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
      await loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const [ordersData, printersData, clientsData, statusesData, materialsData] = await Promise.all([
        ordersAPI.getAll(),
        printersAPI.getAll(),
        personsAPI.getAll('client'),
        orderStatusesAPI.getAll(),
        materialsAPI.getAll()
      ]);

      setOrders(ordersData);
      setPrinters(printersData);
      setClients(clientsData);
      setStatuses(statusesData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('Ошибка загрузки данных');
    }
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    await loadData();
  };

  const handleLogout = () => {
    authAPI.signout();
    setIsAuthenticated(false);
    setOrders([]);
    setPrinters([]);
    setClients([]);
    toast.success('Вы вышли из системы');
  };

  const handleUpdateOrder = async (orderId: number, updates: any) => {
    try {
      await ordersAPI.update(orderId, updates);
      await loadData();
      toast.success('Заказ обновлен');
    } catch (error) {
      console.error('Update order error:', error);
      toast.error('Ошибка обновления заказа');
    }
  };

  const handleCreateOrder = async (order: any) => {
    try {
      await ordersAPI.create(order);
      await loadData();
      toast.success('Заказ создан');
    } catch (error) {
      console.error('Create order error:', error);
      toast.error('Ошибка создания заказа');
    }
  };

  const handleUpdatePrinter = async (printerId: number, updates: any) => {
    try {
      await printersAPI.update(printerId, updates);
      await loadData();
      toast.success('Принтер обновлен');
    } catch (error) {
      console.error('Update printer error:', error);
      toast.error('Ошибка обновления принтера');
    }
  };

  const handleUpdateClient = async (clientId: number, updates: any) => {
    try {
      await personsAPI.update(clientId, updates);
      await loadData();
      toast.success('Клиент обновлен');
    } catch (error) {
      console.error('Update client error:', error);
      toast.error('Ошибка обновления клиента');
    }
  };

  const handleCreateClient = async (client: any) => {
    try {
      await personsAPI.create({ ...client, type: 'client' });
      await loadData();
      toast.success('Клиент создан');
    } catch (error) {
      console.error('Create client error:', error);
      toast.error('Ошибка создания клиента');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl">MES-система управления 3D-печатью</h1>
            <p className="text-gray-600 mt-1">
              Система управления производственными заказами и оборудованием
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Выход
          </Button>
        </div>
      </header>

      {/* Основной контент */}
      <main className="p-6">
        <Tabs defaultValue="kanban" className="space-y-6">
          <TabsList className="grid w-full max-w-5xl grid-cols-5">
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Доска заказов
            </TabsTrigger>
            <TabsTrigger value="printers" className="gap-2">
              <PrinterIcon className="w-4 h-4" />
              Принтеры
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Клиенты
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Shield className="w-4 h-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="space-y-4">
            <div>
              <h2>Канбан-доска заказов</h2>
              <p className="text-gray-600 mt-1">
                Отслеживайте и управляйте заказами в режиме реального времени
              </p>
            </div>
            <KanbanBoard
              orders={orders}
              onUpdateOrder={handleUpdateOrder}
              onCreateOrder={handleCreateOrder}
              clients={clients}
              printers={printers}
              statuses={statuses}
              materials={materials}
            />
          </TabsContent>

          <TabsContent value="printers" className="space-y-4">
            <div>
              <h2>Панель мониторинга 3D-принтеров</h2>
              <p className="text-gray-600 mt-1">
                Контроль состояния оборудования и планирование загрузки
              </p>
            </div>
            <PrintersMonitor
              printers={printers}
              orders={orders}
              onUpdatePrinter={handleUpdatePrinter}
            />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <div>
              <h2>База клиентов</h2>
              <p className="text-gray-600 mt-1">
                Управление контактами и история взаимодействий
              </p>
            </div>
            <ClientsDatabase
              clients={clients}
              onUpdateClient={handleUpdateClient}
              onCreateClient={handleCreateClient}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div>
              <h2>Управление пользователями</h2>
              <p className="text-gray-600 mt-1">
                Управление доступами и ролями пользователей системы
              </p>
            </div>
            <UsersManagement />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div>
              <h2>История заказов и печати</h2>
              <p className="text-gray-600 mt-1">
                Полная история изменений статусов и журнал печати
              </p>
            </div>
            <OrderHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
