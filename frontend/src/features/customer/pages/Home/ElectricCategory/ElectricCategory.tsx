import React from 'react';
import ElectricCategoryCard from './ElectricCategoryCard';
import {
  CheckroomOutlined,
  HeadphonesOutlined,
  HomeOutlined,
  SpaOutlined,
  WatchOutlined,
} from '@mui/icons-material';

const ElectricCategory = () => {
  const categories = [
    {
      id: 'audio',
      title: 'Audio',
      subtitle: 'Headphones & speakers',
      accent: 'from-[#ffe0cc] to-[#fff5ef]',
      icon: <HeadphonesOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'wearables',
      title: 'Wearables',
      subtitle: 'Watches & fitness tech',
      accent: 'from-[#dae8ff] to-[#f3f7ff]',
      icon: <WatchOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'fashion',
      title: 'Fashion',
      subtitle: 'Fresh everyday edits',
      accent: 'from-[#ffe4ea] to-[#fff6f8]',
      icon: <CheckroomOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'home',
      title: 'Home',
      subtitle: 'Decor & utility',
      accent: 'from-[#e7f3df] to-[#f7fcf3]',
      icon: <HomeOutlined sx={{ fontSize: 20 }} />,
    },
    {
      id: 'beauty',
      title: 'Beauty',
      subtitle: 'Skincare & wellness',
      accent: 'from-[#efe0ff] to-[#faf5ff]',
      icon: <SpaOutlined sx={{ fontSize: 20 }} />,
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
