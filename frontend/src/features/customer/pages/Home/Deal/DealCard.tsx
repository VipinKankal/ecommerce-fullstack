import React from 'react';

type DealCardProps = {
  title: string;
  subtitle: string;
  price: string;
  accent: string;
  image: string;
};

const DealCard = ({ title, subtitle, price, accent, image }: DealCardProps) => {
  return (
    <div className="group overflow-hidden rounded-[28px] border border-[#eadfd1] bg-white shadow-[0_18px_60px_rgba(31,41,55,0.06)] transition-transform duration-300 hover:-translate-y-1">
      <img
        className="h-[240px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        src={image}
        alt={title}
      />
      <div className={`${accent} p-5 text-white`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">
          limited drop
        </p>
        <p className="mt-3 text-2xl font-black">{title}</p>
        <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="text-xl font-extrabold">{price}</p>
          <p className="text-sm font-semibold text-[#ffd89d]">Shop now</p>
        </div>
      </div>
    </div>
  );
};

export default DealCard;
