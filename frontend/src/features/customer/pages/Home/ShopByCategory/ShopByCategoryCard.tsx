import React from 'react';

type ShopByCategoryCardProps = {
  title: string;
  note: string;
  image: string;
  accent: string;
};

const ShopByCategoryCard = ({
  title,
  note,
  image,
  accent,
}: ShopByCategoryCardProps) => {
  return (
    <div
      className={`group rounded-[30px] border border-[#ebe1d6] bg-gradient-to-br ${accent} p-5 text-center shadow-[0_16px_50px_rgba(31,41,55,0.05)] transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="mx-auto h-[170px] w-[170px] overflow-hidden rounded-full border-[10px] border-white/80 shadow-md lg:h-[210px] lg:w-[210px]">
        <img
          className="h-full w-full rounded-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          src={image}
          alt={title}
        />
      </div>
      <h1 className="mt-4 text-base font-extrabold text-[#18212f]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#67707c]">{note}</p>
    </div>
  );
};

export default ShopByCategoryCard;
