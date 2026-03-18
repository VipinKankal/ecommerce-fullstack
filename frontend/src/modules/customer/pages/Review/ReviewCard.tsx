import { Avatar, Box, Rating } from "@mui/material";
import React from "react";

const ReviewCard = () => {
  return (
    <div className="flex gap-5 py-6">
      {/* Left: Avatar */}
      <Box>
        <Avatar
          sx={{ width: 50, height: 50, bgcolor: "#9155FD" }}
          className="shadow-sm uppercase font-bold"
        >
          V
        </Avatar>
      </Box>

      {/* Right: Content */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-800">Vipin Kumar</p>
            <p className="text-xs text-gray-400">January 28, 2026</p>
          </div>
        </div>

        <Rating 
            readOnly 
            value={4.5} 
            precision={0.5} 
            size="small" 
            sx={{ my: 0.5 }}
        />

        <p className="text-gray-600 text-sm leading-relaxed mt-1">
          The quality of the cotton is amazing. It fits perfectly and feels premium. 
          The color didn't fade after the first wash either. Highly recommended!
        </p>
        
        {/* Optional Review Image */}
        <div className="flex gap-2 mt-3">
            <img 
                src="https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/4/s/r/-original-imahegzpuyqzpqcr.jpeg" 
                alt="user-review" 
                className="w-16 h-16 rounded-md object-cover border border-gray-200 cursor-zoom-in" 
            />
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
