export type ComplianceNoteType =
  | 'GST'
  | 'HSN'
  | 'TCS'
  | 'POLICY'
  | 'CAMPAIGN'
  | 'WARNING'
  | 'GENERAL';

export type ComplianceNotePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplianceNoteStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ComplianceNoteSource = 'MANUAL' | 'AUTO_DRAFT';

export type ComplianceNoteAttachment = {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
};

export type ComplianceNote = {
  id: string;
  title: string;
  noteType: ComplianceNoteType;
  priority: ComplianceNotePriority;
  shortSummary: string;
  fullNote: string;
  effectiveDate?: string;
  actionRequired?: string;
  affectedCategory?: string;
  attachments: ComplianceNoteAttachment[];
  businessEmail: string;
  status: ComplianceNoteStatus;
  pinned: boolean;
  source: ComplianceNoteSource;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
};

export type ComplianceNoteDraftInput = {
  id?: string;
  title: string;
  noteType: ComplianceNoteType;
  priority: ComplianceNotePriority;
  shortSummary: string;
  fullNote: string;
  effectiveDate?: string;
  actionRequired?: string;
  affectedCategory?: string;
  attachments?: ComplianceNoteAttachment[];
  businessEmail: string;
  status: ComplianceNoteStatus;
  pinned?: boolean;
  source?: ComplianceNoteSource;
};

export type SellerNotesTab = 'latest' | 'unread' | 'archived';

