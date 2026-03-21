import React from 'react';
import { Alert, Button, CircularProgress, TextField } from '@mui/material';

interface EmailChangePanelProps {
  loading: boolean;
  newEmail: string;
  emailOtp: string;
  isValidEmail: boolean;
  canSendOtp: boolean;
  canVerifyOtp: boolean;
  shouldShowOtpInput: boolean;
  otpRequestedFor: string;
  emailFlowMessage: string | null;
  otpError: string | null;
  onEmailChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
}

const EmailChangePanel = ({
  loading,
  newEmail,
  emailOtp,
  isValidEmail,
  canSendOtp,
  canVerifyOtp,
  shouldShowOtpInput,
  otpRequestedFor,
  emailFlowMessage,
  otpError,
  onEmailChange,
  onOtpChange,
  onRequestOtp,
  onVerifyOtp,
}: EmailChangePanelProps) => {
  return (
    <div className="space-y-5 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm duration-300 animate-in fade-in slide-in-from-top-2 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-[#282c3f]">
            Update Email Address
          </p>
          <p className="text-[11px] font-medium text-gray-400">
            OTP will be sent to your new email.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <TextField
          fullWidth
          size="small"
          label="New Email ID"
          value={newEmail}
          disabled={loading}
          error={newEmail.length > 0 && !isValidEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              bgcolor: '#fff',
            },
          }}
        />

        {!shouldShowOtpInput && (
          <Button
            variant="contained"
            disabled={!canSendOtp || loading}
            onClick={onRequestOtp}
            sx={{
              height: 40,
              minWidth: { sm: '140px' },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#ff3f6c',
              '&:hover': { bgcolor: '#e7335f' },
              boxShadow: 'none',
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Send OTP'
            )}
          </Button>
        )}
      </div>

      {shouldShowOtpInput && (
        <div className="flex flex-col gap-3 pt-2 duration-200 animate-in zoom-in-95 sm:flex-row">
          <TextField
            fullWidth
            size="small"
            label="Verification Code"
            value={emailOtp}
            disabled={loading}
            error={Boolean(otpError)}
            helperText={otpError || ''}
            onChange={(e) => onOtpChange(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={onVerifyOtp}
            disabled={!canVerifyOtp || loading}
            sx={{
              height: 40,
              minWidth: { sm: '140px' },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Verify OTP'
            )}
          </Button>
        </div>
      )}

      {shouldShowOtpInput && (
        <p className="text-xs font-medium text-gray-500">
          OTP sent to {otpRequestedFor}
        </p>
      )}

      {emailFlowMessage && !loading && (
        <Alert
          severity={
            emailFlowMessage.toLowerCase().includes('failed') ||
            emailFlowMessage.toLowerCase().includes('invalid')
              ? 'error'
              : 'success'
          }
          sx={{ borderRadius: '8px', fontSize: '0.75rem' }}
        >
          {emailFlowMessage}
        </Alert>
      )}
    </div>
  );
};

export default EmailChangePanel;
