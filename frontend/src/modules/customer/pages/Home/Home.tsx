import React from "react";
import ElectricCategory from "./ElectricCategory/ElectricCategory";
import CategoryGrid from "./CategoryGrid/CategoryGrid";
import Deal from "./Deal/Deal";
import ShopByCategory from "./ShopByCategory/ShopByCategory";
import { Button } from "@mui/material";
import { Storefront } from "@mui/icons-material";

const Home = () => {
  const heroImage = null;

  return (
    <>
      <div className="space-y-5 lg:space-y-10 relative">
        <div>
          <ElectricCategory />
        </div>
        <div>
          <CategoryGrid />
        </div>
        <div>
          <h1 className="text-lg lg:text-4xl font-bold text-primary-color pb-5 lg:pb-20 text-center">
            Today deals & Offers
          </h1>
          <Deal />
        </div>
        <section className="pt-10">
          <h1 className="text-lg lg:text-4xl font-bold text-primary-color pb-5 lg:pb-20 text-center">
            Shop By Category
          </h1>
          <ShopByCategory />
        </section>
        <section className="pt-20  relative h-[200px] lg:h-[450px] object-cover">
          {heroImage ? <img className="w-full h-full" src={heroImage} alt="Promotional banner" /> : <div className="w-full h-full bg-gradient-to-r from-orange-100 via-amber-50 to-rose-100" />}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-semibold lg:text-4x1 space-y-3">
            <h1>Summer Sale - Up to 50% Off!</h1>
            <p className="text-lg md:text-2x1">
              with <span className="logo">name logo</span>
            </p>
            <div className="pt-6 flex justify-center">
              <Button
                startIcon={<Storefront />}
                variant="contained"
                size="large"
              >
                Shop Now
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;

