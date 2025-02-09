import React from 'react';
import { useController } from 'react-hook-form';
import { VideoFieldProps } from './types';
import { Video } from 'lucide-react';

export const VideoField: React.FC<VideoFieldProps> = ({
  name,
  label,
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
      <div className="mt-1">
        <input
          {...field}
          type="url"
          id={name}
          placeholder="Enter video URL"
          readOnly={readonly}
          className={`block w-full rounded-md shadow-sm ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {field.value && (
          <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-gray-100">
            <video
              src={field.value}
              controls
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {!field.value && (
          <div className="mt-2 aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <Video className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-1 text-sm text-gray-500">
                Enter a video URL to preview
              </p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
