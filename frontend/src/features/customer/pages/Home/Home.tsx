import React from 'react';
import ElectricCategory from './ElectricCategory/ElectricCategory';
import CategoryGrid from './CategoryGrid/CategoryGrid';
import Deal from './Deal/Deal';
import ShopByCategory from './ShopByCategory/ShopByCategory';
import { Button } from '@mui/material';
import {
  ArrowForward,
  LocalShippingOutlined,
  SavingsOutlined,
  SecurityOutlined,
  Storefront,
} from '@mui/icons-material';

const Home = () => {
  const trustPoints = [
    {
      title: 'Warehouse-backed shipping',
      note: 'Only live warehouse stock goes customer-facing',
      icon: <LocalShippingOutlined sx={{ fontSize: 22 }} />,
    },
    {
      title: 'Sharp daily deals',
      note: 'Fast-moving picks with cleaner price drops',
      icon: <SavingsOutlined sx={{ fontSize: 22 }} />,
    },
    {
      title: 'Protected checkout',
      note: 'Reliable payments, returns and exchange flow',
      icon: <SecurityOutlined sx={{ fontSize: 22 }} />,
    },
  ];

  return (
    <div className="bg-[#fffaf2]">
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-16 pt-4 md:px-6 lg:space-y-12 lg:px-10">
        <ElectricCategory />

        <section className="overflow-hidden rounded-[36px] border border-[#eadfce] bg-[radial-gradient(circle_at_top_left,_rgba(255,208,138,0.45),_transparent_34%),linear-gradient(135deg,#fff6df_0%,#fffdf8_48%,#f7efe4_100%)] shadow-[0_28px_90px_rgba(116,84,38,0.08)]">
          <div className="grid gap-10 px-6 py-8 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-14 lg:py-14">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-[#d1b48a] bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#7c4a1f]">
                New season picks
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-[0.95] text-[#1f2937] sm:text-5xl lg:text-7xl">
                  Make the homepage feel like a live storefront, not a template.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#5b6470] sm:text-base">
                  Fashion-led drops, sharp electronics picks, and warehouse-ready
                  delivery promises in one cleaner customer flow.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  startIcon={<Storefront />}
                  endIcon={<ArrowForward />}
                  variant="contained"
                  size="large"
                  sx={{
                    borderRadius: '999px',
                    bgcolor: '#111827',
                    px: 3.5,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 800,
                    '&:hover': { bgcolor: '#1f2937' },
                  }}
                >
                  Explore Collections
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderRadius: '999px',
                    borderColor: '#d6c1a1',
                    color: '#7c4a1f',
                    px: 3.5,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  View Today&apos;s Offers
                </Button>
              </div>
              <div className="grid gap-3 pt-2 md:grid-cols-3">
                {trustPoints.map((point) => (
                  <div
                    key={point.title}
                    className="rounded-[24px] border border-white/70 bg-white/80 p-4 backdrop-blur"
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1d6] text-[#9a5c21]">
                      {point.icon}
                    </div>
                    <h2 className="text-sm font-extrabold text-[#1f2937]">
                      {point.title}
                    </h2>
                    <p className="mt-1 text-xs leading-6 text-[#67707c]">
                      {point.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-[30px] bg-[#1a2233] p-6 text-white shadow-[0_22px_60px_rgba(26,34,51,0.28)]">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#f8c981]">
                  Focus edit
                </div>
                <h2 className="mt-4 text-2xl font-black">
                  Quiet luxury tones for everyday fits
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Elevated shirts, soft knits, and neutral layers that feel premium
                  without looking loud.
                </p>
                <div className="mt-6 flex items-center justify-between text-sm font-semibold">
                  <span>From Rs 699</span>
                  <span className="text-[#f8c981]">Curated now</span>
                </div>
              </article>

              <article className="rounded-[30px] border border-[#e7d5b7] bg-[#fffdf7] p-6">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#9a5c21]">
                  Fast movers
                </div>
                <h2 className="mt-4 text-2xl font-black text-[#1f2937]">
                  Audio, wearables and desk tech under one clean sweep
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#67707c]">
                  Designed for scrolling shoppers who want fewer blocks, better
                  hierarchy, and stronger calls to action.
                </p>
                <div className="mt-6 rounded-[22px] bg-[#fff1d6] px-4 py-3 text-sm font-semibold text-[#7c4a1f]">
                  Up to 45% off on featured picks today
                </div>
              </article>
            </div>
          </div>
        </section>

        <CategoryGrid />

        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a15d24]">
                Deal sprint
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#18212f] lg:text-5xl">
                Today&apos;s deals and quick grabs
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#67707c]">
              Cleaner cards, stronger price communication, and more intentional
              merchandising instead of filler blocks.
            </p>
          </div>
          <Deal />
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a15d24]">
                Browse lanes
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#18212f] lg:text-5xl">
                Shop by category without the clutter
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#67707c]">
              Distinct category entry points for fashion, home, beauty, gadgets and
              gifting.
            </p>
          </div>
          <ShopByCategory />
        </section>

        <section className="overflow-hidden rounded-[34px] border border-[#d9d4cb] bg-[linear-gradient(120deg,#1a2233_0%,#2f4b59_55%,#d97b29_120%)] px-6 py-8 text-white md:px-10 lg:px-14 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#f9d79f]">
                Closing banner
              </p>
              <h2 className="mt-3 text-3xl font-black lg:text-5xl">
                Summer sale energy, but with a sharper premium finish.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
                Keep the page expressive, bold and fast to scan. Big ideas up top,
                clean decision blocks in the middle, and a strong final CTA.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="contained"
                size="large"
                sx={{
                  borderRadius: '999px',
                  bgcolor: '#fff7e8',
                  color: '#1f2937',
                  px: 3.5,
                  py: 1.25,
                  textTransform: 'none',
                  fontWeight: 800,
                  '&:hover': { bgcolor: '#ffffff' },
                }}
              >
                Start Shopping
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderRadius: '999px',
                  borderColor: 'rgba(255,255,255,0.45)',
                  color: '#fff',
                  px: 3.5,
                  py: 1.25,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                View Categories
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
