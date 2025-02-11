import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCMSStore } from '../../store/cms';
import { FieldConfig } from '../../types/cms';
import { DefaultField } from './fields/DefaultField';
import { EnumField } from './fields/EnumField';
import { WYSIWYGField } from './fields/WYSIWYGField';
import { ImageField } from './fields/ImageField';
import { VideoField } from './fields/VideoField';
import { BaseFieldProps } from './fields/types';
import { getThemeClasses } from '../theme/ThemeProvider';

interface DynamicFormProps {
  tableId: string;
  initialData?: Record<string, any>;
  onSubmit: (data: any) => void;
}

export const DynamicForm = ({ tableId, initialData, onSubmit }: DynamicFormProps) => {
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  if (!config || !config.cms.tables[tableId]) {
    return <div>Table configuration not found</div>;
  }

  const table = config.cms.tables[tableId];
  const { fields, detailView } = table;

  // Generate Zod schema based on field configurations
  const generateSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    Object.entries(fields).forEach(([fieldName, field]) => {
      if (field.hidden) return;

      let fieldSchema: z.ZodTypeAny;
      
      switch (field.type) {
        case 'text':
        case 'string': {
          let schema = z.string();
          if (field.validation?.required) {
            schema = schema.nonempty('This field is required');
          }
          if (field.validation?.maxLength) {
            schema = schema.max(field.validation.maxLength, {
              message: `Maximum length is ${field.validation.maxLength} characters`
            });
          }
          fieldSchema = schema;
          break;
        }
        case 'enum': {
          if (field.values && Array.isArray(field.values)) {
            // z.enum expects a tuple; cast the values array accordingly.
            fieldSchema = z.enum(field.values as [string, ...string[]]);
            if (!field.validation?.required) {
              fieldSchema = fieldSchema.optional();
            }
          } else {
            fieldSchema = z.string();
          }
          break;
        }
        case 'number': {
          let schema = z.string()
            .transform((val) => (val === '' ? undefined : Number(val)))
            .pipe(
              field.validation?.required
                ? z.number({
                    invalid_type_error: 'Must be a number',
                    required_error: 'This field is required',
                  })
                : z.number({
                    invalid_type_error: 'Must be a number',
                  }).optional()
            );
          fieldSchema = schema;
          break;
        }
        case 'file': {
          if (field.validation?.required) {
            fieldSchema = z
              .any()
              .refine(
                (val) =>
                  val &&
                  val instanceof FileList &&
                  val.length > 0,
                { message: 'File is required' }
              )
              .transform((val) => (val as FileList)[0]);
          } else {
            fieldSchema = z
              .any()
              .optional()
              .transform((val) =>
                val && val instanceof FileList && val.length > 0 ? (val as FileList)[0] : undefined
              );
          }
          break;
        }
        default:
          fieldSchema = z.any();
      }

      schemaFields[fieldName] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const formSchema = generateSchema();
  type FormData = z.infer<typeof formSchema>;

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
    mode: 'onChange',
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Reset form when table changes
  useEffect(() => {
    reset({});
  }, [tableId, reset]);

  const renderField = React.useCallback((fieldName: string, fieldConfig: FieldConfig) => {
    if (fieldConfig.hidden) return null;

    const error = errors[fieldName]?.message as string | undefined;

    const commonProps: BaseFieldProps = {
      name: fieldName,
      label: fieldConfig.label,
      placeholder: fieldConfig.ui?.placeholder,
      required: fieldConfig.validation?.required,
      readonly: fieldConfig.readonly,
      error,
      control,
    };

    switch (fieldConfig.ui?.template) {
      case 'wysiwyg':
        return (
          <WYSIWYGField
            key={`${tableId}-${fieldName}`}
            {...commonProps}
          />
        );
      case 'image-uploader':
        return (
          <ImageField
            key={`${tableId}-${fieldName}`}
            {...commonProps}
            validation={fieldConfig.validation}
          />
        );
      case 'video-preview':
        return (
          <VideoField
            key={`${tableId}-${fieldName}`}
            {...commonProps}
          />
        );
      default:
        if (fieldConfig.type === 'enum' && Array.isArray(fieldConfig.values)) {
          return (
            <EnumField
              key={`${tableId}-${fieldName}`}
              {...commonProps}
              values={fieldConfig.values}
            />
          );
        }
        return (
          <DefaultField
            key={`${tableId}-${fieldName}`}
            {...commonProps}
            type={fieldConfig.type}
          />
        );
    }
  }, [tableId, errors, control]);

  const renderTabs = () => {
    if (!detailView.tabs) {
      return (
        <div className="space-y-6">
          {Object.entries(fields).map(([fieldName, field]) => renderField(fieldName, field))}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(detailView.tabs).map(([tabName, tabFields]) => (
          <div key={tabName} className="space-y-4">
            <h3 className={`text-lg font-medium ${themeClasses.text}`}>{tabName}</h3>
            <div className="space-y-4">
              {tabFields.map((fieldName) => renderField(fieldName, fields[fieldName]))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {renderTabs()}
      <div className="flex justify-end">
        <button
          type="submit"
          className={`px-4 py-2 ${themeClasses.accent} text-white rounded-md hover:opacity-90 transition-opacity`}
        >
          Save
        </button>
      </div>
    </form>
  );
};
