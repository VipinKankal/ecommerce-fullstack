import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { teal } from '@mui/material/colors';
import { colors } from 'shared/constants/data/Filter/color';
import { brand } from 'shared/constants/data/Filter/brand';
import { price } from 'shared/constants/data/Filter/price';
import { discount } from 'shared/constants/data/Filter/discount';

const FilterSections = () => {
  const [expendColor, setExpendColor] = useState(false);
  const [expendBrand, setExpendBrand] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleExpendBrand = () => setExpendBrand((prev) => !prev);
  const handleExpendColor = () => setExpendColor((prev) => !prev);

  const updateFilterParams = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    const newParams = new URLSearchParams(searchParams);

    if (value) {
      newParams.set(name, value);
    } else {
      newParams.delete(name);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => setSearchParams({});

  return (
    <div className="-z-50 space-y-5 bg-white">
      <div className="flex items-center justify-between h-[40px] px-9 lg:border-r">
        <p className="text-lg font-semibold">Filters</p>
        <Button
          onClick={clearAllFilters}
          size="small"
          sx={{
            color: teal[600],
            fontWeight: 'bold',
            textTransform: 'lowercase',
          }}
        >
          clear all
        </Button>
      </div>
      <Divider />

      <div className="px-9 space-y-6">
        <section>
          <FormControl component="fieldset">
            <FormLabel
              sx={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: teal[500],
                pb: '14px',
              }}
            >
              Brand
            </FormLabel>
            <RadioGroup
              value={searchParams.get('brand') || ''}
              name="brand"
              onChange={updateFilterParams}
            >
              {brand.slice(0, expendBrand ? brand.length : 5).map((item) => (
                <FormControlLabel
                  key={item.name}
                  value={item.name}
                  control={<Radio size="small" />}
                  label={item.name}
                />
              ))}
            </RadioGroup>
          </FormControl>
          {brand.length > 5 && (
            <button
              onClick={handleExpendBrand}
              className="text-teal-600 hover:text-teal-900 block mt-2 text-sm"
            >
              {expendBrand ? 'hide' : `+${brand.length - 5} more`}
            </button>
          )}
        </section>

        <section>
          <FormControl component="fieldset">
            <FormLabel
              sx={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: teal[500],
                pb: '14px',
              }}
            >
              Color
            </FormLabel>
            <RadioGroup
              value={searchParams.get('color') || ''}
              name="color"
              onChange={updateFilterParams}
            >
              {colors.slice(0, expendColor ? colors.length : 5).map((item) => (
                <FormControlLabel
                  key={item.name}
                  value={item.name}
                  control={<Radio size="small" />}
                  label={
                    <div className="flex items-center gap-3">
                      <p>{item.name}</p>
                      <div
                        style={{ backgroundColor: item.hex }}
                        className={`h-4 w-4 rounded-full border ${
                          item.name === 'White'
                            ? 'border-gray-300'
                            : 'border-transparent'
                        }`}
                      />
                    </div>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
          {colors.length > 5 && (
            <button
              onClick={handleExpendColor}
              className="text-teal-600 hover:text-teal-900 block mt-2 text-sm"
            >
              {expendColor ? 'hide' : `+${colors.length - 5} more`}
            </button>
          )}
        </section>

        <section>
          <FormControl component="fieldset">
            <FormLabel
              sx={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: teal[500],
                pb: '14px',
              }}
            >
              Price
            </FormLabel>
            <RadioGroup
              value={searchParams.get('price') || ''}
              name="price"
              onChange={updateFilterParams}
            >
              {price.map((item) => (
                <FormControlLabel
                  key={item.name}
                  value={item.value}
                  control={<Radio size="small" />}
                  label={item.name}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </section>

        <section>
          <FormControl component="fieldset">
            <FormLabel
              sx={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: teal[500],
                pb: '14px',
              }}
            >
              Discount
            </FormLabel>
            <RadioGroup
              value={searchParams.get('discount') || ''}
              name="discount"
              onChange={updateFilterParams}
            >
              {discount.map((item) => (
                <FormControlLabel
                  key={item.name}
                  value={item.value.toString()}
                  control={<Radio size="small" />}
                  label={item.name}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </section>
      </div>
    </div>
  );
};

export default FilterSections;
