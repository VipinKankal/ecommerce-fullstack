import React from 'react';

const CategoryGrid = () => {
  const highlights = [
    {
      id: 'tailored',
      title: 'Tailored Layers',
      subtitle: 'Structured shirts, soft neutrals',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 md:col-span-6 xl:col-span-4 xl:row-span-2 min-h-[260px] xl:min-h-[560px]',
    },
    {
      id: 'audio',
      title: 'Desk Audio',
      subtitle: 'Portable sound for work and play',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 sm:col-span-6 xl:col-span-3 min-h-[220px]',
    },
    {
      id: 'beauty',
      title: 'Self-care Shelf',
      subtitle: 'Skincare and glow essentials',
      image:
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 sm:col-span-6 xl:col-span-5 min-h-[220px]',
    },
    {
      id: 'living',
      title: 'Warm Living',
      subtitle: 'Home pieces with tactile calm',
      image:
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 sm:col-span-7 xl:col-span-5 min-h-[220px]',
    },
    {
      id: 'wearables',
      title: 'Smart Everyday',
      subtitle: 'Wearables that stay useful',
      image:
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 sm:col-span-5 xl:col-span-3 min-h-[220px]',
    },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a15d24]">
            Editorial grid
          </p>
          <h2 className="mt-2 text-3xl font-black text-[#18212f] lg:text-5xl">
            Hero stories that feel merchandised
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[#67707c]">
          A better first-scroll mix of fashion, home and tech, with clear copy and
          stronger visual rhythm.
        </p>
      </div>
      <div className="grid grid-cols-12 gap-4 lg:auto-rows-[170px]">
        {highlights.map((item) => (
          <article
            key={item.id}
            className={`${item.className} group relative overflow-hidden rounded-[30px]`}
          >
            <img
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={item.image}
              alt={item.title}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.68)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white lg:p-7">
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#ffd89d]">
                curated
              </div>
              <h3 className="mt-2 text-2xl font-black">{item.title}</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-200">
                {item.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
