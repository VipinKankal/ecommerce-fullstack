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

type TaxRuleRow = {
  id?: number | string;
  ruleCode?: string;
  ruleType?: string;
  taxClass?: string;
  valueBasis?: string;
  ratePercentage?: number | string;
  effectiveFrom?: string;
  approvalStatus?: string;
  published?: boolean;
};

const toDateValue = () => new Date().toISOString().slice(0, 10);

const TaxRuleManagementPanel = () => {
  const [rows, setRows] = useState<TaxRuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    ruleCode: 'GST_APPAREL_V3',
    ruleType: 'GST',
    taxClass: 'APPAREL_STANDARD',
    valueBasis: 'SELLING_PRICE_PER_PIECE',
    ratePercentage: '',
    minTaxableValue: '',
    maxTaxableValue: '',
    effectiveFrom: toDateValue(),
    sourceReference: '',
    notes: '',
    approvalStatus: 'CA_APPROVED',
    approvedAt: toDateValue(),
    approvedBy: '',
    signedMemoReference: '',
  });

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ROUTES.admin.taxRules.base);
      setRows(Array.isArray(response.data) ? (response.data as TaxRuleRow[]) : []);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to load tax rules'));
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
      await api.post(API_ROUTES.admin.taxRules.base, {
        ruleCode: form.ruleCode,
        ruleType: form.ruleType,
        taxClass: form.taxClass,
        valueBasis: form.valueBasis,
        minTaxableValue: Number(form.minTaxableValue || 0),
        maxTaxableValue: form.maxTaxableValue
          ? Number(form.maxTaxableValue)
          : undefined,
        ratePercentage: Number(form.ratePercentage || 0),
        effectiveFrom: form.effectiveFrom,
        sourceReference: form.sourceReference || undefined,
        notes: form.notes || undefined,
        approvalStatus: form.approvalStatus,
        approvedAt: form.approvedAt,
        approvedBy: form.approvedBy || undefined,
        signedMemoReference: form.signedMemoReference || undefined,
      });
      setSuccess('Tax rule saved.');
      await loadRows();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to save tax rule'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: number | string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.patch(API_ROUTES.admin.taxRules.publish(id));
      setSuccess('Tax rule published.');
      await loadRows();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Failed to publish tax rule'));
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Tax Rule Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create CA-approved GST/TCS rule versions and publish active ones.
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
        <TextField select size="small" label="Rule Type" value={form.ruleType} onChange={(event) => setForm((current) => ({ ...current, ruleType: event.target.value }))}>
          <MenuItem value="GST">GST</MenuItem>
          <MenuItem value="TCS">TCS</MenuItem>
        </TextField>
        <TextField size="small" label="Tax Class" value={form.taxClass} onChange={(event) => setForm((current) => ({ ...current, taxClass: event.target.value }))} />
        <TextField select size="small" label="Value Basis" value={form.valueBasis} onChange={(event) => setForm((current) => ({ ...current, valueBasis: event.target.value }))}>
          <MenuItem value="SELLING_PRICE_PER_PIECE">Selling price per piece</MenuItem>
          <MenuItem value="TAXABLE_VALUE">Taxable value</MenuItem>
        </TextField>
        <TextField size="small" type="number" label="Rate %" value={form.ratePercentage} onChange={(event) => setForm((current) => ({ ...current, ratePercentage: event.target.value }))} />
        <TextField size="small" type="number" label="Min Value" value={form.minTaxableValue} onChange={(event) => setForm((current) => ({ ...current, minTaxableValue: event.target.value }))} />
        <TextField size="small" type="number" label="Max Value" value={form.maxTaxableValue} onChange={(event) => setForm((current) => ({ ...current, maxTaxableValue: event.target.value }))} />
        <TextField size="small" type="date" label="Effective From" value={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" type="date" label="Approved At" value={form.approvedAt} onChange={(event) => setForm((current) => ({ ...current, approvedAt: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" label="Approved By" value={form.approvedBy} onChange={(event) => setForm((current) => ({ ...current, approvedBy: event.target.value }))} />
        <TextField size="small" label="Signed Memo Reference" value={form.signedMemoReference} onChange={(event) => setForm((current) => ({ ...current, signedMemoReference: event.target.value }))} />
        <TextField size="small" label="Source Reference" value={form.sourceReference} onChange={(event) => setForm((current) => ({ ...current, sourceReference: event.target.value }))} sx={{ gridColumn: { md: 'span 2' } }} />
        <TextField size="small" label="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} sx={{ gridColumn: { md: 'span 2' } }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="contained" onClick={handleCreate} disabled={submitting}>
          Save Tax Rule
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="py-4 text-center"><CircularProgress size={24} /></div>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tax rule versions found.
          </Typography>
        ) : (
          rows.map((row) => (
            <div key={String(row.id || row.ruleCode)} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {row.ruleCode} · {row.taxClass}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.ruleType} · {row.ratePercentage || 0}% · {row.effectiveFrom || '-'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip size="small" variant="outlined" label={row.valueBasis || '-'} />
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

export default TaxRuleManagementPanel;
