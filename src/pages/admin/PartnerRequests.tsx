import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Shield,
  Trees,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  Trash2,
  Clock,
  Mail,
  Phone,
  MapPin,
  FileText,
  Loader2,
  Filter,
} from "lucide-react";
import { partnersAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PartnerRequest {
  _id: string;
  partnerType: "hospital" | "police" | "ranger";
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  registrationNumber?: string;
  specialization?: string;
  hospitalType?: "government" | "private"; // For hospitals only
  jurisdiction?: string;
  coverageArea?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  additionalInfo?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
}

const partnerTypeConfig = {
  hospital: { icon: Building2, color: "text-red-500", bgColor: "bg-red-500/10", label: "Hospital" },
  police: { icon: Shield, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Police" },
  ranger: { icon: Trees, color: "text-green-500", bgColor: "bg-green-500/10", label: "Ranger" },
};

const statusConfig = {
  pending: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", label: "Pending" },
  approved: { color: "bg-green-500/10 text-green-600 border-green-500/30", label: "Approved" },
  rejected: { color: "bg-red-500/10 text-red-600 border-red-500/30", label: "Rejected" },
};

const PartnerRequests = () => {
  const { isSuperAdmin } = useAuth();
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await partnersAPI.getAll(
        statusFilter !== 'all' ? statusFilter : undefined,
        {
          page,
          limit: 10,
          search: debouncedSearchQuery || undefined,
        }
      );
      setRequests(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalItems(response.data.meta.total);
    } catch {
      toast.error("Failed to load partner requests");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, debouncedSearchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const fetchStats = async () => {
    try {
      const response = await partnersAPI.getStats();
      setStats(response.data);
    } catch {
      // stats failure shouldn't block UI
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    setIsUpdating(true);
    try {
      await partnersAPI.update(id, { status, reviewNotes });
      toast.success(`Request ${status} successfully`);
      fetchRequests();
      fetchStats();
      setIsDetailOpen(false);
      setReviewNotes("");
    } catch {
      toast.error("Failed to update request status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      await partnersAPI.delete(id);
      toast.success("Request deleted successfully");
      fetchRequests();
      fetchStats();
      setIsDetailOpen(false);
    } catch {
      toast.error("Failed to delete request");
    }
  };

  // Server-side filtering for search and status - only type filter is client-side
  const filteredRequests = requests.filter((request) => {
    const matchesType = typeFilter === "all" || request.partnerType === typeFilter;
    return matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Partner Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage partnership applications from organizations
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchRequests(); fetchStats(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by organization, contact, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hospital">Hospital</SelectItem>
            <SelectItem value="police">Police</SelectItem>
            <SelectItem value="ranger">Ranger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "No partner requests have been submitted yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const typeConfig = partnerTypeConfig[request.partnerType];
            const TypeIcon = typeConfig.icon;
            const status = statusConfig[request.status];

            return (
              <Card
                key={request._id}
                className="bg-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedRequest(request);
                  setReviewNotes(request.reviewNotes || "");
                  setIsDetailOpen(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${typeConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">
                            {request.organizationName}
                          </h3>
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.contactPerson} • {request.email}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {request.city}, {request.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          isLoading={isLoading}
        />
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const typeConfig = partnerTypeConfig[selectedRequest.partnerType];
                    const TypeIcon = typeConfig.icon;
                    return (
                      <div className={`w-12 h-12 rounded-xl ${typeConfig.bgColor} flex items-center justify-center`}>
                        <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <DialogTitle>{selectedRequest.organizationName}</DialogTitle>
                    <Badge variant="outline" className={statusConfig[selectedRequest.status].color + " mt-1"}>
                      {statusConfig[selectedRequest.status].label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{selectedRequest.contactPerson}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedRequest.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedRequest.phone}</p>
                      </div>
                    </div>
                    {selectedRequest.registrationNumber && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Registration No.</p>
                          <p className="font-medium">{selectedRequest.registrationNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Address
                  </h4>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm">
                      {selectedRequest.address}, {selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pincode}
                    </p>
                  </div>
                </div>

                {/* GPS Coordinates */}
                {(selectedRequest.latitude || selectedRequest.longitude) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      GPS Coordinates
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Latitude</p>
                          <p className="font-medium">{selectedRequest.latitude || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Longitude</p>
                          <p className="font-medium">{selectedRequest.longitude || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    {selectedRequest.latitude && selectedRequest.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <MapPin className="w-4 h-4" />
                        View on Google Maps
                      </a>
                    )}
                  </div>
                )}

                {/* Additional Details */}
                {(selectedRequest.specialization || selectedRequest.jurisdiction || selectedRequest.coverageArea || selectedRequest.hospitalType) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Additional Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRequest.hospitalType && (
                        <div>
                          <p className="text-xs text-muted-foreground">Hospital Type</p>
                          <p className="font-medium capitalize">
                            <span className={selectedRequest.hospitalType === 'government' ? 'text-blue-600' : 'text-green-600'}>
                              {selectedRequest.hospitalType} Hospital
                            </span>
                          </p>
                        </div>
                      )}
                      {selectedRequest.specialization && (
                        <div>
                          <p className="text-xs text-muted-foreground">Specialization</p>
                          <p className="font-medium">{selectedRequest.specialization}</p>
                        </div>
                      )}
                      {selectedRequest.jurisdiction && (
                        <div>
                          <p className="text-xs text-muted-foreground">Jurisdiction</p>
                          <p className="font-medium">{selectedRequest.jurisdiction}</p>
                        </div>
                      )}
                      {selectedRequest.coverageArea && (
                        <div>
                          <p className="text-xs text-muted-foreground">Coverage Area</p>
                          <p className="font-medium">{selectedRequest.coverageArea}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {selectedRequest.additionalInfo && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Additional Information
                    </h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRequest.additionalInfo}</p>
                  </div>
                )}

                {/* Review Notes */}
                {selectedRequest.status === "pending" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Review Notes (Optional)
                    </h4>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about this request..."
                      rows={3}
                    />
                  </div>
                )}

                {/* Existing Review Notes */}
                {selectedRequest.reviewNotes && selectedRequest.status !== "pending" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Review Notes
                    </h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRequest.reviewNotes}</p>
                    {selectedRequest.reviewedAt && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed on {formatDate(selectedRequest.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                  <span>Submitted: {formatDate(selectedRequest.createdAt)}</span>
                  <span>Updated: {formatDate(selectedRequest.updatedAt)}</span>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedRequest.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                      onClick={() => handleStatusUpdate(selectedRequest._id, "approved")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      onClick={() => handleStatusUpdate(selectedRequest._id, "rejected")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                      Reject
                    </Button>
                  </>
                )}
                {isSuperAdmin && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedRequest._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerRequests;
