import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import AttachmentRoundedIcon from '@mui/icons-material/AttachmentRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { ComplianceNoteImpactSummary, ComplianceNoteStatus, ComplianceNoteType, ComplianceNotePriority } from 'app/complianceNotes';
import { AdminNoteForm, NOTE_TYPES, PRIORITIES, STATUSES } from '../support';

type Props = {
  form: AdminNoteForm;
  setForm: React.Dispatch<React.SetStateAction<AdminNoteForm>>;
  manualAttachmentName: string;
  setManualAttachmentName: (value: string) => void;
  manualAttachmentUrl: string;
  setManualAttachmentUrl: (value: string) => void;
  uploading: boolean;
  impactSummary: ComplianceNoteImpactSummary | null;
  handleCloudinaryUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddManualAttachment: () => void;
  removeAttachment: (attachmentId: string) => void;
  saveForm: (targetStatus: ComplianceNoteStatus) => void;
};

const AdminComplianceNoteEditor = ({
  form,
  setForm,
  manualAttachmentName,
  setManualAttachmentName,
  manualAttachmentUrl,
  setManualAttachmentUrl,
  uploading,
  impactSummary,
  handleCloudinaryUpload,
  handleAddManualAttachment,
  removeAttachment,
  saveForm,
}: Props) => (
  <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
    <Typography variant="h6" sx={{ fontWeight: 800 }}>
      {form.id ? 'Edit Compliance Note' : 'Create Compliance Note'}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Required fields: title, note type, priority, summary, full note,
      business email.
    </Typography>

    <div className="grid grid-cols-1 gap-3">
      <TextField size="small" label="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
      <TextField size="small" select label="Note Type" value={form.noteType} onChange={(event) => setForm((current) => ({ ...current, noteType: event.target.value as ComplianceNoteType }))}>
        {NOTE_TYPES.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>
      <TextField size="small" select label="Priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as ComplianceNotePriority }))}>
        {PRIORITIES.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>
      <TextField size="small" label="Short Summary" value={form.shortSummary} onChange={(event) => setForm((current) => ({ ...current, shortSummary: event.target.value }))} />
      <TextField size="small" multiline minRows={4} label="Full Note" value={form.fullNote} onChange={(event) => setForm((current) => ({ ...current, fullNote: event.target.value }))} />
      <TextField size="small" type="date" label="Effective Date" value={form.effectiveDate} onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField size="small" label="Action Required" value={form.actionRequired} onChange={(event) => setForm((current) => ({ ...current, actionRequired: event.target.value }))} />
      <TextField size="small" label="Affected Category" value={form.affectedCategory} onChange={(event) => setForm((current) => ({ ...current, affectedCategory: event.target.value }))} />
      <TextField size="small" label="Business Email" value={form.businessEmail} onChange={(event) => setForm((current) => ({ ...current, businessEmail: event.target.value }))} />
      <TextField size="small" select label="Status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ComplianceNoteStatus }))}>
        {STATUSES.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>
      <TextField size="small" select label="Pinned" value={form.pinned ? 'YES' : 'NO'} onChange={(event) => setForm((current) => ({ ...current, pinned: event.target.value === 'YES' }))}>
        <MenuItem value="NO">No</MenuItem>
        <MenuItem value="YES">Yes</MenuItem>
      </TextField>
    </div>

    <Divider sx={{ my: 3 }} />

    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
      Attachments
    </Typography>
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="note-attachment-upload"
          type="file"
          style={{ display: 'none' }}
          onChange={handleCloudinaryUpload}
        />
        <label htmlFor="note-attachment-upload">
          <Button
            component="span"
            variant="outlined"
            startIcon={<AttachmentRoundedIcon />}
            disabled={uploading}
          >
            Upload File
          </Button>
        </label>
        {uploading && <CircularProgress size={18} />}
      </div>

      <div className="grid grid-cols-1 gap-2">
        <TextField size="small" label="Attachment Name" value={manualAttachmentName} onChange={(event) => setManualAttachmentName(event.target.value)} />
        <TextField size="small" label="Attachment URL" value={manualAttachmentUrl} onChange={(event) => setManualAttachmentUrl(event.target.value)} />
        <Button variant="outlined" onClick={handleAddManualAttachment}>
          Add URL Attachment
        </Button>
      </div>

      {form.attachments.length > 0 && (
        <div className="space-y-2">
          {form.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-2"
            >
              <a
                href={attachment.downloadUrl || attachment.url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-medium text-blue-700"
              >
                {attachment.name}
              </a>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => removeAttachment(attachment.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {impactSummary && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Product Impact Summary
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Coverage: {impactSummary.coverageScope || '-'} | Impacted:{' '}
            {impactSummary.impactedProductCount}
          </Typography>
          {impactSummary.impactedProducts.length > 0 && (
            <div className="mt-2 space-y-1">
              {impactSummary.impactedProducts.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  #{item.id} {item.title || 'Product'}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      <Button variant="outlined" onClick={() => saveForm('DRAFT')}>
        Save Draft
      </Button>
      <Button
        variant="contained"
        startIcon={<PublishRoundedIcon />}
        onClick={() => saveForm('PUBLISHED')}
      >
        Publish
      </Button>
      <Button
        variant="outlined"
        color="warning"
        startIcon={<ArchiveRoundedIcon />}
        onClick={() => saveForm('ARCHIVED')}
      >
        Archive
      </Button>
    </Box>
  </Paper>
);

export default AdminComplianceNoteEditor;
