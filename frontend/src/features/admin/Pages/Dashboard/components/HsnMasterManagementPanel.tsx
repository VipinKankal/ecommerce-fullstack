import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

type HsnMasterRow = {
  id?: number | string;
  ruleCode?: string;
  uiCategoryKey?: string;
  displayLabel?: string;
  hsnCode?: string;
  mappingMode?: string;
  approvalStatus?: string;
  published?: boolean;
};

const toDateValue = () => new Date().toISOString().slice(0, 10);

const HsnMasterManagementPanel = () => {
  const [rows, setRows] = useState<HsnMasterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    ruleCode: 'HSN_APPAREL_AUTO',
    uiCategoryKey: 'men_shirts',
    displayLabel: 'Men Shirts',
    constructionType: 'WOVEN',
    gender: 'MEN',
    fiberFamily: '',
    hsnChapter: '62',
    hsnCode: '6205',
    taxClass: 'APPAREL_STANDARD',
    mappingMode: 'DIRECT',
    effectiveFrom: toDateValue(),
    approvalStatus: 'CA_APPROVED',
    sourceReference: '',
    notes: '',
  });

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ROUTES.admin.hsnMaster.base);
      setRows(Array.isArray(response.data) ? (response.data as HsnMasterRow[]) : []);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to load HSN master'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(API_ROUTES.admin.hsnMaster.base, {
        ruleCode: form.ruleCode,
        uiCategoryKey: form.uiCategoryKey,
        displayLabel: form.displayLabel,
        constructionType: form.constructionType || undefined,
        gender: form.gender || undefined,
        fiberFamily: form.fiberFamily || undefined,
        hsnChapter: form.hsnChapter || undefined,
        hsnCode: form.hsnCode || undefined,
        taxClass: form.taxClass || undefined,
        mappingMode: form.mappingMode,
        effectiveFrom: form.effectiveFrom,
        approvalStatus: form.approvalStatus,
        sourceReference: form.sourceReference || undefined,
        notes: form.notes || undefined,
      });
      setSuccess('HSN master rule saved.');
      await loadRows();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to save HSN rule'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: number | string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.patch(API_ROUTES.admin.hsnMaster.publish(id));
      setSuccess('HSN rule published.');
      await loadRows();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to publish HSN rule'));
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            HSN Master Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seed and publish category-to-HSN mappings for seller auto-suggestions.
          </Typography>
        </div>
        <Button variant="outlined" onClick={loadRows} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField size="small" label="Rule Code" value={form.ruleCode} onChange={(event) => setForm((current) => ({ ...current, ruleCode: event.target.value }))} />
        <TextField size="small" label="UI Category Key" value={form.uiCategoryKey} onChange={(event) => setForm((current) => ({ ...current, uiCategoryKey: event.target.value }))} />
        <TextField size="small" label="Display Label" value={form.displayLabel} onChange={(event) => setForm((current) => ({ ...current, displayLabel: event.target.value }))} />
        <TextField select size="small" label="Mapping Mode" value={form.mappingMode} onChange={(event) => setForm((current) => ({ ...current, mappingMode: event.target.value }))}>
          <MenuItem value="DIRECT">Direct</MenuItem>
          <MenuItem value="FIBER_REQUIRED">Fiber required</MenuItem>
          <MenuItem value="RULE_BASED">Rule based</MenuItem>
        </TextField>
        <TextField size="small" label="Construction" value={form.constructionType} onChange={(event) => setForm((current) => ({ ...current, constructionType: event.target.value }))} />
        <TextField size="small" label="Gender" value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} />
        <TextField size="small" label="Fibre Family" value={form.fiberFamily} onChange={(event) => setForm((current) => ({ ...current, fiberFamily: event.target.value }))} />
        <TextField size="small" label="HSN Chapter" value={form.hsnChapter} onChange={(event) => setForm((current) => ({ ...current, hsnChapter: event.target.value }))} />
        <TextField size="small" label="HSN Code" value={form.hsnCode} onChange={(event) => setForm((current) => ({ ...current, hsnCode: event.target.value }))} />
        <TextField size="small" label="Tax Class" value={form.taxClass} onChange={(event) => setForm((current) => ({ ...current, taxClass: event.target.value }))} />
        <TextField size="small" type="date" label="Effective From" value={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" label="Source Reference" value={form.sourceReference} onChange={(event) => setForm((current) => ({ ...current, sourceReference: event.target.value }))} />
        <TextField size="small" label="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} sx={{ gridColumn: { md: 'span 2' } }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="contained" onClick={handleCreate} disabled={submitting}>
          Save HSN Rule
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="py-4 text-center"><CircularProgress size={24} /></div>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No HSN master rows found.
          </Typography>
        ) : (
          rows.map((row) => (
            <div key={String(row.id || row.ruleCode)} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {row.displayLabel || row.uiCategoryKey}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.uiCategoryKey} · {row.hsnCode || '-'} · {row.mappingMode || '-'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip size="small" variant="outlined" label={row.approvalStatus || '-'} />
                  <Chip size="small" color={row.published ? 'success' : 'default'} label={row.published ? 'Published' : 'Draft'} />
                  {!row.published && row.id != null && (
                    <Button size="small" variant="outlined" onClick={() => handlePublish(row.id!)}>
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Paper>
  );
};

export default HsnMasterManagementPanel;
