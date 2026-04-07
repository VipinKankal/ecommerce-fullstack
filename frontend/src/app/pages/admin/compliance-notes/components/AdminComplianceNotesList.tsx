import {
  Button,
  Chip,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import { ComplianceNote } from 'app/complianceNotes';
import {
  NOTE_TYPES,
  STATUSES,
} from '../support';

type Props = {
  filteredNotes: ComplianceNote[];
  searchText: string;
  setSearchText: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  loadForEdit: (note: ComplianceNote) => void;
  handlePublishFromList: (noteId: number) => void;
  handleArchiveFromList: (noteId: number) => void;
};

const AdminComplianceNotesList = ({
  filteredNotes,
  searchText,
  setSearchText,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  loadForEdit,
  handlePublishFromList,
  handleArchiveFromList,
}: Props) => (
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
          <div key={note.id} className="rounded-2xl border border-slate-100 p-4">
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
);

export default AdminComplianceNotesList;
