import React from 'react';
import { useController } from 'react-hook-form';
import { DefaultFieldProps } from './types';
import { useCMSStore } from '../../../store/cms';
import { getThemeClasses } from '../../theme/ThemeProvider';

export const DefaultField: React.FC<DefaultFieldProps> = ({
  name,
  label,
  type,
  placeholder,
  required,
  readonly,
  error,
  control,
}) => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  const { field } = useController({
    name,
    control,
    defaultValue: type === 'number' ? '' : '',
  });

  // Convert value to string for input display
  const displayValue = field.value != null ? String(field.value) : '';

  // Extract accent color for focus ring
  const accentColor = themeClasses.accent.split('-')[1];

  return (
    <div className="space-y-1">
      <label htmlFor={name} className={`block text-sm font-medium ${themeClasses.text}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...field}
        value={type === 'file' ? undefined : displayValue}
        type={type}
        id={name}
        placeholder={type === 'file' ? undefined : placeholder}
        readOnly={readonly}
        className={`
          mt-1 block w-full rounded-md shadow-sm 
          ${themeClasses.modalBackground} 
          ${themeClasses.text} 
          ${themeClasses.border}
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : `focus:border-${accentColor}-500 focus:ring-${accentColor}-500`
          }
          focus:ring-2 focus:ring-opacity-50
          disabled:opacity-50
          transition-colors duration-200
          placeholder:${themeClasses.secondaryText}
        `}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
