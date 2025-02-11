import React from 'react';
import { Controller } from 'react-hook-form';
import { BaseFieldProps } from './types';

interface EnumFieldProps extends BaseFieldProps {
  values: string[];
}

export const EnumField: React.FC<EnumFieldProps> = ({
  name,
  label,
  placeholder,
  required,
  readonly,
  error,
  control,
  values,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label} {required && '*'}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            disabled={readonly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {values.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        )}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};