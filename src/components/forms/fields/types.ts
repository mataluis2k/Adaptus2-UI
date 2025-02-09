import { Control } from 'react-hook-form';

export interface BaseFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  error?: string;
  control: Control<any>;
}

export interface DefaultFieldProps extends BaseFieldProps {
  type: string;
}

export interface WYSIWYGFieldProps extends BaseFieldProps {}

export interface ImageFieldProps extends BaseFieldProps {
  validation?: {
    required?: boolean;
    maxLength?: number;
    fileTypes?: string[];
    maxSize?: string;
  };
}

export interface VideoFieldProps extends BaseFieldProps {}
