import React from 'react';

type SellerProfileSectionHeaderProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

const SellerProfileSectionHeader = ({
  title,
  subtitle,
  icon,
}: SellerProfileSectionHeaderProps) => (
  <div className="mb-5 flex items-start gap-3">
    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
    <div>
      <h2 className="text-lg font-black tracking-tight text-gray-900">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  </div>
);

export default SellerProfileSectionHeader;
