import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Chip, Paper, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachmentRoundedIcon from '@mui/icons-material/AttachmentRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import MarkEmailUnreadRoundedIcon from '@mui/icons-material/MarkEmailUnreadRounded';
import { Link, useParams } from 'react-router-dom';
import {
  ComplianceNote,
  getComplianceNoteById,
  isSellerComplianceNoteRead,
  markSellerComplianceNoteRead,
  markSellerComplianceNoteUnread,
  subscribeComplianceNotes,
} from 'app/complianceNotes';
import { getSellerComplianceIdentity } from 'app/complianceNotes/sellerIdentity';
import { useAppSelector } from 'app/store/Store';

const SellerComplianceNoteDetailPage = () => {
  const { noteId } = useParams();
  const sellerProfile = useAppSelector((state) => state.sellerAuth.profile);
  const sellerId = getSellerComplianceIdentity(sellerProfile);
  const [note, setNote] = useState<ComplianceNote | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (!noteId) {
        setNote(null);
        return;
      }
      setNote(getComplianceNoteById(noteId));
    };

    refresh();
    return subscribeComplianceNotes(refresh);
  }, [noteId]);

  useEffect(() => {
    if (note?.id) {
      markSellerComplianceNoteRead(sellerId, note.id);
    }
  }, [note?.id, sellerId]);

  const isRead = useMemo(() => {
    if (!note?.id) return false;
    return isSellerComplianceNoteRead(sellerId, note.id);
  }, [note?.id, sellerId]);

  if (!note) {
    return (
      <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
        <Alert severity="warning">
          Note not found. It may be deleted or not available in this environment.
        </Alert>
        <Button
          component={Link}
          to="/seller/notes"
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ mt: 2 }}
        >
          Back To Notes
        </Button>
      </Paper>
    );
  }

  return (
    <div className="space-y-5">
      <Button
        component={Link}
        to="/seller/notes"
        variant="outlined"
        startIcon={<ArrowBackRoundedIcon />}
      >
        Back To Notes
      </Button>

      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-3">
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            {note.title}
          </Typography>
          <div className="flex flex-wrap gap-1">
            <Chip size="small" label={note.noteType} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
            <Chip size="small" label={note.priority} color={note.priority === 'CRITICAL' ? 'error' : 'warning'} />
            <Chip
              size="small"
              label={isRead ? 'READ' : 'UNREAD'}
              color={isRead ? 'success' : 'warning'}
            />
          </div>
          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
            {note.shortSummary}
          </Typography>
        </div>
      </div>

      <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Typography variant="caption" color="text.secondary">
              Published Date
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {note.publishedAt ? new Date(note.publishedAt).toLocaleString() : '-'}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Effective Date
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {note.effectiveDate || '-'}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Affected Category
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {note.affectedCategory || '-'}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Business Contact
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {note.businessEmail}
            </Typography>
          </div>
        </div>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          Full Note
        </Typography>
        <Typography
          variant="body1"
          sx={{ whiteSpace: 'pre-wrap', color: '#334155' }}
        >
          {note.fullNote}
        </Typography>

        {note.actionRequired && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Action Required
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400e' }}>
              {note.actionRequired}
            </Typography>
          </div>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #eef2f7', boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Attachments
        </Typography>
        {note.attachments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No attachments added for this note.
          </Typography>
        ) : (
          <div className="space-y-2">
            {note.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"
              >
                <div className="flex items-center gap-2">
                  <AttachmentRoundedIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {attachment.name}
                  </Typography>
                </div>
                <Button
                  component="a"
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                  variant="outlined"
                  endIcon={<OpenInNewRoundedIcon />}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        )}
      </Paper>

      <div className="flex flex-wrap gap-2">
        {isRead ? (
          <Button
            variant="outlined"
            startIcon={<MarkEmailUnreadRoundedIcon />}
            onClick={() => note.id && markSellerComplianceNoteUnread(sellerId, note.id)}
          >
            Mark Unread
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<MarkEmailReadRoundedIcon />}
            onClick={() => note.id && markSellerComplianceNoteRead(sellerId, note.id)}
          >
            Mark Read
          </Button>
        )}
      </div>
    </div>
  );
};

export default SellerComplianceNoteDetailPage;

