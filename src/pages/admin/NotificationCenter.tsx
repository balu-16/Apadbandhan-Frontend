import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Send, 
  FileText, 
  Users, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  notificationCenterAPI, 
  NotificationTemplate, 
  NotificationLog, 
  FilterOption,
  RoleUser,
  SendTemplateNotificationData,
  SendCustomNotificationData
} from '@/services/api';

type TargetRole = 'user' | 'admin' | 'superadmin' | 'police' | 'hospital' | 'all';

const ROLES: { value: TargetRole; label: string }[] = [
  { value: 'all', label: 'All Users' },
  { value: 'user', label: 'Regular Users' },
  { value: 'admin', label: 'Admins' },
  { value: 'superadmin', label: 'SuperAdmins' },
  { value: 'police', label: 'Police' },
  { value: 'hospital', label: 'Hospitals' },
];

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  sent: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

const NotificationCenter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState('send');
  const [sendMode, setSendMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [targetRole, setTargetRole] = useState<TargetRole>('all');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectAllUsers, setSelectAllUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Queries
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const response = await notificationCenterAPI.getTemplates(undefined, true);
      return response.data;
    },
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['notification-filters', targetRole],
    queryFn: async () => {
      if (targetRole === 'all') return { filters: [] };
      const response = await notificationCenterAPI.getFilterOptions(targetRole);
      return response.data;
    },
    enabled: targetRole !== 'all',
  });

  const { data: roleUsersData, isLoading: roleUsersLoading } = useQuery({
    queryKey: ['notification-users', targetRole],
    queryFn: async () => {
      if (targetRole === 'all') return { users: [] };
      const response = await notificationCenterAPI.getUsersByRole(targetRole);
      return response.data;
    },
    enabled: targetRole !== 'all',
  });

  const { data: previewData, refetch: refetchPreview, isFetching: previewLoading } = useQuery({
    queryKey: ['notification-preview', targetRole, filters],
    queryFn: async () => {
      const response = await notificationCenterAPI.previewTargetCount({
        targetRole,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      return response.data;
    },
    enabled: false,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['notification-logs', logsPage],
    queryFn: async () => {
      const response = await notificationCenterAPI.getLogs({ page: logsPage, limit: 10 });
      return response.data;
    },
  });

  // Mutations
  const sendTestMutation = useMutation({
    mutationFn: () => notificationCenterAPI.sendTestNotification(),
    onSuccess: (response) => {
      toast({
        title: response.data.success ? 'Success' : 'Notice',
        description: response.data.message,
        variant: response.data.success ? 'default' : 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send test notification',
        variant: 'destructive',
      });
    },
  });

  const sendTemplateMutation = useMutation({
    mutationFn: (data: SendTemplateNotificationData) =>
      notificationCenterAPI.sendTemplateNotification(data),
    onSuccess: (response) => {
      toast({
        title: response.data.success ? 'Notification Sent' : 'Partial Success',
        description: response.data.message,
        variant: response.data.success ? 'default' : 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setShowConfirmDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  const sendCustomMutation = useMutation({
    mutationFn: (data: SendCustomNotificationData) =>
      notificationCenterAPI.sendCustomNotification(data),
    onSuccess: (response) => {
      toast({
        title: response.data.success ? 'Notification Sent' : 'Partial Success',
        description: response.data.message,
        variant: response.data.success ? 'default' : 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setShowConfirmDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const resetForm = useCallback(() => {
    setSelectedTemplate(null);
    setFilters({});
    setVariables({});
    setCustomTitle('');
    setCustomBody('');
    setCustomUrl('');
    setSelectedUserIds([]);
    setSelectAllUsers(true);
    setUserSearchQuery('');
  }, []);

  const handlePreview = useCallback(() => {
    refetchPreview();
  }, [refetchPreview]);

  const handleTemplateSelect = useCallback((template: NotificationTemplate) => {
    setSelectedTemplate(template);
    // Reset variables for the new template
    const newVars: Record<string, string> = {};
    template.variables.forEach((v) => {
      newVars[v] = '';
    });
    setVariables(newVars);
  }, []);

  const handleFilterChange = useCallback((field: string, value: any) => {
    setFilters((prev) => {
      if (value === '' || value === undefined || value === null) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleSendConfirm = useCallback(() => {
    const userIdsToSend = !selectAllUsers && selectedUserIds.length > 0 ? selectedUserIds : undefined;
    
    if (sendMode === 'template' && selectedTemplate) {
      sendTemplateMutation.mutate({
        templateCode: selectedTemplate.code,
        targetRole,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
        selectedUserIds: userIdsToSend,
      });
    } else if (sendMode === 'custom') {
      sendCustomMutation.mutate({
        title: customTitle,
        body: customBody,
        url: customUrl || undefined,
        targetRole,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        selectedUserIds: userIdsToSend,
      });
    }
  }, [sendMode, selectedTemplate, targetRole, filters, variables, customTitle, customBody, customUrl, sendTemplateMutation, sendCustomMutation, selectAllUsers, selectedUserIds]);

  // Filter users based on search query
  const filteredRoleUsers = roleUsersData?.users?.filter((user: RoleUser) => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    );
  }) || [];

  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const handleSelectAllToggle = useCallback((checked: boolean) => {
    setSelectAllUsers(checked);
    if (checked) {
      setSelectedUserIds([]);
    }
  }, []);

  const canSend = sendMode === 'template' 
    ? selectedTemplate !== null 
    : customTitle.trim() !== '' && customBody.trim() !== '';

  // Group templates by category
  const templatesByCategory = templatesData?.templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, NotificationTemplate[]>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground">
            Send push notifications to users based on roles and filters
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => sendTestMutation.mutate()}
          disabled={sendTestMutation.isPending}
        >
          {sendTestMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          Send Test to Myself
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Notification
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Send Notification Tab */}
        <TabsContent value="send" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Notification Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Content</CardTitle>
                  <div className="flex gap-4 mt-2">
                    <Button
                      variant={sendMode === 'template' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSendMode('template')}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant={sendMode === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSendMode('custom')}
                    >
                      Custom Message
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sendMode === 'template' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Select Template</Label>
                        <Select
                          value={selectedTemplate?.code || ''}
                          onValueChange={(code) => {
                            const template = templatesData?.templates.find((t) => t.code === code);
                            if (template) handleTemplateSelect(template);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a notification template" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(templatesByCategory).map(([category, templates]) => (
                              <div key={category}>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground capitalize">
                                  {category}
                                </div>
                                {templates.map((template) => (
                                  <SelectItem key={template.code} value={template.code}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={SEVERITY_COLORS[template.severity]} variant="outline">
                                        {template.severity}
                                      </Badge>
                                      {template.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTemplate && (
                        <>
                          <div className="rounded-lg border p-4 bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Bell className="h-4 w-4" />
                              <span className="font-medium">{selectedTemplate.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{selectedTemplate.body}</p>
                            <div className="mt-2 flex gap-2 flex-wrap">
                              <Badge variant="outline">
                                Targets: {selectedTemplate.targetRoles.join(', ')}
                              </Badge>
                            </div>
                          </div>

                          {selectedTemplate.variables.length > 0 && (
                            <div className="space-y-3">
                              <Label>Template Variables</Label>
                              {selectedTemplate.variables.map((variable) => (
                                <div key={variable} className="flex items-center gap-2">
                                  <Label className="w-32 text-sm">{`{{${variable}}}`}</Label>
                                  <Input
                                    value={variables[variable] || ''}
                                    onChange={(e) =>
                                      setVariables((prev) => ({ ...prev, [variable]: e.target.value }))
                                    }
                                    placeholder={`Enter value for ${variable}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-title">Title *</Label>
                        <Input
                          id="custom-title"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Notification title"
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-body">Message *</Label>
                        <Textarea
                          id="custom-body"
                          value={customBody}
                          onChange={(e) => setCustomBody(e.target.value)}
                          placeholder="Notification message"
                          maxLength={500}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          {customBody.length}/500 characters
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-url">Click URL (optional)</Label>
                        <Input
                          id="custom-url"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          placeholder="/dashboard or https://..."
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Target & Filters */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Role</Label>
                    <Select
                      value={targetRole}
                      onValueChange={(value: TargetRole) => {
                        setTargetRole(value);
                        setFilters({});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Filters */}
                  {targetRole !== 'all' && filterOptions?.filters && filterOptions.filters.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <Label>Filters (Optional)</Label>
                      </div>
                      {filterOptions.filters.map((filter: FilterOption) => (
                        <div key={filter.field} className="space-y-1">
                          <Label className="text-sm">{filter.label}</Label>
                          {filter.type === 'boolean' ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={filters[filter.field] === true}
                                onCheckedChange={(checked) =>
                                  handleFilterChange(filter.field, checked ? true : undefined)
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {filters[filter.field] ? 'Yes' : 'Any'}
                              </span>
                            </div>
                          ) : filter.type === 'select' && filter.options ? (
                            <Select
                              value={filters[filter.field] || '_any'}
                              onValueChange={(value) => handleFilterChange(filter.field, value === '_any' ? undefined : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Any" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_any">Any</SelectItem>
                                {filter.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={filters[filter.field] || ''}
                              onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                              placeholder={`Filter by ${filter.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User Selection */}
                  {targetRole !== 'all' && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Select Recipients</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="select-all"
                            checked={selectAllUsers}
                            onCheckedChange={(checked) => handleSelectAllToggle(checked as boolean)}
                          />
                          <Label htmlFor="select-all" className="text-sm cursor-pointer">
                            All {ROLES.find(r => r.value === targetRole)?.label || targetRole}
                          </Label>
                        </div>
                      </div>

                      {!selectAllUsers && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="h-8"
                          />
                          <ScrollArea className="h-48 rounded-md border">
                            {roleUsersLoading ? (
                              <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : filteredRoleUsers.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No users found
                              </div>
                            ) : (
                              <div className="p-2 space-y-1">
                                {filteredRoleUsers.map((user: RoleUser) => (
                                  <div
                                    key={user._id}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                    onClick={() => handleToggleUser(user._id)}
                                  >
                                    <Checkbox
                                      checked={selectedUserIds.includes(user._id)}
                                      onCheckedChange={() => handleToggleUser(user._id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{user.fullName}</p>
                                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    {user.extra && (
                                      <Badge variant="outline" className="text-xs shrink-0">
                                        {user.extra}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                          {selectedUserIds.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {selectedUserIds.length} user(s) selected
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePreview}
                    disabled={previewLoading || (!selectAllUsers && selectedUserIds.length === 0)}
                  >
                    {previewLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    Preview Target Count
                  </Button>

                  {previewData && selectAllUsers && (
                    <div className="rounded-lg border p-4 bg-muted/30">
                      <div className="text-2xl font-bold text-center">
                        {previewData.count.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        users will receive this notification
                      </p>
                      {Object.keys(previewData.breakdown).length > 1 && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          {Object.entries(previewData.breakdown).map(([role, count]) => (
                            <div key={role} className="flex justify-between text-sm">
                              <span className="capitalize">{role}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                className="w-full"
                size="lg"
                disabled={!canSend}
                onClick={() => setShowConfirmDialog(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Pre-configured notification templates for common scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(templatesByCategory).map(([category, templates]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold capitalize mb-3">{category}</h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {templates.map((template) => (
                          <Card key={template.code} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <Badge className={SEVERITY_COLORS[template.severity]}>
                                  {template.severity}
                                </Badge>
                                {template.isActive ? (
                                  <Badge variant="outline" className="text-green-600">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-400">Inactive</Badge>
                                )}
                              </div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm font-medium">{template.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {template.body}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {template.targetRoles.map((role) => (
                                  <Badge key={role} variant="secondary" className="text-xs">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                              {template.variables.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Variables: {template.variables.map(v => `{{${v}}}`).join(', ')}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>
                  View all sent notifications and their delivery status
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['notification-logs'] })}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logsData?.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications sent yet
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData?.data.map((log) => (
                        <React.Fragment key={log._id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                          >
                            <TableCell>
                              {expandedLog === log._id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {log.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {log.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {log.targetRole || 'self'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {log.successCount}/{log.targetCount}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLORS[log.status]}>
                                {log.status === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {log.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                                {log.status === 'partial' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {log.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                          {expandedLog === log._id && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-muted/30">
                                <div className="p-4 space-y-3">
                                  <div>
                                    <span className="font-medium">Message:</span>
                                    <p className="text-sm text-muted-foreground">{log.body}</p>
                                  </div>
                                  <div className="flex gap-4">
                                    <div>
                                      <span className="font-medium">Sent by:</span>
                                      <p className="text-sm">{log.sentByName || log.sentBy}</p>
                                    </div>
                                    {log.templateCode && (
                                      <div>
                                        <span className="font-medium">Template:</span>
                                        <p className="text-sm">{log.templateCode}</p>
                                      </div>
                                    )}
                                  </div>
                                  {log.targetFilters && Object.keys(log.targetFilters).length > 0 && (
                                    <div>
                                      <span className="font-medium">Filters applied:</span>
                                      <p className="text-sm text-muted-foreground">
                                        {JSON.stringify(log.targetFilters)}
                                      </p>
                                    </div>
                                  )}
                                  {log.errors && log.errors.length > 0 && (
                                    <div>
                                      <span className="font-medium text-destructive">Errors ({log.errors.length}):</span>
                                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                                        {log.errors.slice(0, 5).map((error, idx) => (
                                          <li key={idx}>{error.error}</li>
                                        ))}
                                        {log.errors.length > 5 && (
                                          <li>...and {log.errors.length - 5} more</li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>

                  {logsData?.meta && logsData.meta.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logsPage === 1}
                        onClick={() => setLogsPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {logsPage} of {logsData.meta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logsPage === logsData.meta.totalPages}
                        onClick={() => setLogsPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Send Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Notification</DialogTitle>
            <DialogDescription>
              You are about to send a notification. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4" />
                <span className="font-medium">
                  {sendMode === 'template' ? selectedTemplate?.title : customTitle}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {sendMode === 'template' ? selectedTemplate?.body : customBody}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Target:</span>
              <Badge variant="secondary" className="capitalize">
                {ROLES.find((r) => r.value === targetRole)?.label || targetRole}
              </Badge>
            </div>
            {previewData && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Recipients:</span>
                <span className="font-bold">{previewData.count.toLocaleString()}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendConfirm}
              disabled={sendTemplateMutation.isPending || sendCustomMutation.isPending}
            >
              {(sendTemplateMutation.isPending || sendCustomMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;
