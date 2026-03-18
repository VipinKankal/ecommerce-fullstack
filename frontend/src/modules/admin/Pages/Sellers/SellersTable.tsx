import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAppDispatch, useAppSelector } from "../../../State/Store";
import {
  adminUpdateSellerStatus,
  sellersList,
} from "../../../State/Backend/MasterApiThunks";

const STATUS_OPTIONS = [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
  "BANNED",
  "CLOSED",
] as const;

const SellersTable = () => {
  const dispatch = useAppDispatch();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const { loading, error, responses } = useAppSelector((state) => state.masterApi);
  const apiSellers = responses.sellersList;

  useEffect(() => {
    dispatch(sellersList(undefined));
  }, [dispatch]);

  const sellers = useMemo(() => {
    if (!Array.isArray(apiSellers)) return [];
    return apiSellers.map((seller: any) => ({
      id: seller.id,
      sellerName: seller.sellerName || "N/A",
      email: seller.email || "N/A",
      mobile: seller.mobileNumber || seller.mobile || "N/A",
      gstin: seller.GSTIN || seller.gstin || seller.businessDetails?.gstNumber || "N/A",
      businessName: seller.businessDetails?.businessName || "N/A",
      businessType: seller.businessDetails?.businessType || "N/A",
      panNumber: seller.businessDetails?.panNumber || "N/A",
      status: seller.accountStatus || "PENDING_VERIFICATION",
      pickupAddress: seller.pickupAddress,
      bankDetails: seller.bankDetails,
      kycDetails: seller.kycDetails,
      storeDetails: seller.storeDetails,
      emailVerified: seller.emailVerified,
      createdAt: seller.createdAt,
    }));
  }, [apiSellers]);

  const sellerStats = useMemo(() => {
    return {
      total: sellers.length,
      active: sellers.filter((seller) => seller.status === "ACTIVE").length,
      pending: sellers.filter((seller) => seller.status === "PENDING_VERIFICATION").length,
      suspended: sellers.filter((seller) => seller.status === "SUSPENDED").length,
    };
  }, [sellers]);

  const filteredSellers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sellers.filter((seller) => {
      const matchesStatus = statusFilter === "ALL" || seller.status === statusFilter;
      const searchableText = [
        seller.sellerName,
        seller.email,
        seller.mobile,
        seller.businessName,
        seller.gstin,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || searchableText.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [searchQuery, sellers, statusFilter]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    await dispatch(adminUpdateSellerStatus({ id, status: newStatus })).unwrap();
    await dispatch(sellersList(undefined)).unwrap();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "PENDING_VERIFICATION":
        return "warning";
      case "SUSPENDED":
      case "BANNED":
        return "error";
      case "DEACTIVATED":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Sellers", value: sellerStats.total, tone: "bg-slate-50 text-slate-700 border-slate-100" },
          { title: "Active", value: sellerStats.active, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { title: "Pending", value: sellerStats.pending, tone: "bg-amber-50 text-amber-700 border-amber-100" },
          { title: "Suspended", value: sellerStats.suspended, tone: "bg-rose-50 text-rose-700 border-rose-100" },
        ].map((card) => (
          <div key={card.title} className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Sellers</p>
            <p className="mt-3 text-sm font-semibold opacity-80">{card.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <Paper sx={{ p: 3, borderRadius: "24px", boxShadow: "none", border: "1px solid #eef2f7" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Sellers Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review seller business details, KYC references, and account status.
            </Typography>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TextField
              size="small"
              placeholder="Search seller, email, GST, business"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius: "20px", boxShadow: "none", border: "1px solid #eef2f7" }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Seller Details</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Business</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Compliance</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && sellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    No sellers match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers.map((seller) => (
                  <TableRow key={seller.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {seller.sellerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {seller.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {seller.mobile}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {seller.businessName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {seller.businessType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        GST: {seller.gstin}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Chip size="small" label={`PAN ${seller.panNumber}`} variant="outlined" />
                        <Chip
                          size="small"
                          color={seller.emailVerified ? "success" : "warning"}
                          label={seller.emailVerified ? "Email Verified" : "Email Pending"}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={seller.status.replace(/_/g, " ")}
                        color={getStatusColor(seller.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="small"
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={() => setSelectedSeller(seller)}
                        >
                          View
                        </Button>
                        <FormControl size="small" sx={{ width: 190 }}>
                          <Select
                            value={seller.status}
                            onChange={(e) => handleStatusUpdate(seller.id, e.target.value)}
                            sx={{ fontSize: "0.875rem" }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status.replace(/_/g, " ")}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(selectedSeller)} onClose={() => setSelectedSeller(null)} fullWidth maxWidth="md">
        <DialogTitle>Seller Details</DialogTitle>
        <DialogContent>
          {selectedSeller && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Paper sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #eef2f7" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                    Personal & Business
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Name:</strong> {selectedSeller.sellerName}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {selectedSeller.email}</Typography>
                    <Typography variant="body2"><strong>Mobile:</strong> {selectedSeller.mobile}</Typography>
                    <Typography variant="body2"><strong>Business:</strong> {selectedSeller.businessName}</Typography>
                    <Typography variant="body2"><strong>Type:</strong> {selectedSeller.businessType}</Typography>
                    <Typography variant="body2"><strong>GST:</strong> {selectedSeller.gstin}</Typography>
                    <Typography variant="body2"><strong>PAN:</strong> {selectedSeller.panNumber}</Typography>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #eef2f7" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                    Store & Address
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Store:</strong> {selectedSeller.storeDetails?.storeName || "N/A"}</Typography>
                    <Typography variant="body2"><strong>Category:</strong> {selectedSeller.storeDetails?.primaryCategory || "N/A"}</Typography>
                    <Typography variant="body2"><strong>Support Email:</strong> {selectedSeller.storeDetails?.supportEmail || "N/A"}</Typography>
                    <Typography variant="body2"><strong>Support Phone:</strong> {selectedSeller.storeDetails?.supportPhone || "N/A"}</Typography>
                    <Typography variant="body2">
                      <strong>Pickup Address:</strong>{" "}
                      {[
                        selectedSeller.pickupAddress?.address,
                        selectedSeller.pickupAddress?.locality,
                        selectedSeller.pickupAddress?.city,
                        selectedSeller.pickupAddress?.state,
                        selectedSeller.pickupAddress?.pinCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </Typography>
                  </Stack>
                </Paper>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Paper sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #eef2f7" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                    Bank Details
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Account Holder:</strong> {selectedSeller.bankDetails?.accountHolderName || "N/A"}</Typography>
                    <Typography variant="body2"><strong>Bank:</strong> {selectedSeller.bankDetails?.bankName || "N/A"}</Typography>
                    <Typography variant="body2"><strong>Account No:</strong> {selectedSeller.bankDetails?.accountNumber || "N/A"}</Typography>
                    <Typography variant="body2"><strong>IFSC:</strong> {selectedSeller.bankDetails?.ifscCode || "N/A"}</Typography>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: "16px", boxShadow: "none", border: "1px solid #eef2f7" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                    KYC References
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>PAN URL:</strong> {selectedSeller.kycDetails?.panCardUrl || "N/A"}</Typography>
                    <Typography variant="body2"><strong>Aadhaar URL:</strong> {selectedSeller.kycDetails?.aadhaarCardUrl || "N/A"}</Typography>
                    <Typography variant="body2"><strong>GST Certificate:</strong> {selectedSeller.kycDetails?.gstCertificateUrl || "N/A"}</Typography>
                  </Stack>
                </Paper>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSeller(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SellersTable;
