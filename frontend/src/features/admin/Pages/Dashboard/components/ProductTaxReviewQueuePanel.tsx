import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

type ProductTaxReviewRow = {
  id?: number | string;
  productId?: number | string;
  productTitle?: string;
  suggestedHsnCode?: string;
  requestedHsnCode?: string;
  overrideReason?: string;
  reviewStatus?: string;
  reviewerNote?: string;
};

const ProductTaxReviewQueuePanel = () => {
  const [rows, setRows] = useState<ProductTaxReviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { reviewStatus: string; reviewerNote: string }>
  >({});

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ROUTES.admin.productTaxReviews.base);
      const nextRows = Array.isArray(response.data)
        ? (response.data as ProductTaxReviewRow[])
        : [];
      setRows(nextRows);
      setDrafts((current) => {
        const next = { ...current };
        nextRows.forEach((row) => {
          const key = String(row.id || '');
          if (!next[key]) {
            next[key] = {
              reviewStatus:
                row.reviewStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED',
              reviewerNote: row.reviewerNote || '',
            };
          }
        });
        return next;
      });
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to load review queue'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const handleSubmit = async (id: number | string) => {
    const key = String(id);
    const draft = drafts[key] || { reviewStatus: 'APPROVED', reviewerNote: '' };
    setSubmittingId(key);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(API_ROUTES.admin.productTaxReviews.byId(id), {
        reviewStatus: draft.reviewStatus,
        reviewerNote: draft.reviewerNote || undefined,
      });
      setSuccess('Review saved.');
      await loadRows();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to update review'));
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            HSN Override Review Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review seller override requests before they leave tax-review-pending state.
          </Typography>
        </div>
        <Button variant="outlined" onClick={loadRows} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
        <Table sx={{ minWidth: 1100 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Suggested</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Decision</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reviewer Note</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No tax review requests are waiting right now.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const key = String(row.id || '');
                const draft = drafts[key] || {
                  reviewStatus: 'APPROVED',
                  reviewerNote: '',
                };
                return (
                  <TableRow key={key} hover>
                    <TableCell>
                      <div className="text-sm font-semibold text-slate-900">
                        {row.productTitle || `Product ${row.productId}`}
                      </div>
                      <div className="text-xs text-slate-500">#{row.productId}</div>
                    </TableCell>
                    <TableCell>{row.suggestedHsnCode || '-'}</TableCell>
                    <TableCell>{row.requestedHsnCode || '-'}</TableCell>
                    <TableCell>{row.overrideReason || '-'}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={draft.reviewStatus}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [key]: {
                              ...draft,
                              reviewStatus: event.target.value,
                            },
                          }))
                        }
                      >
                        <MenuItem value="APPROVED">Approved</MenuItem>
                        <MenuItem value="REJECTED">Rejected</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={draft.reviewerNote}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [key]: {
                              ...draft,
                              reviewerNote: event.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSubmit(key)}
                        disabled={submittingId === key}
                      >
                        Save Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ProductTaxReviewQueuePanel;
