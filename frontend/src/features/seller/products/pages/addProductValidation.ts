import * as Yup from 'yup';
import {
  categoryThree,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
} from './addProductConfig';

export const addProductValidationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  brand: Yup.string().required('Brand is required'),
  description: Yup.string()
    .trim()
    .min(20, 'Description too short')
    .max(
      PRODUCT_DESCRIPTION_MAX_LENGTH,
      `Description can be at most ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters`,
    )
    .required('Description is required'),
  shortDescription: Yup.string().required('Short description is required'),
  hsnCode: Yup.string()
    .trim()
    .matches(/^\d{4,8}$/, 'HSN code must be 4 to 8 digits')
    .required('HSN code is required'),
  mrpPrice: Yup.number().positive().required('MRP is required'),
  sellingPrice: Yup.number().positive().required('Selling price is required'),
  pricingMode: Yup.string()
    .oneOf(['INCLUSIVE', 'EXCLUSIVE'])
    .required('Pricing mode is required'),
  taxClass: Yup.string().trim().required('Tax class is required'),
  taxRuleVersion: Yup.string().trim().required('Tax rule version is required'),
  taxPercentage: Yup.number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .min(0, 'Tax percentage cannot be negative')
    .max(100, 'Tax percentage cannot exceed 100')
    .required('Tax percentage is required'),
  platformCommission: Yup.number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .min(0, 'Platform commission cannot be negative')
    .required('Platform commission is required'),
  costPrice: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .min(0, 'Cost price cannot be negative'),
  stockQuantity: Yup.number().min(0).required('Stock quantity is required'),
  warrantyType: Yup.string().oneOf(['NONE', 'BRAND', 'SELLER']),
  warrantyDays: Yup.number().when('warrantyType', {
    is: (value: string) => value && value !== 'NONE',
    then: (schema) =>
      schema
        .min(1, 'Warranty days must be at least 1')
        .required('Warranty days are required'),
    otherwise: (schema) => schema.min(0),
  }),
  category: Yup.string().required('Required'),
  category2: Yup.string().required('Required'),
  category3: Yup.string().test(
    'category3-required',
    'Required',
    function (value) {
      const { category, category2 } = this.parent as {
        category?: string;
        category2?: string;
      };
      const options =
        category && category2
          ? (categoryThree[category] || []).filter(
              (item) => item.parentCategoryId === category2,
            )
          : [];
      if (!options.length) return true;
      return Boolean(value);
    },
  ),
  images: Yup.array().min(3, 'Minimum 3 images are required'),
  manufacturerName: Yup.string().required('Manufacturer name is required'),
});
