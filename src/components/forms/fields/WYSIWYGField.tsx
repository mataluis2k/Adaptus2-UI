import React from 'react';
import { useController } from 'react-hook-form';
import { WYSIWYGFieldProps } from './types';

export const WYSIWYGField: React.FC<WYSIWYGFieldProps> = ({
  name,
  label,
  placeholder,
  required,
  readonly,
  error,
  control,
}) => {
  const { field } = useController({
    name,
    control,
    defaultValue: '',
  });

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1 relative">
        <textarea
          {...field}
          id={name}
          placeholder={placeholder}
          readOnly={readonly}
          rows={6}
          className={`block w-full rounded-md shadow-sm resize-y min-h-[150px] ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};
