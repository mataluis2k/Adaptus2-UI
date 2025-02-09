import React, { useState } from 'react';
import { useController } from 'react-hook-form';
import { ImageFieldProps } from './types';
import { Image, Upload } from 'lucide-react';

export const ImageField: React.FC<ImageFieldProps> = ({
  name,
  label,
  required,
  readonly,
  error,
  control,
  validation,
}) => {
  const [preview, setPreview] = useState<string>();
  const { field } = useController({
    name,
    control,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (validation?.fileTypes && !validation.fileTypes.includes(file.type.split('/')[1])) {
      console.error('Invalid file type');
      return;
    }

    // Validate file size
    if (validation?.maxSize) {
      const maxBytes = parseInt(validation.maxSize) * 1024 * 1024; // Convert MB to bytes
      if (file.size > maxBytes) {
        console.error('File too large');
        return;
      }
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreview(url);
    field.onChange(file);
  };

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {preview ? (
            <div className="relative w-full max-w-[200px] mx-auto">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-32 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(undefined);
                  field.onChange(null);
                }}
                className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Image className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor={name}
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id={name}
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept={validation?.fileTypes?.map(type => `.${type}`).join(',')}
                    disabled={readonly}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {validation?.fileTypes
                  ? `${validation.fileTypes.join(', ')} up to ${validation.maxSize || '5MB'}`
                  : 'PNG, JPG, GIF up to 5MB'}
              </p>
            </div>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
