import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { KanbanBoard } from './components/KanbanBoard';
import { PrintersMonitor } from './components/PrintersMonitor';
import { ClientsDatabase } from './components/ClientsDatabase';
import { mockOrders, mockPrinters, mockClients, Order, Printer, Client } from './data/mockData';
import { Toaster } from './components/ui/sonner';
import { LayoutGrid, Printer as PrinterIcon, Users } from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [printers, setPrinters] = useState<Printer[]>(mockPrinters);
  const [clients, setClients] = useState<Client[]>(mockClients);

  // Управление заказами
  const handleUpdateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ));
  };

  const handleCreateOrder = (newOrder: Omit<Order, 'id'>) => {
    const order: Order = {
      ...newOrder,
      id: String(Date.now())
    };
    setOrders([...orders, order]);
  };

  // Управление принтерами
  const handleUpdatePrinter = (printerId: string, updates: Partial<Printer>) => {
    setPrinters(printers.map(printer => 
      printer.id === printerId ? { ...printer, ...updates } : printer
    ));
  };

  // Управление клиентами
  const handleUpdateClient = (clientId: string, updates: Partial<Client>) => {
    setClients(clients.map(client => 
      client.id === clientId ? { ...client, ...updates } : client
    ));
  };

  const handleCreateClient = (newClient: Omit<Client, 'id'>) => {
    const client: Client = {
      ...newClient,
      id: String(Date.now())
    };
    setClients([...clients, client]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl">MES-система управления 3D-печатью</h1>
          <p className="text-gray-600 mt-1">
            Система управления производственными заказами и оборудованием
          </p>
        </div>
      </header>

      {/* Основной контент */}
      <main className="p-6">
        <Tabs defaultValue="kanban" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Доска заказов
            </TabsTrigger>
            <TabsTrigger value="printers" className="gap-2">
              <PrinterIcon className="w-4 h-4" />
              Мониторинг принтеров
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              База клиентов
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
              clients={clients.map(c => ({ id: c.id, name: c.name }))}
              printers={printers.map(p => ({ id: p.id, name: p.name }))}
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
              orders={orders.map(o => ({ id: o.id, orderNumber: o.orderNumber }))}
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
        </Tabs>
      </main>
    </div>
  );
}
