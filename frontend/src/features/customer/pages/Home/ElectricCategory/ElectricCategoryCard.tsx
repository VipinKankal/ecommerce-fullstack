import React from 'react';

type ElectricCategoryCardProps = {
  title: string;
  subtitle: string;
  accent: string;
  icon: React.ReactNode;
};

const ElectricCategoryCard = ({
  title,
  subtitle,
  accent,
  icon,
}: ElectricCategoryCardProps) => {
  return (
    <div
      className={`group rounded-[24px] border border-white/70 bg-gradient-to-br ${accent} px-4 py-4 shadow-[0_12px_40px_rgba(17,24,39,0.04)] transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1f2937] shadow-sm">
          {icon}
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-[#18212f]">{title}</h1>
          <p className="text-xs text-[#65707d]">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default ElectricCategoryCard;
