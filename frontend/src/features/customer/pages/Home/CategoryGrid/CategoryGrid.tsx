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
      id: 'denim',
      title: 'Denim Rotation',
      subtitle: 'Straight fits, wide legs and washed blues',
      image:
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 sm:col-span-6 xl:col-span-3 min-h-[220px]',
    },
    {
      id: 'ethnic',
      title: 'Ethnic Staples',
      subtitle: 'Kurtas, co-ords and festive texture',
      image:
        'https://images.unsplash.com/photo-1610030469668-6c0c2c7ea74b?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 sm:col-span-6 xl:col-span-5 min-h-[220px]',
    },
    {
      id: 'footwear',
      title: 'Everyday Footwear',
      subtitle: 'Easy pairs built for repeat wear',
      image:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
      className: 'col-span-12 sm:col-span-7 xl:col-span-5 min-h-[220px]',
    },
    {
      id: 'basics',
      title: 'Core Basics',
      subtitle: 'Tees, innerwear and soft lounge pieces',
      image:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
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
            Hero stories built only for apparel
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[#67707c]">
          A cleaner first-scroll mix of menswear, womenswear, ethnic and footwear
          with stronger fashion rhythm.
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
