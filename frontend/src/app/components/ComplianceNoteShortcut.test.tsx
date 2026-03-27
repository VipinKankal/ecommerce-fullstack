import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ComplianceNoteShortcut from './ComplianceNoteShortcut';
import {
  countComplianceNotesByStatus,
  fetchAdminComplianceNotes,
  fetchSellerComplianceUnreadCount,
  getSellerComplianceUnreadCount,
  subscribeComplianceNotes,
} from 'app/complianceNotes';

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

jest.mock('app/store/Store', () => ({
  useAppSelector: jest.fn((selector: (state: unknown) => unknown) =>
    selector({ sellerAuth: { profile: null } }),
  ),
}));

jest.mock('app/complianceNotes/sellerIdentity', () => ({
  getSellerComplianceIdentity: jest.fn(() => 'seller-1'),
}));

jest.mock('app/complianceNotes', () => ({
  countComplianceNotesByStatus: jest.fn(() => 2),
  fetchAdminComplianceNotes: jest.fn(() => Promise.resolve()),
  fetchSellerComplianceUnreadCount: jest.fn(() => Promise.resolve()),
  getSellerComplianceUnreadCount: jest.fn(() => 5),
  subscribeComplianceNotes: jest.fn(() => () => undefined),
}));

const mockedCountComplianceNotesByStatus =
  countComplianceNotesByStatus as jest.MockedFunction<
    typeof countComplianceNotesByStatus
  >;
const mockedFetchAdminComplianceNotes =
  fetchAdminComplianceNotes as jest.MockedFunction<
    typeof fetchAdminComplianceNotes
  >;
const mockedFetchSellerComplianceUnreadCount =
  fetchSellerComplianceUnreadCount as jest.MockedFunction<
    typeof fetchSellerComplianceUnreadCount
  >;
const mockedGetSellerComplianceUnreadCount =
  getSellerComplianceUnreadCount as jest.MockedFunction<
    typeof getSellerComplianceUnreadCount
  >;
const mockedSubscribeComplianceNotes =
  subscribeComplianceNotes as jest.MockedFunction<typeof subscribeComplianceNotes>;

describe('ComplianceNoteShortcut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCountComplianceNotesByStatus.mockReturnValue(2);
    mockedGetSellerComplianceUnreadCount.mockReturnValue(5);
    mockedSubscribeComplianceNotes.mockReturnValue(() => undefined);
  });

  it('skips compliance API calls on admin login route', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/login']} future={routerFuture}>
        <ComplianceNoteShortcut />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedFetchAdminComplianceNotes).not.toHaveBeenCalled();
      expect(mockedFetchSellerComplianceUnreadCount).not.toHaveBeenCalled();
      expect(mockedSubscribeComplianceNotes).not.toHaveBeenCalled();
    });

    expect(screen.queryByText(/notes/i)).not.toBeInTheDocument();
  });

  it('skips compliance API calls on courier login route', async () => {
    render(
      <MemoryRouter initialEntries={['/courier/login']} future={routerFuture}>
        <ComplianceNoteShortcut />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedFetchAdminComplianceNotes).not.toHaveBeenCalled();
      expect(mockedFetchSellerComplianceUnreadCount).not.toHaveBeenCalled();
      expect(mockedSubscribeComplianceNotes).not.toHaveBeenCalled();
    });
  });

  it('loads admin note draft count on admin routes', async () => {
    render(
      <MemoryRouter
        initialEntries={['/admin/compliance-notes']}
        future={routerFuture}
      >
        <ComplianceNoteShortcut />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedFetchAdminComplianceNotes).toHaveBeenCalledTimes(1);
    });
    expect(mockedFetchSellerComplianceUnreadCount).not.toHaveBeenCalled();
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });
});
