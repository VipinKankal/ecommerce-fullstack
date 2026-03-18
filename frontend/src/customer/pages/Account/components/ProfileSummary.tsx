import React from "react";
import { Button } from "@mui/material";

interface ProfileSummaryProps {
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  location?: string;
  onEdit: () => void;
}

const ProfileSummary = ({
  fullName,
  mobileNumber,
  email,
  location,
  onEdit,
}: ProfileSummaryProps) => {
  const rows = [
    ["Full Name", fullName || "N/A"],
    ["Mobile Number", mobileNumber || "N/A"],
    ["Email ID", email || "N/A"],
    ["Location", location || "Not Set"],
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {rows.map(([label, value]) => (
        <div key={String(label)} className="grid grid-cols-[140px_1fr] gap-2 py-1 sm:grid-cols-[220px_1fr] sm:gap-4">
          <p className="text-sm text-[#282c3f] sm:text-base">{label}</p>
          <p className="break-all text-sm font-medium text-[#282c3f] sm:text-base">{value}</p>
        </div>
      ))}

      <div className="pt-4">
        <Button
          variant="contained"
          onClick={onEdit}
          sx={{
            bgcolor: "#ff3f6c",
            fontWeight: 700,
            px: 4,
            minWidth: 220,
            "&:hover": { bgcolor: "#e7335f" },
          }}
        >
          Edit
        </Button>
      </div>
    </div>
  );
};

export default ProfileSummary;
