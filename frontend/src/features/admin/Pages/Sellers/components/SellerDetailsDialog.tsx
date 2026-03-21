import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { SellerListItem } from '../sellerTypes';

type SellerDetailsDialogProps = {
  selectedSeller: SellerListItem | null;
  onClose: () => void;
};

const SellerDetailsDialog = ({
  selectedSeller,
  onClose,
}: SellerDetailsDialogProps) => (
  <Dialog
    open={Boolean(selectedSeller)}
    onClose={onClose}
    fullWidth
    maxWidth="md"
  >
    <DialogTitle>Seller Details</DialogTitle>
    <DialogContent>
      {selectedSeller && (
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Paper
              sx={{
                p: 2,
                borderRadius: '16px',
                boxShadow: 'none',
                border: '1px solid #eef2f7',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                Personal & Business
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedSeller.sellerName}
                </Typography>
                <Typography variant="body2">
                  <strong>Primary Login Email:</strong> {selectedSeller.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Primary Mobile:</strong> {selectedSeller.mobile}
                </Typography>
                <Typography variant="body2">
                  <strong>Business:</strong> {selectedSeller.businessName}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedSeller.businessType}
                </Typography>
                <Typography variant="body2">
                  <strong>GST:</strong> {selectedSeller.gstin}
                </Typography>
                <Typography variant="body2">
                  <strong>PAN:</strong> {selectedSeller.panNumber}
                </Typography>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: 2,
                borderRadius: '16px',
                boxShadow: 'none',
                border: '1px solid #eef2f7',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                Store & Address
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Store:</strong>{' '}
                  {selectedSeller.storeDetails?.storeName || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Category:</strong>{' '}
                  {selectedSeller.storeDetails?.primaryCategory || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Support Email:</strong>{' '}
                  {selectedSeller.businessEmail}
                </Typography>
                <Typography variant="body2">
                  <strong>Support Phone:</strong>{' '}
                  {selectedSeller.businessMobile}
                </Typography>
                <Typography variant="body2">
                  <strong>Pickup Address:</strong>{' '}
                  {selectedSeller.businessAddress}
                </Typography>
              </Stack>
            </Paper>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Paper
              sx={{
                p: 2,
                borderRadius: '16px',
                boxShadow: 'none',
                border: '1px solid #eef2f7',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                Bank Details
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Account Holder:</strong>{' '}
                  {selectedSeller.bankDetails?.accountHolderName || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Bank:</strong>{' '}
                  {selectedSeller.bankDetails?.bankName || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Account No:</strong>{' '}
                  {selectedSeller.bankDetails?.accountNumber || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>IFSC:</strong>{' '}
                  {selectedSeller.bankDetails?.ifscCode || 'N/A'}
                </Typography>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: 2,
                borderRadius: '16px',
                boxShadow: 'none',
                border: '1px solid #eef2f7',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                KYC References
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>PAN URL:</strong>{' '}
                  {selectedSeller.kycDetails?.panCardUrl || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Aadhaar URL:</strong>{' '}
                  {selectedSeller.kycDetails?.aadhaarCardUrl || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>GST Certificate:</strong>{' '}
                  {selectedSeller.kycDetails?.gstCertificateUrl || 'N/A'}
                </Typography>
              </Stack>
            </Paper>
          </div>
        </div>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default SellerDetailsDialog;
