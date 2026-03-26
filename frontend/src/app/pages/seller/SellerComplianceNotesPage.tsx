import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import MarkEmailUnreadRoundedIcon from '@mui/icons-material/MarkEmailUnreadRounded';
import DraftsRoundedIcon from '@mui/icons-material/DraftsRounded';
import AttachmentRoundedIcon from '@mui/icons-material/AttachmentRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Link } from 'react-router-dom';
import {
  ComplianceNote,
  SellerNotesTab,
  getSellerComplianceUnreadCount,
  isSellerComplianceNoteRead,
  listSellerComplianceNotes,
  markSellerComplianceNoteRead,
  subscribeComplianceNotes,
} from 'app/complianceNotes';
import { getSellerComplianceIdentity } from 'app/complianceNotes/sellerIdentity';
import { useAppSelector } from 'app/store/Store';

const NOTE_TYPE_FILTERS = [
  'ALL',
  'GST',
  'HSN',
  'TCS',
  'POLICY',
  'CAMPAIGN',
  'WARNING',
  'GENERAL',
];

const SellerComplianceNotesPage = () => {
  const sellerProfile = useAppSelector((state) => state.sellerAuth.profile);
  const sellerId = getSellerComplianceIdentity(sellerProfile);
  const [tab, setTab] = useState<SellerNotesTab>('latest');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [notes, setNotes] = useState<ComplianceNote[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setNotes(
        listSellerComplianceNotes({
          sellerId,
          tab,
          searchText,
          noteType: typeFilter,
        }),
      );
      setUnreadCount(getSellerComplianceUnreadCount(sellerId));
    };

    refresh();
    return subscribeComplianceNotes(refresh);
  }, [searchText, sellerId, tab, typeFilter]);

  const title = useMemo(() => {
    if (tab === 'unread') return 'Unread Seller Notes';
    if (tab === 'archived') return 'Archived Seller Notes';
    return 'Latest Seller Notes';
  }, [tab]);

  const markRead = (noteId: string) => {
    markSellerComplianceNoteRead(sellerId, noteId);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Compliance Updates
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Seller Communication Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Read GST/HSN/TCS/policy updates from admin and track what is
              unread before month-end actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip
              icon={<MarkEmailUnreadRoundedIcon />}
              label={`${unreadCount} unread`}
              color={unreadCount > 0 ? 'warning' : 'success'}
            />
            <Chip
              icon={<DraftsRoundedIcon />}
              label={`${notes.length} in view`}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
          </div>
        </div>
      </div>

      <Paper sx={{ p: 3, borderRadius: '24px', boxShadow: 'none', border: '1px solid #eef2f7' }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <div className="flex flex-wrap gap-2">
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
              {NOTE_TYPE_FILTERS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value as SellerNotesTab)}
          sx={{ mb: 3 }}
        >
          <Tab label="Latest" value="latest" />
          <Tab label="Unread" value="unread" />
          <Tab label="Archived" value="archived" />
        </Tabs>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <Alert severity="info">No notes available for this view.</Alert>
          ) : (
            notes.map((note) => {
              const read = isSellerComplianceNoteRead(sellerId, note.id);
              return (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {note.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {note.shortSummary}
                      </Typography>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Chip size="small" variant="outlined" label={note.noteType} />
                      <Chip
                        size="small"
                        color={
                          note.priority === 'CRITICAL'
                            ? 'error'
                            : note.priority === 'HIGH'
                              ? 'warning'
                              : 'default'
                        }
                        label={note.priority}
                      />
                      <Chip
                        size="small"
                        color={read ? 'success' : 'warning'}
                        label={read ? 'READ' : 'UNREAD'}
                      />
                      {note.attachments.length > 0 && (
                        <Chip
                          size="small"
                          icon={<AttachmentRoundedIcon />}
                          label={`${note.attachments.length} attachments`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>
                      Published:{' '}
                      {note.publishedAt
                        ? new Date(note.publishedAt).toLocaleString()
                        : '-'}
                    </span>
                    {note.effectiveDate && <span>Effective: {note.effectiveDate}</span>}
                    {note.affectedCategory && (
                      <span>Category: {note.affectedCategory}</span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      component={Link}
                      to={`/seller/notes/${note.id}`}
                      variant="outlined"
                      endIcon={<OpenInNewRoundedIcon />}
                      onClick={() => markRead(note.id)}
                    >
                      Open Detail
                    </Button>
                    {!read && (
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => markRead(note.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Paper>
    </div>
  );
};

export default SellerComplianceNotesPage;

