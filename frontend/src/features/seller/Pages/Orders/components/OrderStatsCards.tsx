import React from 'react';

export interface OrderStats {
  total: number;
  active: number;
  delivered: number;
  cancelled: number;
  deliveredRevenue: number;
}

interface OrderStatsCardsProps {
  stats: OrderStats;
}

const OrderStatsCards = ({ stats }: OrderStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {[
        {
          title: 'Total Orders',
          value: stats.total,
          tone: 'bg-slate-50 text-slate-700 border-slate-100',
        },
        {
          title: 'Active',
          value: stats.active,
          tone: 'bg-blue-50 text-blue-700 border-blue-100',
        },
        {
          title: 'Delivered',
          value: stats.delivered,
          tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        },
        {
          title: 'Cancelled',
          value: stats.cancelled,
          tone: 'bg-rose-50 text-rose-700 border-rose-100',
        },
        {
          title: 'Delivered Revenue',
          value: `Rs ${stats.deliveredRevenue}`,
          tone: 'bg-violet-50 text-violet-700 border-violet-100',
        },
      ].map((stat) => (
        <div
          key={stat.title}
          className={`rounded-3xl border p-5 shadow-sm ${stat.tone}`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
            Orders
          </p>
          <p className="mt-3 text-sm font-semibold opacity-80">{stat.title}</p>
          <p className="mt-1 text-3xl font-black tracking-tight">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default OrderStatsCards;
