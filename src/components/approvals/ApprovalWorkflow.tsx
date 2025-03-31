
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Clock, XCircle, ClipboardList } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ApprovalTask {
  id: string;
  documentName: string;
  requestedBy: string;
  requestedDate: string;
  dueDate: string;
  status: 'pending' | 'inProgress' | 'approved' | 'rejected';
  priority: 'normal' | 'high' | 'urgent';
  approver?: {
    name: string;
    avatar?: string;
  };
  department: string;
}

// Mock approval tasks
const MOCK_APPROVALS: ApprovalTask[] = [
  {
    id: 'task1',
    documentName: 'Технический отчет по турбине Т-1000',
    requestedBy: 'Алексей Петров',
    requestedDate: '2023-10-15',
    dueDate: '2023-10-20',
    status: 'pending',
    priority: 'urgent',
    approver: {
      name: 'Мария Иванова',
      avatar: '/assets/avatars/avatar2.jpg'
    },
    department: 'Технический отдел'
  },
  {
    id: 'task2',
    documentName: 'Отчет о безопасности',
    requestedBy: 'Николай Смирнов',
    requestedDate: '2023-10-12',
    dueDate: '2023-10-22',
    status: 'inProgress',
    priority: 'high',
    approver: {
      name: 'Дмитрий Соколов'
    },
    department: 'Отдел безопасности'
  },
  {
    id: 'task3',
    documentName: 'Спецификация оборудования',
    requestedBy: 'Елена Козлова',
    requestedDate: '2023-10-08',
    dueDate: '2023-10-18',
    status: 'approved',
    priority: 'normal',
    approver: {
      name: 'Алексей Петров',
      avatar: '/assets/avatars/avatar1.jpg'
    },
    department: 'Закупки'
  },
  {
    id: 'task4',
    documentName: 'План технического обслуживания',
    requestedBy: 'Дмитрий Соколов',
    requestedDate: '2023-10-05',
    dueDate: '2023-10-15',
    status: 'rejected',
    priority: 'normal',
    approver: {
      name: 'Николай Смирнов',
      avatar: '/assets/avatars/avatar3.jpg'
    },
    department: 'Операционный отдел'
  }
];

interface ApprovalWorkflowProps {
  documentId?: string;
}

export function ApprovalWorkflow({ documentId }: ApprovalWorkflowProps) {
  const getPriorityBadge = (priority: 'normal' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Срочно</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Высокий</Badge>;
      case 'normal':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Обычный</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: 'pending' | 'inProgress' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Ожидает</Badge>;
      case 'inProgress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">В работе</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Одобрено</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Отклонено</Badge>;
      default:
        return null;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const renderTask = (task: ApprovalTask) => {
    return (
      <div key={task.id} className="border rounded-md p-4 mb-3 bg-card">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{task.documentName}</h4>
            <div className="text-sm text-muted-foreground mt-1">
              Отдел: {task.department}
            </div>
          </div>
          <div className="flex gap-2">
            {getPriorityBadge(task.priority)}
            {getStatusBadge(task.status)}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">До {new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
            </div>
            
            {task.approver && (
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-1">
                  {task.approver.avatar && <AvatarImage src={task.approver.avatar} alt={task.approver.name} />}
                  <AvatarFallback>{getInitials(task.approver.name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{task.approver.name}</span>
              </div>
            )}
          </div>

          {(task.status === 'pending' || task.status === 'inProgress') && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8">
                <XCircle className="h-4 w-4 mr-1 text-destructive" />
                Отклонить
              </Button>
              <Button size="sm" className="h-8">
                <CheckCircle className="h-4 w-4 mr-1" />
                Одобрить
              </Button>
            </div>
          )}

          {task.status === 'approved' && (
            <div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          )}

          {task.status === 'rejected' && (
            <div>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const pendingTasks = MOCK_APPROVALS.filter(task => task.status === 'pending');
  const inProgressTasks = MOCK_APPROVALS.filter(task => task.status === 'inProgress');
  const completedTasks = MOCK_APPROVALS.filter(task => task.status === 'approved' || task.status === 'rejected');

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center">
          <ClipboardList className="h-5 w-5 mr-2" />
          Процесс согласования
        </CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Новое согласование
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="pending" className="flex-1">
              Ожидают ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="inProgress" className="flex-1">
              В работе ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Завершенные ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-3">
              {pendingTasks.length > 0 ? (
                pendingTasks.map(renderTask)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Нет задач, ожидающих согласования
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inProgress">
            <div className="space-y-3">
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map(renderTask)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Нет задач в процессе согласования
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-3">
              {completedTasks.length > 0 ? (
                completedTasks.map(renderTask)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Нет завершенных задач
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
