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
  mrpPrice: Yup.number().positive().required('MRP is required'),
  sellingPrice: Yup.number().positive().required('Selling price is required'),
  stockQuantity: Yup.number().min(0).required('Stock quantity is required'),
  warrantyType: Yup.string().oneOf(['NONE', 'BRAND', 'SELLER']),
  warrantyDays: Yup.number().when('warrantyType', {
    is: (value: string) => value && value !== 'NONE',
    then: (schema) =>
      schema.min(1, 'Warranty days must be at least 1').required(
        'Warranty days are required',
      ),
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
