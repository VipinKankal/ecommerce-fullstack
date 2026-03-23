import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
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

type AuditLogRow = {
  id: number;
  method?: string;
  path?: string;
  status?: number;
  actor?: string;
  ipAddress?: string;
  durationMs?: number;
  createdAt?: string;
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '-';

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','),
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actorQuery, setActorQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        limit: 250,
      };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (actorQuery.trim()) params.actor = actorQuery.trim();
      if (methodFilter !== 'ALL') params.method = methodFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const response = await api.get(API_ROUTES.admin.auditLogs, { params });
      setLogs(Array.isArray(response.data) ? (response.data as AuditLogRow[]) : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to load audit logs.'));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [actorQuery, dateFrom, dateTo, methodFilter, searchQuery, statusFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const methodOptions = useMemo(
    () =>
      Array.from(
        new Set(logs.map((log) => (log.method || '').trim()).filter(Boolean)),
      ).sort(),
    [logs],
  );

  const exportLogs = () => {
    const rows = [
      ['ID', 'When', 'Method', 'Path', 'Status', 'Actor', 'IP Address', 'Duration Ms'],
      ...logs.map((log) => [
        String(log.id),
        log.createdAt || '',
        log.method || '',
        log.path || '',
        String(log.status ?? ''),
        log.actor || '',
        log.ipAddress || '',
        String(log.durationMs ?? ''),
      ]),
    ];

    downloadCsv('admin-audit-logs.csv', rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin accountability feed for API actions, actors, status codes, and request timing.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" onClick={loadLogs} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outlined" onClick={exportLogs} disabled={logs.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <TextField
            size="small"
            label="Search"
            placeholder="path, status, actor"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <TextField
            size="small"
            label="Actor"
            placeholder="email or username"
            value={actorQuery}
            onChange={(event) => setActorQuery(event.target.value)}
          />
          <TextField
            size="small"
            select
            label="Method"
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
          >
            <MenuItem value="ALL">All Methods</MenuItem>
            {methodOptions.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="200">200</MenuItem>
            <MenuItem value="201">201</MenuItem>
            <MenuItem value="400">400</MenuItem>
            <MenuItem value="401">401</MenuItem>
            <MenuItem value="403">403</MenuItem>
            <MenuItem value="404">404</MenuItem>
            <MenuItem value="500">500</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="contained" onClick={loadLogs} disabled={loading}>
            Apply Filters
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setSearchQuery('');
              setActorQuery('');
              setMethodFilter('ALL');
              setStatusFilter('ALL');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Reset
          </Button>
        </div>

        <TableContainer
          component={Paper}
          sx={{ borderRadius: '20px', boxShadow: 'none', border: '1px solid #e2e8f0' }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>When</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Path</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No audit logs matched the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.actor || '-'}</TableCell>
                    <TableCell>{log.method || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 340 }}>
                      <div className="truncate">{log.path || '-'}</div>
                    </TableCell>
                    <TableCell>{log.status ?? '-'}</TableCell>
                    <TableCell>{log.ipAddress || '-'}</TableCell>
                    <TableCell>{log.durationMs ?? 0} ms</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default AdminAuditLogs;
