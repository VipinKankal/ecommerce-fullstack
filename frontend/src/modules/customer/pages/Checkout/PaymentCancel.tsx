import React from "react";
import { Button } from "@mui/material";
import { teal } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border rounded-xl shadow-sm p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Payment Cancelled</h1>
        <p className="text-gray-600">No charges were made. You can retry checkout anytime.</p>
        <div className="flex gap-3 justify-center pt-2">
          <Button
            variant="outlined"
            onClick={() => navigate("/checkout/cart")}
            sx={{ borderColor: teal[600], color: teal[700] }}
          >
            Back To Cart
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/checkout/payment")}
            sx={{ bgcolor: teal[600], "&:hover": { bgcolor: teal[800] } }}
          >
            Retry Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;

