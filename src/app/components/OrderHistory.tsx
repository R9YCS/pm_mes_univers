import React, { useState, useEffect } from 'react';
import { orderHistoryAPI, printLogsAPI } from '../lib/api';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, History, Printer, Calendar, User, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OrderHistoryItem {
  id: number;
  order_id: number;
  old_status_id?: number;
  new_status_id: number;
  changed_by?: number;
  changed_at: string;
  notes?: string;
  order?: any;
  old_status?: any;
  new_status?: any;
  changed_by_person?: any;
}

interface PrintLog {
  id: number;
  order_id: number;
  printer_id: number;
  operator_id?: number;
  material_used?: number;
  print_time?: number;
  success: boolean;
  issues?: string;
  started_at: string;
  completed_at?: string;
  notes?: string;
  order?: any;
  printer?: any;
  operator?: any;
}

export const OrderHistory: React.FC = () => {
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, logsData] = await Promise.all([
        orderHistoryAPI.getAll(),
        printLogsAPI.getAll()
      ]);
      setHistory(historyData);
      setPrintLogs(logsData);
    } catch (error) {
      console.error('Load history error:', error);
      toast.error('Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const orderNumber = item.order?.order_number || '';
    const statusName = item.new_status?.name || '';
    return (
      orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statusName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredLogs = printLogs.filter(log => {
    const orderNumber = log.order?.order_number || '';
    const printerName = log.printer?.name || '';
    return (
      orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
            <History className="w-4 h-4 text-gray-600" />
            <p className="text-sm text-gray-600">Изменений статусов</p>
          </div>
          <p className="text-2xl">{history.length}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">Печатей выполнено</p>
          </div>
          <p className="text-2xl text-blue-700">{printLogs.length}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">Успешных печатей</p>
          </div>
          <p className="text-2xl text-green-700">
            {printLogs.filter(log => log.success).length}
          </p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">С ошибками</p>
          </div>
          <p className="text-2xl text-red-700">
            {printLogs.filter(log => !log.success).length}
          </p>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Поиск по номеру заказа..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Вкладки */}
      <Tabs defaultValue="status-changes">
        <TabsList>
          <TabsTrigger value="status-changes" className="gap-2">
            <History className="w-4 h-4" />
            История статусов
          </TabsTrigger>
          <TabsTrigger value="print-logs" className="gap-2">
            <Printer className="w-4 h-4" />
            Журнал печати
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status-changes" className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Номер заказа</TableHead>
                  <TableHead>Прежний статус</TableHead>
                  <TableHead>Новый статус</TableHead>
                  <TableHead>Изменил</TableHead>
                  <TableHead>Примечания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(item.changed_at).toLocaleString('ru-RU')}
                      </div>
                    </TableCell>
                    <TableCell>{item.order?.order_number || '—'}</TableCell>
                    <TableCell>
                      {item.old_status ? (
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: item.old_status.color, color: item.old_status.color }}
                        >
                          {item.old_status.name}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        style={{ backgroundColor: item.new_status?.color, color: '#fff' }}
                      >
                        {item.new_status?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.changed_by_person ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {item.changed_by_person.full_name}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="print-logs" className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Период печати</TableHead>
                  <TableHead>Номер заказа</TableHead>
                  <TableHead>Принтер</TableHead>
                  <TableHead>Оператор</TableHead>
                  <TableHead>Время печати</TableHead>
                  <TableHead>Материал</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Проблемы</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>Начало: {new Date(log.started_at).toLocaleString('ru-RU')}</span>
                        </div>
                        {log.completed_at && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Конец: {new Date(log.completed_at).toLocaleString('ru-RU')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{log.order?.order_number || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-gray-400" />
                        {log.printer?.name || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.operator ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {log.operator.full_name}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {log.print_time ? `${log.print_time} мин` : '—'}
                    </TableCell>
                    <TableCell>
                      {log.material_used ? `${log.material_used} г` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Успешно
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Ошибка
                          </div>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.issues || log.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
