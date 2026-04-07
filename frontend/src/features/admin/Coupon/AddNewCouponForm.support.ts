import * as Yup from 'yup';

export const validationSchema = Yup.object({
  code: Yup.string().required('Coupon code is required').min(3, 'Code is too short'),
  discountType: Yup.string().required('Discount type is required'),
  discountValue: Yup.number()
    .required('Discount value is required')
    .min(1, 'Minimum discount must be 1'),
  maxDiscount: Yup.number().min(0, 'Cannot be negative').nullable(),
  minOrderValue: Yup.number()
    .required('Minimum order value is required')
    .min(0, 'Cannot be negative'),
  usageLimit: Yup.number().min(1, 'Minimum usage limit is 1').nullable(),
  perUserLimit: Yup.number().min(1, 'Minimum per-user limit is 1').nullable(),
  scopeType: Yup.string().required('Scope type is required'),
  scopeId: Yup.number()
    .nullable()
    .when('scopeType', {
      is: (value: string) => value && value !== 'GLOBAL',
      then: (schema) => schema.required('Scope id is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  userEligibilityType: Yup.string().required('User eligibility is required'),
  inactiveDaysThreshold: Yup.number()
    .nullable()
    .when('userEligibilityType', {
      is: (value: string) => value === 'INACTIVE_USERS_ONLY',
      then: (schema) =>
        schema
          .required('Inactive days threshold is required')
          .min(1, 'Inactive days must be at least 1'),
      otherwise: (schema) => schema.nullable(),
    }),
  startDate: Yup.date().required('Start date is required').nullable(),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date cannot be before start date')
    .nullable(),
});

export const currencyStartAdornment = 'Rs';
