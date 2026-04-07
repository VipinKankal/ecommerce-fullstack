import {
  ComplianceNote,
  ComplianceNoteAttachment,
  ComplianceNotePriority,
  ComplianceNoteStatus,
  ComplianceNoteType,
} from 'app/complianceNotes';

export const NOTE_TYPES: ComplianceNoteType[] = [
  'GST',
  'HSN',
  'TCS',
  'POLICY',
  'CAMPAIGN',
  'WARNING',
  'GENERAL',
];

export const PRIORITIES: ComplianceNotePriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

export const STATUSES: ComplianceNoteStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export type AdminNoteForm = {
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

export const initialForm: AdminNoteForm = {
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

export const fromNote = (note: ComplianceNote): AdminNoteForm => ({
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
