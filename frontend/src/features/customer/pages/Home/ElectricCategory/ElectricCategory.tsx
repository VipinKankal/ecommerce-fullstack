import React from 'react';
import ElectricCategoryCard from './ElectricCategoryCard';
import {
  BedtimeOutlined,
  CheckroomOutlined,
  DryCleaningOutlined,
  HikingOutlined,
  LocalMallOutlined,
} from '@mui/icons-material';

const ElectricCategory = () => {
  const categories = [
    {
      id: 'menswear',
      title: 'Menswear',
      subtitle: 'Shirts, tees and tailored layers',
      accent: 'from-[#ffe0cc] to-[#fff5ef]',
      icon: <CheckroomOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'womenswear',
      title: 'Womenswear',
      subtitle: 'Tops, kurtis and denim edits',
      accent: 'from-[#dae8ff] to-[#f3f7ff]',
      icon: <DryCleaningOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'ethnic',
      title: 'Ethnic',
      subtitle: 'Festive and fusion-ready fits',
      accent: 'from-[#ffe4ea] to-[#fff6f8]',
      icon: <LocalMallOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'footwear',
      title: 'Footwear',
      subtitle: 'Sneakers, sandals and staples',
      accent: 'from-[#e7f3df] to-[#f7fcf3]',
      icon: <HikingOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'basics',
      title: 'Basics',
      subtitle: 'Sleepwear, innerwear and repeats',
      accent: 'from-[#efe0ff] to-[#faf5ff]',
      icon: <BedtimeOutlined sx={{ fontSize: 20 }} />,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {categories.map((item) => (
        <ElectricCategoryCard key={item.id} {...item} />
      ))}
    </div>
  );
};

export default ElectricCategory;
