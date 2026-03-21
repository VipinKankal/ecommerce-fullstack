import React from 'react';
import { Button, TextField } from '@mui/material';

interface ProfileEditFormProps {
  fullName: string;
  mobileNumber: string;
  loading: boolean;
  fullNameError?: string;
  mobileNumberError?: string;
  showEmailChangeForm: boolean;
  emailPanel: React.ReactNode;
  onFullNameChange: (value: string) => void;
  onMobileNumberChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const ProfileEditForm = ({
  fullName,
  mobileNumber,
  loading,
  fullNameError,
  mobileNumberError,
  showEmailChangeForm,
  emailPanel,
  onFullNameChange,
  onMobileNumberChange,
  onCancel,
  onSave,
}: ProfileEditFormProps) => {
  return (
    <div className="space-y-4">
      <TextField
        fullWidth
        label="Full Name"
        value={fullName}
        error={Boolean(fullNameError)}
        helperText={fullNameError || ''}
        onChange={(e) => onFullNameChange(e.target.value)}
      />
      <TextField
        fullWidth
        label="Mobile Number"
        value={mobileNumber}
        error={Boolean(mobileNumberError)}
        helperText={mobileNumberError || ''}
        onChange={(e) => onMobileNumberChange(e.target.value)}
      />

      {showEmailChangeForm && emailPanel}

      <div className="flex gap-2">
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={loading}
          sx={{ bgcolor: '#ff3f6c', '&:hover': { bgcolor: '#e7335f' } }}
        >
          Save Details
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditForm;
