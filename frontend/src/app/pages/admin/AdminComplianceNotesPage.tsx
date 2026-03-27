import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import AttachmentRoundedIcon from '@mui/icons-material/AttachmentRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { Link } from 'react-router-dom';
import {
  ComplianceNote,
  ComplianceNoteAttachment,
  ComplianceNoteImpactSummary,
  ComplianceNotePriority,
  ComplianceNoteSource,
  ComplianceNoteStatus,
  ComplianceNoteType,
  createAutoDraftComplianceNote,
  fetchAdminComplianceNotes,
  fetchComplianceNoteImpact,
  listComplianceNotes,
  markComplianceNoteArchived,
  markComplianceNotePublished,
  subscribeComplianceNotes,
  upsertComplianceNote,
} from 'app/complianceNotes';
import { uploadToCloudinary } from 'shared/utils/uploadToCloudinary';

const NOTE_TYPES: ComplianceNoteType[] = [
  'GST',
  'HSN',
  'TCS',
  'POLICY',
  'CAMPAIGN',
  'WARNING',
  'GENERAL',
];

const PRIORITIES: ComplianceNotePriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

const STATUSES: ComplianceNoteStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

type AdminNoteForm = {
  id?: number;
  title: string;
  noteType: ComplianceNoteType;
  priority: ComplianceNotePriority;
  shortSummary: string;
  fullNote: string;
  effectiveDate: string;
  actionRequired: string;
  affectedCategory: string;
  businessEmail: string;
  pinned: boolean;
  status: ComplianceNoteStatus;
  attachments: ComplianceNoteAttachment[];
};

const initialForm: AdminNoteForm = {
  title: '',
  noteType: 'GST',
  priority: 'MEDIUM',
  shortSummary: '',
  fullNote: '',
  effectiveDate: '',
  actionRequired: '',
  affectedCategory: '',
  businessEmail: '',
  pinned: false,
  status: 'DRAFT',
  attachments: [],
};

const fromNote = (note: ComplianceNote): AdminNoteForm => ({
  id: note.id,
  title: note.title,
  noteType: note.noteType,
  priority: note.priority,
  shortSummary: note.shortSummary,
  fullNote: note.fullNote,
  effectiveDate: note.effectiveDate || '',
  actionRequired: note.actionRequired || '',
  affectedCategory: note.affectedCategory || '',
  businessEmail: note.businessEmail,
  pinned: note.pinned,
  status: note.status,
  attachments: note.attachments || [],
});

const AdminComplianceNotesPage = () => {
  const [notes, setNotes] = useState<ComplianceNote[]>(() => listComplianceNotes());
  const [form, setForm] = useState<AdminNoteForm>(initialForm);
  const [impactSummary, setImpactSummary] = useState<ComplianceNoteImpactSummary | null>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [manualAttachmentName, setManualAttachmentName] = useState('');
  const [manualAttachmentUrl, setManualAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        await fetchAdminComplianceNotes();
        setNotes(listComplianceNotes());
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load compliance notes from backend.',
        );
      }
    };
    void refresh();
    return subscribeComplianceNotes(refresh);
  }, []);

  const counts = useMemo(
    () => ({
      drafts: notes.filter((note) => note.status === 'DRAFT').length,
      published: notes.filter((note) => note.status === 'PUBLISHED').length,
      archived: notes.filter((note) => note.status === 'ARCHIVED').length,
      highPriority: notes.filter(
        (note) =>
          note.status !== 'ARCHIVED' &&
          (note.priority === 'HIGH' || note.priority === 'CRITICAL'),
      ).length,
    }),
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return notes.filter((note) => {
      if (typeFilter !== 'ALL' && note.noteType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && note.status !== statusFilter) return false;
      if (!query) return true;
      return (
        note.title.toLowerCase().includes(query) ||
        note.shortSummary.toLowerCase().includes(query) ||
        note.fullNote.toLowerCase().includes(query)
      );
    });
  }, [notes, searchText, statusFilter, typeFilter]);

  const resetForm = () => {
    setForm(initialForm);
    setImpactSummary(null);
    setManualAttachmentName('');
    setManualAttachmentUrl('');
  };

  const loadForEdit = async (note: ComplianceNote) => {
    setForm(fromNote(note));
    setError(null);
    setSuccess(`Loaded "${note.title}" for edit.`);
    try {
      setImpactSummary(await fetchComplianceNoteImpact(note.id));
    } catch {
      setImpactSummary(null);
    }
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.shortSummary.trim()) return 'Short summary is required.';
    if (!form.fullNote.trim()) return 'Full note is required.';
    if (!form.businessEmail.trim()) return 'Business email is required.';
    return null;
  };

  const saveForm = async (targetStatus: ComplianceNoteStatus) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const saved = await upsertComplianceNote({
        ...form,
        status: targetStatus,
        pinned: form.pinned,
        effectiveDate: form.effectiveDate || undefined,
        actionRequired: form.actionRequired || undefined,
        affectedCategory: form.affectedCategory || undefined,
        attachments: form.attachments,
        sourceMode: 'MANUAL' as ComplianceNoteSource,
      });
      setForm(fromNote(saved));
      setImpactSummary(await fetchComplianceNoteImpact(saved.id));
      setError(null);
      setSuccess(
        targetStatus === 'PUBLISHED'
          ? 'Note published for sellers.'
          : targetStatus === 'ARCHIVED'
            ? 'Note archived successfully.'
            : 'Draft saved successfully.',
      );
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save compliance note.',
      );
    }
  };

  const handleArchiveFromList = async (noteId: number) => {
    try {
      await markComplianceNoteArchived(noteId);
      setNotes(listComplianceNotes());
      setSuccess('Note archived successfully.');
    } catch (archiveError: unknown) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : 'Failed to archive note.',
      );
    }
  };

  const handlePublishFromList = async (noteId: number) => {
    try {
      await markComplianceNotePublished(noteId);
      setNotes(listComplianceNotes());
      setSuccess('Draft promoted to published.');
    } catch (publishError: unknown) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : 'Failed to publish note.',
      );
    }
  };

  const handleAutoDraft = async () => {
    try {
      await createAutoDraftComplianceNote({
        title: 'GST Rule Revision - Seller Action Required',
        noteType: 'GST',
        summary:
          'A new GST interpretation has been approved by CA review and will apply to future orders only.',
        effectiveDate: new Date().toISOString().slice(0, 10),
        affectedCategory: 'apparel',
        actionRequired:
          'Verify product category mapping and check HSN override requests before publish.',
        businessEmail: form.businessEmail.trim() || 'compliance@yourbusiness.com',
      });
      setNotes(listComplianceNotes());
      setSuccess('Auto draft generated. Review and publish when ready.');
    } catch (draftError: unknown) {
      setError(
        draftError instanceof Error
          ? draftError.message
          : 'Failed to create auto draft.',
      );
    }
  };

  const handleCloudinaryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const url = await uploadToCloudinary(file);
      if (!url) {
        throw new Error('Attachment upload did not return a URL.');
      }
      setForm((current) => ({
        ...current,
        attachments: [
          ...current.attachments,
          {
            id: `att_${Date.now()}`,
            name: file.name,
            url,
            uploadedAt: new Date().toISOString(),
          },
        ],
      }));
      setSuccess('Attachment uploaded.');
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Attachment upload failed.',
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleAddManualAttachment = () => {
    const name = manualAttachmentName.trim();
    const url = manualAttachmentUrl.trim();
    if (!name || !url) {
      setError('Attachment name and URL both are required.');
      return;
    }
    setForm((current) => ({
      ...current,
      attachments: [
        ...current.attachments,
        {
          id: `att_${Date.now()}`,
          name,
          url,
          uploadedAt: new Date().toISOString(),
        },
      ],
    }));
    setManualAttachmentName('');
    setManualAttachmentUrl('');
    setError(null);
  };

  const removeAttachment = (attachmentId: string) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((item) => item.id !== attachmentId),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Compliance Communication
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Seller Notes Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Create, review, publish, and archive GST/HSN/TCS/policy notes for
              sellers with attachment-backed audit trace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outlined"
              startIcon={<AutoFixHighRoundedIcon />}
              onClick={handleAutoDraft}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Auto Draft
            </Button>
            <Button
              component={Link}
              to="/admin/compliance-analytics"
              variant="outlined"
              startIcon={<BarChartRoundedIcon />}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineRoundedIcon />}
              onClick={resetForm}
            >
              New Note
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Draft Notes', value: counts.drafts, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Published', value: counts.published, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Archived', value: counts.archived, tone: 'bg-slate-50 text-slate-700 border-slate-100' },
          { label: 'High Priority', value: counts.highPriority, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
        ].map((card) => (
          <div key={card.label} className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
              Notes
            </p>
            <p className="mt-2 text-sm font-semibold">{card.label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <TextField
              size="small"
              label="Search notes"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <TextField
              size="small"
              select
              label="Type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <MenuItem value="ALL">All</MenuItem>
              {NOTE_TYPES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
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
              <MenuItem value="ALL">All</MenuItem>
              {STATUSES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No notes found for this filter.
              </Typography>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{note.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{note.shortSummary}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">
                        Impacted products: {note.impactedProductCount ?? 0}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Chip size="small" label={note.noteType} variant="outlined" />
                      <Chip size="small" label={note.priority} color={note.priority === 'CRITICAL' ? 'error' : 'default'} />
                      <Chip size="small" label={note.status} color={note.status === 'PUBLISHED' ? 'success' : note.status === 'ARCHIVED' ? 'default' : 'warning'} />
                      {note.pinned && <Chip size="small" label="PINNED" color="info" />}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => loadForEdit(note)}
                    >
                      Edit
                    </Button>
                    {note.status !== 'PUBLISHED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PublishRoundedIcon />}
                        onClick={() => handlePublishFromList(note.id)}
                      >
                        Publish
                      </Button>
                    )}
                    {note.status !== 'ARCHIVED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ArchiveRoundedIcon />}
                        onClick={() => handleArchiveFromList(note.id)}
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {form.id ? 'Edit Compliance Note' : 'Create Compliance Note'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Required fields: title, note type, priority, summary, full note,
            business email.
          </Typography>

          <div className="grid grid-cols-1 gap-3">
            <TextField
              size="small"
              label="Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <TextField
              size="small"
              select
              label="Note Type"
              value={form.noteType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  noteType: event.target.value as ComplianceNoteType,
                }))
              }
            >
              {NOTE_TYPES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Priority"
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as ComplianceNotePriority,
                }))
              }
            >
              {PRIORITIES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Short Summary"
              value={form.shortSummary}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  shortSummary: event.target.value,
                }))
              }
            />
            <TextField
              size="small"
              multiline
              minRows={4}
              label="Full Note"
              value={form.fullNote}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullNote: event.target.value }))
              }
            />
            <TextField
              size="small"
              type="date"
              label="Effective Date"
              value={form.effectiveDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  effectiveDate: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              label="Action Required"
              value={form.actionRequired}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  actionRequired: event.target.value,
                }))
              }
            />
            <TextField
              size="small"
              label="Affected Category"
              value={form.affectedCategory}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  affectedCategory: event.target.value,
                }))
              }
            />
            <TextField
              size="small"
              label="Business Email"
              value={form.businessEmail}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  businessEmail: event.target.value,
                }))
              }
            />
            <TextField
              size="small"
              select
              label="Status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ComplianceNoteStatus,
                }))
              }
            >
              {STATUSES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Pinned"
              value={form.pinned ? 'YES' : 'NO'}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  pinned: event.target.value === 'YES',
                }))
              }
            >
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
              <TextField
                size="small"
                label="Attachment Name"
                value={manualAttachmentName}
                onChange={(event) => setManualAttachmentName(event.target.value)}
              />
              <TextField
                size="small"
                label="Attachment URL"
                value={manualAttachmentUrl}
                onChange={(event) => setManualAttachmentUrl(event.target.value)}
              />
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
      </div>
    </div>
  );
};

export default AdminComplianceNotesPage;

