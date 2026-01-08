import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useAuth } from "@/contexts/AuthContext";
import { alertsAPI } from "@/services/api";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Eye,
  X,
  Car,
  Siren
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Alert {
  _id: string;
  type: string;
  source?: 'alert' | 'sos';
  status: string;
  severity?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

const AlertDetailsModal = ({ alert, open, onOpenChange }: { alert: Alert | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {alert.source === 'sos' ? (
              <Siren className="w-5 h-5 text-purple-500" />
            ) : (
              <Car className="w-5 h-5 text-orange-500" />
            )}
            {alert.type} Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn(
                alert.status === 'resolved'
                  ? "bg-green-500/20 text-green-500"
                  : "bg-red-500/20 text-red-500"
              )}>
                {alert.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="outline">
                {alert.source === 'sos' ? 'SOS' : 'Accident'}
              </Badge>
            </div>
          </div>

          {alert.location && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <span>
                  {alert.location.address || `${alert.location.latitude?.toFixed(6)}, ${alert.location.longitude?.toFixed(6)}`}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(alert.createdAt).toLocaleString()}</p>
            </div>
            {alert.resolvedAt && (
              <div>
                <p className="text-muted-foreground">Resolved</p>
                <p>{new Date(alert.resolvedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

type SourceFilter = 'all' | 'alert' | 'sos';

const UserAlertsPage = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchUserAlerts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Fetch combined alerts (both SOS and device-triggered alerts) with pagination
      const response = await alertsAPI.getCombined(sourceFilter, {
        page,
        limit: 10,
      });
      // Handle paginated response structure { data: [...], meta: {...} }
      const combinedAlerts = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);

      // Set pagination info
      setTotalPages(response.data?.meta?.totalPages || 1);
      setTotalItems(response.data?.meta?.total || combinedAlerts.length);

      // Map to standard Alert format
      const userAlerts: Alert[] = combinedAlerts.map((item: any) => ({
        _id: item._id,
        type: item.type || (item.source === 'sos' ? 'SOS' : 'Accident'),
        source: item.source || 'alert',
        status: item.status,
        severity: item.severity || 'critical',
        location: item.location || (item.victimLocation ? {
          latitude: item.victimLocation.coordinates?.[1],
          longitude: item.victimLocation.coordinates?.[0],
        } : undefined),
        createdAt: item.createdAt,
        resolvedAt: item.resolvedAt,
      }));

      setAlerts(userAlerts);
    } catch (error: unknown) {
      console.error("Failed to fetch user alerts:", error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sourceFilter, page]);

  useEffect(() => {
    fetchUserAlerts();
  }, [fetchUserAlerts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [sourceFilter, debouncedSearchQuery]);

  const handleSourceFilterChange = (source: SourceFilter) => {
    setSourceFilter(source);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewAlert = async (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
    
    // Mark the alert as viewed by this user (reduces sidebar badge count)
    try {
      await alertsAPI.markAsViewed(alert._id, alert.source || 'alert');
      // Dispatch custom event to notify sidebars to refresh their badge count
      window.dispatchEvent(new CustomEvent('alert-viewed'));
    } catch (error) {
      // Silently fail - viewing should still work even if marking fails
      console.error('Failed to mark alert as viewed:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const searchLower = searchQuery.toLowerCase();
    const alertType = alert.type || '';
    const alertStatus = alert.status || '';
    return alertType.toLowerCase().includes(searchLower) ||
      alertStatus.toLowerCase().includes(searchLower);
  });

  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => a.status !== 'resolved').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    alerts: alerts.filter(a => a.source === 'alert').length,
    sos: alerts.filter(a => a.source === 'sos').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-orange-500" />
            My Alerts
          </h1>
          <p className="text-muted-foreground">View all your SOS and accident alerts</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchUserAlerts(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by type or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sourceFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSourceFilterChange('all')}
            className="gap-1"
          >
            <AlertTriangle className="w-4 h-4" />
            All
          </Button>
          <Button
            variant={sourceFilter === 'alert' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSourceFilterChange('alert')}
            className={cn("gap-1", sourceFilter === 'alert' && "bg-orange-500 hover:bg-orange-600")}
          >
            <Car className="w-4 h-4" />
            Accidents
          </Button>
          <Button
            variant={sourceFilter === 'sos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSourceFilterChange('sos')}
            className={cn("gap-1", sourceFilter === 'sos' && "bg-purple-500 hover:bg-purple-600")}
          >
            <Siren className="w-4 h-4" />
            SOS
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert._id}
              className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    alert.source === 'sos'
                      ? "bg-purple-500/20"
                      : alert.status === 'resolved'
                        ? "bg-green-500/20"
                        : "bg-orange-500/20"
                  )}>
                    {alert.source === 'sos' ? (
                      <Siren className="w-6 h-6 text-purple-500" />
                    ) : alert.status === 'resolved' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Car className="w-6 h-6 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{alert.type || 'Alert'}</p>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        alert.source === 'sos'
                          ? "border-purple-500/50 text-purple-500"
                          : "border-orange-500/50 text-orange-500"
                      )}>
                        {alert.source === 'sos' ? 'SOS' : 'Accident'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    alert.status === 'resolved'
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  )}>
                    {alert.status || 'pending'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAlert(alert)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Alerts Found</h3>
          <p className="text-muted-foreground">
            You haven't triggered any alerts yet
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Alert Details Modal */}
      <AlertDetailsModal
        alert={selectedAlert}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default UserAlertsPage;
