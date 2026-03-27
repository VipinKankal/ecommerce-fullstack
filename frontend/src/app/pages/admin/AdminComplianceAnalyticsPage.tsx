import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
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
import { fetchComplianceAnalytics } from 'app/complianceNotes';
import {
  ComplianceAnalyticsFilters,
  ComplianceAnalyticsSummary,
} from 'app/complianceNotes/types';

const defaultAnalytics: ComplianceAnalyticsSummary = {
  totalNotes: 0,
  draftCount: 0,
  publishedCount: 0,
  archivedCount: 0,
  highPriorityCount: 0,
  sellerCount: 0,
  readRatePercentage: 0,
  acknowledgementRatePercentage: 0,
  byType: {},
  byPriority: {},
  impactTopNotes: [],
};

const NOTE_TYPES = ['ALL', 'GST', 'HSN', 'TCS', 'POLICY', 'CAMPAIGN', 'WARNING', 'GENERAL'];

type AnalyticsFiltersState = {
  noteType: string;
  fromDate: string;
  toDate: string;
  minImpactedSellers: string;
};

const defaultFilters: AnalyticsFiltersState = {
  noteType: 'ALL',
  fromDate: '',
  toDate: '',
  minImpactedSellers: '',
};

const AdminComplianceAnalyticsPage = () => {
  const [analytics, setAnalytics] =
    useState<ComplianceAnalyticsSummary>(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFiltersState>(defaultFilters);

  const load = async (nextFilters: AnalyticsFiltersState) => {
    setLoading(true);
    try {
      const requestFilters: ComplianceAnalyticsFilters = {
        noteType:
          nextFilters.noteType === 'ALL'
            ? 'ALL'
            : (nextFilters.noteType as ComplianceAnalyticsFilters['noteType']),
        fromDate: nextFilters.fromDate || undefined,
        toDate: nextFilters.toDate || undefined,
        minImpactedSellers:
          nextFilters.minImpactedSellers.trim() === ''
            ? undefined
            : Number(nextFilters.minImpactedSellers),
      };
      const response = await fetchComplianceAnalytics(requestFilters);
      setAnalytics(response);
      setError(null);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load compliance analytics',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(defaultFilters);
  }, []);

  const typeRows = useMemo(
    () =>
      Object.entries(analytics.byType).map(([type, count]) => ({
        type,
        count,
      })),
    [analytics.byType],
  );

  const priorityRows = useMemo(
    () =>
      Object.entries(analytics.byPriority).map(([priority, count]) => ({
        priority,
        count,
      })),
    [analytics.byPriority],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Compliance Analytics
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
          Read-rate, acknowledgment-rate, and product-impact trends for
          published compliance communication.
        </Typography>
      </div>

      <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            size="small"
            select
            label="Type"
            value={filters.noteType}
            onChange={(event) =>
              setFilters((current) => ({ ...current, noteType: event.target.value }))
            }
            sx={{ minWidth: 180 }}
          >
            {NOTE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label="From"
            value={filters.fromDate}
            onChange={(event) =>
              setFilters((current) => ({ ...current, fromDate: event.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={filters.toDate}
            onChange={(event) =>
              setFilters((current) => ({ ...current, toDate: event.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="number"
            label="Min Impacted Sellers"
            value={filters.minImpactedSellers}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                minImpactedSellers: event.target.value,
              }))
            }
            sx={{ maxWidth: 220 }}
          />
          <Button variant="contained" onClick={() => void load(filters)}>
            Apply Filters
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setFilters(defaultFilters);
              void load(defaultFilters);
            }}
          >
            Reset
          </Button>
        </div>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && (
        <div className="flex justify-center py-8">
          <CircularProgress />
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Notes', value: analytics.totalNotes, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
              { label: 'Published', value: analytics.publishedCount, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              { label: 'Read Rate %', value: analytics.readRatePercentage.toFixed(2), tone: 'bg-violet-50 text-violet-700 border-violet-100' },
              { label: 'Ack Rate %', value: analytics.acknowledgementRatePercentage.toFixed(2), tone: 'bg-amber-50 text-amber-700 border-amber-100' },
            ].map((card) => (
              <div key={card.label} className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                  Analytics
                </p>
                <p className="mt-2 text-sm font-semibold">{card.label}</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Notes By Type
              </Typography>
              <div className="flex flex-wrap gap-2">
                {typeRows.map((row) => (
                  <Chip
                    key={row.type}
                    variant="outlined"
                    label={`${row.type}: ${row.count}`}
                  />
                ))}
                {typeRows.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No type analytics available.
                  </Typography>
                )}
              </div>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Notes By Priority
              </Typography>
              <div className="flex flex-wrap gap-2">
                {priorityRows.map((row) => (
                  <Chip
                    key={row.priority}
                    color={row.priority === 'CRITICAL' ? 'error' : 'default'}
                    variant="outlined"
                    label={`${row.priority}: ${row.count}`}
                  />
                ))}
                {priorityRows.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No priority analytics available.
                  </Typography>
                )}
              </div>
            </Paper>
          </div>

          <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Product Impact Top Notes
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Note</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Impact</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Impacted Sellers</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Ack %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.impactTopNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No impact analytics available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.impactTopNotes.map((row) => (
                      <TableRow key={row.noteId}>
                        <TableCell>{row.title || `Note #${row.noteId}`}</TableCell>
                        <TableCell>{row.noteType || '-'}</TableCell>
                        <TableCell>{row.priority || '-'}</TableCell>
                        <TableCell>{row.impactedProductCount ?? 0}</TableCell>
                        <TableCell>{row.impactedSellerCount ?? 0}</TableCell>
                        <TableCell>
                          {(row.acknowledgementRatePercentage ?? 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </div>
  );
};

export default AdminComplianceAnalyticsPage;
