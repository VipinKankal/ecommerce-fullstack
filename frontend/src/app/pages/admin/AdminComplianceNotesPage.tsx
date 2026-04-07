import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
} from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { Link } from 'react-router-dom';
import {
  ComplianceNote,
  ComplianceNoteImpactSummary,
  ComplianceNoteSource,
  ComplianceNoteStatus,
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
import AdminComplianceNoteEditor from './compliance-notes/components/AdminComplianceNoteEditor';
import AdminComplianceNotesList from './compliance-notes/components/AdminComplianceNotesList';
import { AdminNoteForm, fromNote, initialForm } from './compliance-notes/support';

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
        <AdminComplianceNotesList
          filteredNotes={filteredNotes}
          searchText={searchText}
          setSearchText={setSearchText}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          loadForEdit={loadForEdit}
          handlePublishFromList={handlePublishFromList}
          handleArchiveFromList={handleArchiveFromList}
        />

        <AdminComplianceNoteEditor
          form={form}
          setForm={setForm}
          manualAttachmentName={manualAttachmentName}
          setManualAttachmentName={setManualAttachmentName}
          manualAttachmentUrl={manualAttachmentUrl}
          setManualAttachmentUrl={setManualAttachmentUrl}
          uploading={uploading}
          impactSummary={impactSummary}
          handleCloudinaryUpload={handleCloudinaryUpload}
          handleAddManualAttachment={handleAddManualAttachment}
          removeAttachment={removeAttachment}
          saveForm={saveForm}
        />
      </div>
    </div>
  );
};

export default AdminComplianceNotesPage;

