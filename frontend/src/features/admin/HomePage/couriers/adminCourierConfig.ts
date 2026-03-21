import { defaultSalaryConfig } from 'features/courier/courierData';
import { NewCourierForm, SalaryConfigForm } from './types';

export const monthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const emptyCourierForm: NewCourierForm = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  zone: '',
  vehicleNumber: '',
  kycIdNumber: '',
  kycDocUrl: '',
};

export const emptySalaryForm: SalaryConfigForm = {
  monthlyBase: String(defaultSalaryConfig.monthlyBase),
  perDeliveryRate: String(defaultSalaryConfig.perDeliveryRate),
  petrolAllowanceMonthlyCap: String(
    defaultSalaryConfig.petrolAllowanceMonthlyCap,
  ),
  targetDeliveries: String(defaultSalaryConfig.targetDeliveries),
  incentiveAmount: String(defaultSalaryConfig.incentiveAmount),
  latePenalty: String(defaultSalaryConfig.latePenalty),
  failedPenalty: String(defaultSalaryConfig.failedPenalty),
  codMismatchPenalty: String(defaultSalaryConfig.codMismatchPenalty),
};
