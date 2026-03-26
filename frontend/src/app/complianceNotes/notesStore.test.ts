import {
  createAutoDraftComplianceNote,
  getComplianceNoteById,
  getSellerComplianceUnreadCount,
  listSellerComplianceNotes,
  markSellerComplianceNoteRead,
  markSellerComplianceNoteUnread,
  upsertComplianceNote,
} from './notesStore';

describe('compliance notes store', () => {
  const localStorageKey = 'compliance_notes_store_v1';
  const sellerId = 'seller:test';

  beforeEach(() => {
    window.localStorage.removeItem(localStorageKey);
  });

  it('creates and publishes note, then tracks read and unread', () => {
    const note = upsertComplianceNote({
      title: 'GST Rule Update',
      noteType: 'GST',
      priority: 'HIGH',
      shortSummary: 'New GST rule applies from next period.',
      fullNote: 'Detailed seller-facing explanation.',
      businessEmail: 'compliance@example.com',
      status: 'PUBLISHED',
      pinned: true,
      attachments: [],
    });

    const latest = listSellerComplianceNotes({
      sellerId,
      tab: 'latest',
      noteType: 'ALL',
    });
    expect(latest).toHaveLength(1);
    expect(getSellerComplianceUnreadCount(sellerId)).toBe(1);

    markSellerComplianceNoteRead(sellerId, note.id);
    expect(getSellerComplianceUnreadCount(sellerId)).toBe(0);

    markSellerComplianceNoteUnread(sellerId, note.id);
    expect(getSellerComplianceUnreadCount(sellerId)).toBe(1);
  });

  it('creates auto draft note with draft status', () => {
    const draft = createAutoDraftComplianceNote({
      title: 'HSN Mapping Revision',
      noteType: 'HSN',
      summary: 'HSN mapping updated by CA review.',
      businessEmail: 'ca@example.com',
      affectedCategory: 'Textiles',
    });

    expect(draft.status).toBe('DRAFT');
    expect(draft.source).toBe('AUTO_DRAFT');
    expect(getComplianceNoteById(draft.id)?.title).toBe('HSN Mapping Revision');
  });
});

