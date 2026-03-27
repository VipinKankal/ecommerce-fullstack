import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Chip } from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import { Link, useLocation } from 'react-router-dom';
import {
  countComplianceNotesByStatus,
  fetchAdminComplianceNotes,
  fetchSellerComplianceUnreadCount,
  getSellerComplianceUnreadCount,
  subscribeComplianceNotes,
} from 'app/complianceNotes';
import { getSellerComplianceIdentity } from 'app/complianceNotes/sellerIdentity';
import { useAppSelector } from 'app/store/Store';

const ComplianceNoteShortcut = () => {
  const location = useLocation();
  const sellerProfile = useAppSelector((state) => state.sellerAuth.profile);
  const sellerId = getSellerComplianceIdentity(sellerProfile);
  const [sellerUnreadCount, setSellerUnreadCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      try {
        await fetchAdminComplianceNotes();
      } catch {
        // ignore when seller role is active
      }
      try {
        await fetchSellerComplianceUnreadCount();
      } catch {
        // ignore when admin role is active
      }
      setSellerUnreadCount(getSellerComplianceUnreadCount());
      setDraftCount(countComplianceNotesByStatus('DRAFT'));
    };
    void refresh();
    return subscribeComplianceNotes(refresh);
  }, [sellerId]);

  const mode = useMemo(() => {
    if (location.pathname.startsWith('/seller')) return 'seller';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'none';
  }, [location.pathname]);

  if (mode === 'none') return null;

  if (mode === 'seller') {
    return (
      <div className="fixed bottom-6 right-6 z-30">
        <Link
          to="/seller/notes"
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-lg transition hover:-translate-y-0.5"
        >
          <Badge
            color={sellerUnreadCount > 0 ? 'warning' : 'success'}
            badgeContent={sellerUnreadCount}
          >
            <NotificationsActiveRoundedIcon />
          </Badge>
          Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <Link
        to="/admin/compliance-notes"
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-lg transition hover:-translate-y-0.5"
      >
        <CampaignRoundedIcon />
        <Chip size="small" color={draftCount > 0 ? 'warning' : 'success'} label={`${draftCount} Draft`} />
      </Link>
    </div>
  );
};

export default ComplianceNoteShortcut;

