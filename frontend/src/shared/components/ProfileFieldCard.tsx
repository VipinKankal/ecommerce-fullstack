import React from 'react';

interface ProfileFieldProps {
    label: string;
    value: string;
}

const ProfileFieldCard = ({ label, value }: ProfileFieldProps) => {
  return (
    <div className="flex flex-col space-y-1">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-gray-800 font-semibold text-base">
        {value}
      </p>
    </div>
  );
};

export default ProfileFieldCard;
