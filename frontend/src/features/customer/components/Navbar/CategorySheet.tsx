import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { menLevelTwo } from 'shared/constants/data/Category/Level Two/menLavelTwo';
import { womenLevelTwo } from 'shared/constants/data/Category/Level Two/womenLavelTwo';
import { menLevelThree } from 'shared/constants/data/Category/Level Three/menLavelThree';
import { womenLevelThree } from 'shared/constants/data/Category/Level Three/womenLavelThree';

export type CategoryKey = 'men' | 'women';

type CategoryNode = {
  name: string;
  categoryId: string;
  parentCategoryId: string;
  parentCategoryName?: string;
  level?: number;
};

const categoryTwoMap: Record<CategoryKey, CategoryNode[]> = {
  men: menLevelTwo,
  women: womenLevelTwo,
};

const categoryThreeMap: Record<CategoryKey, CategoryNode[]> = {
  men: menLevelThree,
  women: womenLevelThree,
};

type CategorySheetProps = {
  selectedCategory: CategoryKey;
  setShowSheet: (show: boolean) => void;
};

const CategorySheet = ({
  selectedCategory,
  setShowSheet,
}: CategorySheetProps) => {
  const navigate = useNavigate();

  const getChildCategories = (parentCategoryId: string) => {
    const levelThreeData = categoryThreeMap[selectedCategory] || [];
    return levelThreeData.filter(
      (child) => child.parentCategoryId === parentCategoryId,
    );
  };

  const handleNavigation = (id: string) => {
    navigate(`/products/${id}`);
    setShowSheet(false);
  };

  return (
    <Box className="bg-white shadow-2xl min-h-[400px] border-t border-gray-100 overflow-y-auto">
      <div className="flex flex-wrap px-16 py-10">
        {categoryTwoMap[selectedCategory]?.map((lvl2) => (
          <div key={lvl2.categoryId} className="w-[20%] min-w-[200px] mb-10">
            <p className="text-teal-600 mb-4 font-bold text-sm uppercase tracking-widest">
              {lvl2.name}
            </p>
            <ul className="space-y-2.5">
              {getChildCategories(lvl2.categoryId).map((lvl3) => (
                <li
                  key={lvl3.categoryId}
                  onClick={() => handleNavigation(lvl3.categoryId)}
                  className="text-gray-600 hover:text-teal-500 cursor-pointer text-[14px] transition-colors"
                >
                  {lvl3.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Box>
  );
};

export default CategorySheet;
