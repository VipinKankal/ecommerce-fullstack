import React from 'react';
import { Divider, LinearProgress, Rating } from '@mui/material';
import { LinearProgressProps } from '@mui/material/LinearProgress';
import ReviewCard from './ReviewCard';

const ProductReview = () => {
  const ratingStats: Array<{
    label: string;
    value: number;
    color: NonNullable<LinearProgressProps['color']>;
  }> = [
    { label: 'Excellent', value: 70, color: 'success' },
    { label: 'Very Good', value: 50, color: 'success' },
    { label: 'Good', value: 35, color: 'primary' },
    { label: 'Average', value: 20, color: 'warning' },
    { label: 'Poor', value: 10, color: 'error' },
  ];

  return (
    <div className="mt-12">
      {/* SECTION HEADER */}
      <h3 className="text-xl font-bold text-gray-800 mb-8 border-l-4 border-teal-500 pl-3 uppercase tracking-wide">
        Ratings & Reviews
      </h3>

      {/* TOP: PRODUCT MINI-SUMMARY */}
      <section className="flex flex-col md:flex-row items-center gap-6 p-5 bg-gray-50 rounded-xl mb-10 border border-gray-100">
        <img
          src="https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg"
          alt="Product Mini View"
          className="w-24 h-24 object-cover rounded-lg shadow-sm border border-white"
        />
        <div className="flex-1 text-center md:text-left">
          <div className="pb-1">
            <h1 className="font-bold text-xl text-gray-900 tracking-tight">
              Raam Clothing
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Premium Black Cotton Shirt
            </p>
          </div>
          <div className="flex items-baseline justify-center md:justify-start gap-3">
            <span className="text-2xl font-bold text-gray-900">₹400</span>
            <span className="text-lg text-gray-400 line-through font-light">
              ₹900
            </span>
            <span className="text-teal-600 font-bold text-sm">(90% OFF)</span>
          </div>
        </div>
        <div className="hidden md:block">
          <button className="px-6 py-2 border-2 border-teal-600 text-teal-600 font-bold rounded-lg hover:bg-teal-600 hover:text-white transition-all">
            Write a Review
          </button>
        </div>
      </section>

      {/* BOTTOM: RATINGS GRID */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Rating Summary & Progress Bars */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex items-center gap-5 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h1 className="text-5xl font-extrabold text-gray-900">4.2</h1>
              <div className="flex flex-col">
                <Rating value={4.2} precision={0.1} readOnly size="medium" />
                <p className="text-sm text-gray-500 font-medium">
                  345 Verified Ratings
                </p>
              </div>
            </div>

            <div className="space-y-4 px-2">
              {ratingStats.map((stat, index) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <span className="text-xs font-bold w-14 text-gray-600">
                    {5 - index} Star
                  </span>
                  <div className="flex-1">
                    <LinearProgress
                      variant="determinate"
                      value={stat.value}
                      color={stat.color}
                      sx={{ height: 6, borderRadius: 5, bgcolor: '#f0f0f0' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {stat.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Review Cards */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-gray-700">Customer Feedback</p>
              <select className="text-sm border-none bg-transparent font-semibold text-teal-600 cursor-pointer outline-none">
                <option>Most Recent</option>
                <option>Highest Rating</option>
                <option>Lowest Rating</option>
              </select>
            </div>
            <Divider />
            {[1, 2, 3].map((item) => (
              <React.Fragment key={item}>
                <ReviewCard />
                {item !== 3 && <Divider sx={{ opacity: 0.6 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductReview;
