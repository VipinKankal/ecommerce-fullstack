import React from 'react';
import {
  Box,
  Step,
  StepLabel,
  StepConnector,
  Stepper,
  styled,
  stepConnectorClasses,
} from '@mui/material';
import { buildTrackingMilestones } from 'features/courier/courierData';

const ColorlibConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    backgroundColor: '#0f172a',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    backgroundColor: '#16a34a',
  },
}));

type OrderStepperProps = {
  orderStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
};

const OrderStepper = ({
  orderStatus,
  fulfillmentStatus,
  shipmentStatus,
}: OrderStepperProps) => {
  const milestones = buildTrackingMilestones({
    orderStatus,
    fulfillmentStatus,
    shipmentStatus,
  });
  const activeIndex = Math.max(
    0,
    milestones.findIndex((step) => step.active),
  );

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Stepper
        activeStep={activeIndex}
        alternativeLabel
        connector={<ColorlibConnector />}
      >
        {milestones.map((step) => (
          <Step key={step.key} completed={step.completed}>
            <StepLabel
              StepIconProps={{
                sx: {
                  '&.Mui-active': { color: '#0f172a' },
                  '&.Mui-completed': { color: '#16a34a' },
                },
              }}
            >
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-tight">
                {step.label}
              </span>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default OrderStepper;
