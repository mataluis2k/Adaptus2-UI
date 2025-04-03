import { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  useSensors, 
  useSensor, 
  PointerSensor,
  DragOverlay
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { api } from '../../api/client';

// Component types definition
const COMPONENT_TYPES = [
  { id: 'text', name: 'Text', icon: 'text' },
  { id: 'image', name: 'Image', icon: 'image' },
  { id: 'button', name: 'Button', icon: 'button' },
  { id: 'input', name: 'Input Field', icon: 'input' },
  { id: 'list', name: 'List', icon: 'list' },
  { id: 'card', name: 'Card', icon: 'card' },
  { id: 'column', name: 'Column Layout', icon: 'column' },
  { id: 'form', name: 'Form', icon: 'form' },
  { id: 'video', name: 'Video', icon: 'video' },
  { id: 'audio', name: 'Audio', icon: 'audio' },

  
];

// Helper function to render component preview
const renderComponentPreview = (component) => {
  if (!component) return null;
  if (component.component === 'video') {
    return (
      <div className="p-2 border border-gray-200 rounded flex items-center">
        <div className="w-16 h-9 bg-gray-800 relative mr-2 flex-shrink-0 rounded overflow-hidden">
          {component.props.thumbnail ? (
            <img 
              src={component.props.thumbnail} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="overflow-hidden">
          <div className="truncate font-medium">{component.props.title || 'Video'}</div>
          <div className="text-xs text-gray-500 truncate">{component.props.videoUrl || 'No video URL set'}</div>
        </div>
      </div>
    );
  }
  
  // Basic preview rendering
  return (
    <div className="p-2 border border-gray-200 rounded">
      {component.component}: {JSON.stringify(component.props).substring(0, 30)}...
      {component.position && <div className="text-xs text-gray-500 mt-1">Position: {component.position}</div>}
    </div>
  );
};

// Sortable component wrapper
const SortableComponent = ({ component, onEdit, onRemove, onDuplicate }) => {
  return (
    <div className="mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{component.component}</span>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(component.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button 
            onClick={() => onDuplicate(component.id)}
            className="text-green-600 hover:text-green-800"
          >
            Duplicate
          </button>
          <button 
            onClick={() => onRemove(component.id)}
            className="text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      </div>
      {renderComponentPreview(component)}
    </div>
  );
};

// Component palette item
const ComponentPaletteItem = ({ type, onAdd }) => {
  return (
    <button
      onClick={() => onAdd(type.id)}
      className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors"
    >
      <span className="text-sm">{type.name}</span>
    </button>
  );
};

// Component editor
const ComponentEditor = ({ component, onChange, onClose }) => {
  const [editedProps, setEditedProps] = useState(component.props);
  const [editedPosition, setEditedPosition] = useState(component.position || 'relative');
  const [editedChildren, setEditedChildren] = useState(component.children || []);
  
  // Generic handler for simple string/number inputs
  const handleChange = (key, value) => {
    setEditedProps({
      ...editedProps,
      [key]: value
    });
  };
  
  // Handler for object values
  const handleObjectChange = (key, fieldKey, fieldValue) => {
    setEditedProps({
      ...editedProps,
      [key]: {
        ...(editedProps[key] || {}),
        [fieldKey]: fieldValue
      }
    });
  };
  
  // Handler for array values
  const handleArrayChange = (key, index, value) => {
    const newArray = [...(editedProps[key] || [])];
    newArray[index] = value;
    
    setEditedProps({
      ...editedProps,
      [key]: newArray
    });
  };
  
  // Add item to array
  const handleAddArrayItem = (key) => {
    setEditedProps({
      ...editedProps,
      [key]: [...(editedProps[key] || []), '']
    });
  };
  
  // Remove item from array
  const handleRemoveArrayItem = (key, index) => {
    const newArray = [...(editedProps[key] || [])];
    newArray.splice(index, 1);
    
    setEditedProps({
      ...editedProps,
      [key]: newArray
    });
  };
  
  // Save changes
  const handleSave = () => {
    onChange({
      ...component,
      props: editedProps,
      position: editedPosition,
      ...(component.component === 'column' ? { children: editedChildren } : {})
    });
  };
  
  // Render appropriate editor for different property types
  const renderPropertyEditor = (key, value) => {
    // Handle complex nested objects specially
    if (key === 'action' && typeof value === 'object') {
      return (
        <div key={key} className="border border-gray-200 p-3 rounded bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
          <select
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 mb-2"
            value={value.type || 'navigate'}
            onChange={(e) => handleObjectChange(key, 'type', e.target.value)}
          >
            <option value="navigate">Navigate</option>
            <option value="link">External Link</option>
            <option value="submit">Submit Form</option>
            <option value="custom">Custom Action</option>
          </select>
          
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Value</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={value.value || ''}
            onChange={(e) => handleObjectChange(key, 'value', e.target.value)}
          />
        </div>
      );
    }
    if (key === 'video') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={editedProps.videoUrl || ''}
              onChange={(e) => handleChange('videoUrl', e.target.value)}
              placeholder="https://example.com/video.mp4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={editedProps.thumbnail || ''}
              onChange={(e) => handleChange('thumbnail', e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={editedProps.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoplay"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              checked={!!editedProps.autoplay}
              onChange={(e) => handleChange('autoplay', e.target.checked)}
            />
            <label htmlFor="autoplay" className="ml-2 block text-sm text-gray-700">
              Autoplay
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="controls"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              checked={editedProps.controls !== false}
              onChange={(e) => handleChange('controls', e.target.checked)}
            />
            <label htmlFor="controls" className="ml-2 block text-sm text-gray-700">
              Show Controls
            </label>
          </div>
        </div>
      );
    }
    // Special handling for form fields
    if (key === 'fields' && Array.isArray(value)) {
      return (
        <div key={key} className="border border-gray-200 p-3 rounded bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Form Fields</label>
            <button 
              onClick={() => {
                const newFields = [...value, {
                  id: crypto.randomUUID(),
                  name: 'field' + (value.length + 1),
                  type: 'text',
                  label: 'Field ' + (value.length + 1),
                  placeholder: '',
                  required: false,
                  options: []
                }];
                handleChange(key, newFields);
              }}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              + Add Field
            </button>
          </div>
          
          {value.length === 0 && (
            <div className="text-sm text-gray-500 italic mb-2">No fields added yet</div>
          )}
          
          {value.map((field, index) => (
            <div key={index} className="mb-4 p-3 border border-gray-200 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{field.label || `Field ${index + 1}`}</span>
                <button
                  onClick={() => {
                    const newFields = [...value];
                    newFields.splice(index, 1);
                    handleChange(key, newFields);
                  }}
                  className="text-red-600 hover:text-red-800 px-2"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name (ID)</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={field.name || ''}
                    onChange={(e) => {
                      const newFields = [...value];
                      newFields[index] = { ...newFields[index], name: e.target.value };
                      handleChange(key, newFields);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={field.type || 'text'}
                    onChange={(e) => {
                      const newFields = [...value];
                      newFields[index] = { ...newFields[index], type: e.target.value };
                      handleChange(key, newFields);
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="tel">Phone</option>
                    <option value="password">Password</option>
                    <option value="textarea">Text Area</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="date">Date</option>
                    <option value="file">File Upload</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={field.label || ''}
                    onChange={(e) => {
                      const newFields = [...value];
                      newFields[index] = { ...newFields[index], label: e.target.value };
                      handleChange(key, newFields);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={field.placeholder || ''}
                    onChange={(e) => {
                      const newFields = [...value];
                      newFields[index] = { ...newFields[index], placeholder: e.target.value };
                      handleChange(key, newFields);
                    }}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={!!field.required}
                    onChange={(e) => {
                      const newFields = [...value];
                      newFields[index] = { ...newFields[index], required: e.target.checked };
                      handleChange(key, newFields);
                    }}
                  />
                  <label htmlFor={`required-${index}`} className="ml-2 block text-xs font-medium text-gray-700">
                    Required Field
                  </label>
                </div>
              </div>
              
              {/* Options for select, checkbox or radio fields */}
              {['select', 'checkbox', 'radio'].includes(field.type) && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-700">Options</label>
                    <button 
                      onClick={() => {
                        const newFields = [...value];
                        const currentOptions = newFields[index].options || [];
                        newFields[index] = { 
                          ...newFields[index], 
                          options: [...currentOptions, { value: '', label: '' }] 
                        };
                        handleChange(key, newFields);
                      }}
                      className="text-blue-600 text-xs hover:text-blue-800"
                    >
                      + Add Option
                    </button>
                  </div>
                  
                  {(field.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex gap-2 mb-1">
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                        value={option.value || ''}
                        onChange={(e) => {
                          const newFields = [...value];
                          const options = [...(newFields[index].options || [])];
                          options[optionIndex] = { ...options[optionIndex], value: e.target.value };
                          newFields[index] = { ...newFields[index], options };
                          handleChange(key, newFields);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Label"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                        value={option.label || ''}
                        onChange={(e) => {
                          const newFields = [...value];
                          const options = [...(newFields[index].options || [])];
                          options[optionIndex] = { ...options[optionIndex], label: e.target.value };
                          newFields[index] = { ...newFields[index], options };
                          handleChange(key, newFields);
                        }}
                      />
                      <button
                        onClick={() => {
                          const newFields = [...value];
                          const options = [...(newFields[index].options || [])];
                          options.splice(optionIndex, 1);
                          newFields[index] = { ...newFields[index], options };
                          handleChange(key, newFields);
                        }}
                        className="text-red-600 hover:text-red-800 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    // Handle validation rules for forms
    if (key === 'validationRules' && Array.isArray(value)) {
      return (
        <div key={key} className="border border-gray-200 p-3 rounded bg-gray-50 mt-3">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Validation Rules</label>
            <button 
              onClick={() => {
                const newRules = [...value, {
                  field: '',
                  rule: 'required',
                  message: 'This field is required'
                }];
                handleChange(key, newRules);
              }}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              + Add Rule
            </button>
          </div>
          
          {value.length === 0 && (
            <div className="text-sm text-gray-500 italic mb-2">No validation rules added yet</div>
          )}
          
          {value.map((rule, index) => (
            <div key={index} className="mb-2 p-2 border border-gray-200 rounded">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Rule {index + 1}</span>
                  <button
                    onClick={() => {
                      const newRules = [...value];
                      newRules.splice(index, 1);
                      handleChange(key, newRules);
                    }}
                    className="text-red-600 hover:text-red-800 px-1 text-xs"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                      value={rule.field || ''}
                      onChange={(e) => {
                        const newRules = [...value];
                        newRules[index] = { ...newRules[index], field: e.target.value };
                        handleChange(key, newRules);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rule Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                      value={rule.rule || 'required'}
                      onChange={(e) => {
                        const newRules = [...value];
                        newRules[index] = { ...newRules[index], rule: e.target.value };
                        handleChange(key, newRules);
                      }}
                    >
                      <option value="required">Required</option>
                      <option value="email">Email Format</option>
                      <option value="minLength">Minimum Length</option>
                      <option value="maxLength">Maximum Length</option>
                      <option value="pattern">Regex Pattern</option>
                      <option value="match">Match Another Field</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Error Message</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                      value={rule.message || ''}
                      onChange={(e) => {
                        const newRules = [...value];
                        newRules[index] = { ...newRules[index], message: e.target.value };
                        handleChange(key, newRules);
                      }}
                    />
                  </div>
                </div>
                
                {/* Additional parameters for specific rule types */}
                {rule.rule === 'minLength' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Length</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                      value={rule.value || 1}
                      onChange={(e) => {
                        const newRules = [...value];
                        newRules[index] = { ...newRules[index], value: parseInt(e.target.value) };
                        handleChange(key, newRules);
                      }}
                    />
                  </div>
                )}
                
                {rule.rule === 'maxLength' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Length</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                      value={rule.value || 100}
                      onChange={(e) => {
                        const newRules = [...value];
                        newRules[index] = { ...newRules[index], value: parseInt(e.target.value) };
                        handleChange(key, newRules);
                      }}
                    />
                  </div>
                )}
                
                {rule.rule === 'pattern' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Regex Pattern</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                      value={rule.value || ''}
                      onChange={(e) => {
                        const newRules = [...value];
                        newRules[index] = { ...newRules[index], value: e.target.value };
                        handleChange(key, newRules);
                      }}
                    />
                  </div>
                )}
                
                {rule.rule === 'match' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Field to Match</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                      value={rule.value || ''}
                      onChange={(e) => {
                        const newRules = [...value];
                        newRules[index] = { ...newRules[index], value: e.target.value };
                        handleChange(key, newRules);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Handle arrays (like items in a list)
    if (Array.isArray(value)) {
      return (
        <div key={key} className="border border-gray-200 p-3 rounded bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">{key}</label>
            <button 
              onClick={() => handleAddArrayItem(key)}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              + Add Item
            </button>
          </div>
          
          {value.map((item, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                value={item}
                onChange={(e) => handleArrayChange(key, index, e.target.value)}
              />
              <button
                onClick={() => handleRemoveArrayItem(key, index)}
                className="ml-2 text-red-600 hover:text-red-800 px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      );
    }
    
    // Special handling for different types of inputs based on the property key
    switch (key) {
      case 'textColor':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
            <input
              type="color"
              className="w-full border border-gray-300 rounded-md shadow-sm p-1 h-[38px]"
              value={value || '#000000'}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        );
        
      case 'fontSize':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={value || 'base'}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="xs">Extra Small</option>
              <option value="sm">Small</option>
              <option value="base">Base</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
              <option value="2xl">2XL</option>
            </select>
          </div>
        );
        
      case 'align':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={value || 'left'}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        );
        
      case 'variant':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={value || 'primary'}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="success">Success</option>
              <option value="danger">Danger</option>
            </select>
          </div>
        );
        
      case 'size':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={value || 'md'}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="xs">Extra Small</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
        );
        
      case 'style':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={value || 'disc'}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="disc">Disc</option>
              <option value="decimal">Decimal</option>
              <option value="square">Square</option>
              <option value="none">None</option>
            </select>
          </div>
        );
        
      case 'gap':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={value || '2'}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="0">None</option>
              <option value="1">Extra Small</option>
              <option value="2">Small</option>
              <option value="4">Medium</option>
              <option value="6">Large</option>
              <option value="8">Extra Large</option>
            </select>
          </div>
        );
      
      case 'type':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={value || 'text'}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="date">Date</option>
            </select>
          </div>
        );
      
      // Default case for simple text inputs
      default:
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={typeof value === 'object' ? JSON.stringify(value) : value}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Edit {component.component}</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Position selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position on Screen</label>
          <select
            className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={editedPosition}
            onChange={(e) => setEditedPosition(e.target.value)}
          >
            <option value="relative">Default (Normal Flow)</option>
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="middle-left">Middle Left</option>
            <option value="middle-center">Middle Center</option>
            <option value="middle-right">Middle Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>
      
        {/* Component properties */}
        {Object.entries(editedProps).map(([key, value]) => renderPropertyEditor(key, value))}
        
        {/* Special handling for column children */}
        {component.component === 'column' && editedChildren.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-md font-medium mb-3">Column Children</h4>
            {editedChildren.map((child, index) => (
              <div key={index} className="border border-gray-200 p-3 rounded mb-3">
                <div className="font-medium mb-2">Child {index + 1}: {child.component}</div>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 mb-2"
                  value={child.props.text || ''}
                  onChange={(e) => {
                    const newChildren = [...editedChildren];
                    newChildren[index] = {
                      ...newChildren[index],
                      props: { ...newChildren[index].props, text: e.target.value }
                    };
                    setEditedChildren(newChildren);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

// Helper function to convert position string to CSS styles
const getPositionStyles = (position) => {
  if (!position) return {};
  
  // Map of position names to CSS styles
  const positionMap = {
    'top-left': { position: 'absolute', top: '5px', left: '5px' },
    'top-center': { position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)' },
    'top-right': { position: 'absolute', top: '5px', right: '5px' },
    'middle-left': { position: 'absolute', top: '50%', left: '5px', transform: 'translateY(-50%)' },
    'middle-center': { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'middle-right': { position: 'absolute', top: '50%', right: '5px', transform: 'translateY(-50%)' },
    'bottom-left': { position: 'absolute', bottom: '5px', left: '5px' },
    'bottom-center': { position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { position: 'absolute', bottom: '5px', right: '5px' },
    'relative': {}, // Default - no special positioning
  };
  
  return positionMap[position] || {};
};

// Modified MobilePreview component that correctly handles server response format
const MobilePreview = ({ components, background }) => {
  // Helper function to render component preview based on type
  const renderComponentPreview = (comp, idx) => {
    if (!comp || !comp.component) return null;
    
    // Get position styles for any component type
    const positionStyles = comp.position ? getPositionStyles(comp.position) : {};
    
    // Extract custom styles from style property, which could be an object or string
    const customStyles = {};
    if (comp.props?.style) {
      if (typeof comp.props.style === 'object') {
        Object.assign(customStyles, comp.props.style);
      } else if (typeof comp.props.style === 'string') {
        try {
          Object.assign(customStyles, JSON.parse(comp.props.style));
        } catch (e) {
          // Invalid JSON string, ignore
        }
      }
    }
    
    // Combine position styles with custom styles
    const combinedStyles = { ...positionStyles, ...customStyles };
    
    switch (comp.component) {
      case 'text':
        // Handle text color from either direct textColor prop or style.color
        const textColorStyle = comp.props.textColor ? { color: comp.props.textColor } : {};
        
        // Extract fontSize and align either from direct props or from style object
        const fontSize = customStyles.fontSize || comp.props.fontSize || 'base';
        const textAlign = customStyles.textAlign || customStyles.align || comp.props.align || 'left';
        
        return (
          <div 
            key={idx} 
            className={`${typeof fontSize === 'number' ? '' : `text-${fontSize}`} ${typeof textAlign === 'string' && !textAlign.includes(':') ? `text-${textAlign}` : ''}`}
            style={{ 
              ...combinedStyles, 
              ...textColorStyle,
              ...(typeof fontSize === 'number' ? { fontSize: `${fontSize}px` } : {}),
              ...(typeof textAlign === 'string' && textAlign.includes(':') ? { textAlign } : {})
            }}
          >
            {comp.props.text || 'Text content'}
          </div>
        );
        
      case 'image':
        return (
          <div key={idx} style={combinedStyles}>
            <img 
              src={comp.props.imageUrl || comp.props.src || 'https://via.placeholder.com/150'} 
              alt={comp.props.alt || 'Image'} 
              className="max-h-32 object-contain"
            />
          </div>
        );
        
      case 'button':
        const buttonVariants = {
          primary: 'bg-blue-500 text-white',
          secondary: 'bg-gray-200 text-gray-800',
          success: 'bg-green-500 text-white',
          danger: 'bg-red-500 text-white',
        };
        
        const buttonSizes = {
          xs: 'px-2 py-1 text-xs',
          sm: 'px-3 py-1.5 text-sm',
          md: 'px-4 py-2 text-base',
          lg: 'px-5 py-2.5 text-lg',
          xl: 'px-6 py-3 text-xl',
        };
        
        // Default to primary if no variant found
        let buttonClass = buttonVariants.primary;
        if (comp.props.variant && buttonVariants[comp.props.variant]) {
          buttonClass = buttonVariants[comp.props.variant];
        }
        
        // Default to medium if no size found
        let sizeClass = buttonSizes.md;
        if (comp.props.size && buttonSizes[comp.props.size]) {
          sizeClass = buttonSizes[comp.props.size];
        }
        
        return (
          <button
            key={idx}
            className={`${buttonClass} ${sizeClass} rounded text-center w-full`}
            style={combinedStyles}
          >
            {comp.props.text || 'Button'}
          </button>
        );
        
      case 'input':
        return (
          <input
            key={idx}
            type={comp.props.type || 'text'}
            placeholder={comp.props.placeholder || 'Enter text...'}
            className="border border-gray-300 rounded w-full p-2 text-sm"
            style={combinedStyles}
            readOnly
          />
        );
        
      case 'list':
        return (
          <ul key={idx} className={`list-${comp.props.style || 'disc'} list-inside text-sm`} style={combinedStyles}>
            {(comp.props.items || ['Item 1', 'Item 2', 'Item 3']).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        
      case 'card':
        return (
          <div key={idx} className="border border-gray-200 rounded p-2 shadow-sm" style={combinedStyles}>
            <div className="font-bold text-sm">{comp.props.title || 'Card Title'}</div>
            <div className="text-xs">{comp.props.content || 'Card content goes here...'}</div>
          </div>
        );
        
      case 'column':
        // Handle either gap as direct prop or as style.gap
        const gap = customStyles.gap || comp.props.gap || '2';
        
        return (
          <div 
            key={idx} 
            className={typeof gap === 'number' ? 'flex' : `flex gap-${gap}`} 
            style={{ 
              ...combinedStyles,
              ...(typeof gap === 'number' ? { gap: `${gap}px` } : {})
            }}
          >
            {(comp.children || []).map((child, i) => renderComponentPreview(child, `${idx}-${i}`))}
          </div>
        );
        
      case 'form':
        return (
          <div key={idx} className="border border-gray-200 rounded-md p-2 mb-2" style={combinedStyles}>
            <div className="text-xs font-medium mb-2">{comp.props.name || 'Form'}</div>
            <div className="space-y-2">
              {(comp.props.fields || []).map((field, i) => (
                <div key={i} className="mb-1">
                  <label className="block text-xs font-medium">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea 
                      className="w-full border border-gray-300 rounded-md p-1 text-xs" 
                      placeholder={field.placeholder}
                      readOnly
                    ></textarea>
                  ) : field.type === 'select' ? (
                    <select className="w-full border border-gray-300 rounded-md p-1 text-xs">
                      {(field.options || []).map((opt, o) => (
                        <option key={o} value={opt.value}>{opt.label || opt.value}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-1">
                      {(field.options || []).map((opt, o) => (
                        <div key={o} className="flex items-center">
                          <input type="checkbox" className="mr-1" readOnly />
                          <span className="text-xs">{opt.label || opt.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-1">
                      {(field.options || []).map((opt, o) => (
                        <div key={o} className="flex items-center">
                          <input type="radio" name={field.name} className="mr-1" readOnly />
                          <span className="text-xs">{opt.label || opt.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <input 
                      type={field.type || 'text'} 
                      className="w-full border border-gray-300 rounded-md p-1 text-xs" 
                      placeholder={field.placeholder}
                      readOnly
                    />
                  )}
                </div>
              ))}
              <button className="bg-blue-500 text-white text-xs rounded px-2 py-1 w-full mt-2">
                {comp.props.submitButtonText || 'Submit'}
              </button>
            </div>
          </div>
        );
      case 'video':
        return (
          <div key={idx} style={combinedStyles} className="relative">
            <div className="relative pb-[56.25%] bg-black rounded overflow-hidden">
              {/* Video thumbnail as fallback */}
              <img 
                src={comp.props.thumbnail || 'https://via.placeholder.com/300x169'} 
                alt="Video thumbnail" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Video controls bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-2 py-1 flex items-center">
                {/* Play button */}
                <button className="text-white mr-2">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                
                {/* Progress bar */}
                <div className="flex-1 h-1 bg-gray-600 rounded-full mr-2">
                  <div className="w-1/3 h-1 bg-red-500 rounded-full"></div>
                </div>
                
                {/* Time */}
                <span className="text-white text-xs">0:12 / 2:30</span>
                
                {/* Volume */}
                <button className="text-white ml-2">
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </button>
                
                {/* Fullscreen */}
                <button className="text-white ml-2">
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
              
              {/* Big play button in middle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-3">
                  <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              
              {/* Video title if available */}
              {comp.props.title && (
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  {comp.props.title}
                </div>
              )}
            </div>
          </div>
        );
      case 'vertical':
        // Special case for layout types in server preview response
        return (
          <div key={idx} className="flex flex-col w-full" style={combinedStyles}>
            {(comp.children || []).map((child, i) => renderComponentPreview(child, `${idx}-${i}`))}
          </div>
        );
        
      case 'horizontal':
        // Special case for layout types in server preview response
        return (
          <div key={idx} className="flex flex-row w-full" style={combinedStyles}>
            {(comp.children || []).map((child, i) => renderComponentPreview(child, `${idx}-${i}`))}
          </div>
        );
        
      default:
        return (
          <div key={idx} className="text-xs text-gray-700 border border-gray-200 p-2 rounded" style={combinedStyles}>
            <div className="font-medium">{comp.component}</div>
            <pre className="text-xs mt-1 overflow-x-auto">
              {JSON.stringify(comp.props, null, 2).substring(0, 150)}
              {JSON.stringify(comp.props, null, 2).length > 150 ? '...' : ''}
            </pre>
          </div>
        );
    }
  };

  // Generate background style based on configuration
  const getBackgroundStyle = () => {
    if (!background) return { backgroundColor: '#FFFFFF' };
    
    // Handle background if it's directly a color string (common in API responses)
    if (typeof background === 'string') {
      return { backgroundColor: background };
    }
    
    switch (background.backgroundType) {
      case 'image':
        return { 
          backgroundImage: `url(${background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      case 'gradient':
        return { 
          background: `linear-gradient(to bottom, ${background.gradientStart || '#FFFFFF'}, ${background.gradientEnd || '#EFEFEF'})`
        };
      case 'color':
      default:
        return { backgroundColor: background.color || '#FFFFFF' };
    }
  };

  // Helper function to normalize server response data structure
  const normalizeComponents = () => {
    // If components is null or undefined, return empty array
    if (!components) return [];
    
    // If components is directly the server response object with layout property
    if (components.layout && components.layout.children) {
      return components.layout.children;
    }
    
    // If components is the layout object itself with children property
    if (components.children) {
      return components.children;
    }
    
    // If components is already an array, use it directly
    if (Array.isArray(components)) {
      return components;
    }
    
    // Default case: return empty array
    return [];
  };
  
  // Helper function to get the appropriate background
  const getBackgroundFromResponse = () => {
    // If the background is provided directly, use it
    if (background) {
      return background;
    }
    
    // If components is the server response with layout.background
    if (components && components.layout && components.layout.background) {
      return components.layout.background;
    }
    
    // If components has background property directly
    if (components && components.background) {
      return components.background;
    }
    
    // Default white background
    return { backgroundColor: '#FFFFFF' };
  };

  // Get the normalized components to render
  const componentsToRender = normalizeComponents();

  return (
    <div className="border-8 border-gray-800 rounded-3xl p-2 mx-auto" style={{ width: '240px', height: '480px', overflow: 'auto' }}>
      <div className="h-full w-full rounded-xl p-2 text-xs overflow-y-auto relative" style={getBackgroundStyle(getBackgroundFromResponse())}>
        {componentsToRender.length > 0 ? (
          componentsToRender.map((comp, index) => renderComponentPreview(comp, index))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Empty Layout
          </div>
        )}
      </div>
    </div>
  );
};
export default function SDUIAdmin() {
    const [screenId, setScreenId] = useState('');
    const [platform, setPlatform] = useState('ios');
    const [version, setVersion] = useState('1.0.0');
    const [components, setComponents] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [editingComponent, setEditingComponent] = useState(null);
    const [response, setResponse] = useState(null);
    const [serverPreview, setServerPreview] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Background configuration
    const [pageBackground, setPageBackground] = useState({
        color: '#FFFFFF',
        image: '',
        gradientStart: '',
        gradientEnd: '',
        backgroundType: 'color'
    });
    
    // Sensors for better drag and drop experience
    const sensors = useSensors(useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }));
  
    // Add a new component
    const addComponent = (componentType) => {
      const defaultProps = {};
      
      switch(componentType) {
        case 'text': 
          defaultProps.text = 'Text content';
          defaultProps.align = 'left';
          defaultProps.fontSize = 'base';
          defaultProps.textColor = '#000000';
          break;
        case 'image':
          defaultProps.imageUrl = '';
          defaultProps.alt = 'Image';
          break;
        case 'button':
          defaultProps.text = 'Button';
          defaultProps.variant = 'primary';
          defaultProps.size = 'md';
          defaultProps.action = { type: 'navigate', value: '' };
          break;
        case 'input':
          defaultProps.placeholder = 'Enter text...';
          defaultProps.type = 'text';
          break;
        case 'list':
          defaultProps.items = ['Item 1', 'Item 2', 'Item 3'];
          defaultProps.style = 'disc';
          break;
        case 'card':
          defaultProps.title = 'Card Title';
          defaultProps.content = 'Card content goes here...';
          break;
        case 'column':
          defaultProps.gap = '2';
          break;
        case 'form':
          defaultProps.name = 'form1';
          defaultProps.submitUrl = '';
          defaultProps.submitButtonText = 'Submit';
          defaultProps.fields = [];
          defaultProps.validationRules = [];
          break;
        // Add this to your addComponent function's switch-case
        case 'video':
          defaultProps.videoUrl = '';
          defaultProps.thumbnail = 'https://via.placeholder.com/300x169';
          defaultProps.title = 'Video Title';
          defaultProps.autoplay = false;
          defaultProps.controls = true;
          break;
      }
      
      const newComponent = { 
        component: componentType, 
        props: defaultProps, 
        position: 'relative',
        id: crypto.randomUUID() 
      };
      
      if (componentType === 'column') {
        newComponent.children = [
          { component: 'text', props: { text: 'Column A' } },
          { component: 'text', props: { text: 'Column B' } }
        ];
      }
      
      setComponents([...components, newComponent]);
    };
  
    // Handle drag end events
    const handleDragEnd = (event) => {
      const { active, over } = event;
      setActiveId(null);
      
      if (active.id !== over?.id && over) {
        const oldIndex = components.findIndex(item => item.id === active.id);
        const newIndex = components.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          setComponents(arrayMove(components, oldIndex, newIndex));
        }
      }
    };
  
    // Edit a component
    const handleEditComponent = (id) => {
      const component = components.find(c => c.id === id);
      if (component) {
        // Ensure position is initialized if it doesn't exist
        if (!component.position) {
          component.position = 'relative';
        }
        setEditingComponent(component);
      }
    };
  
    // Remove a component
    const handleRemoveComponent = (id) => {
      setComponents(components.filter(c => c.id !== id));
      if (editingComponent?.id === id) {
        setEditingComponent(null);
      }
    };
  
    // Duplicate a component
    const handleDuplicateComponent = (id) => {
      const component = components.find(c => c.id === id);
      if (component) {
        const newComponent = { 
          ...JSON.parse(JSON.stringify(component)), // Deep clone
          id: crypto.randomUUID() 
        };
        
        // Find the index of the original component and insert the duplicated one after it
        const index = components.findIndex(c => c.id === id);
        const newComponents = [...components];
        newComponents.splice(index + 1, 0, newComponent);
        
        setComponents(newComponents);
      }
    };
  
    // Update a component in the editor
    const handleUpdateComponent = (updatedComponent) => {
      setComponents(
        components.map(c => c.id === updatedComponent.id ? updatedComponent : c)
      );
      setEditingComponent(updatedComponent);
    };
  
    // Save the layout to the server
    const handleSave = async () => {
      try {
        setIsSaving(true);
        const layout = { 
          type: 'vertical', 
          children: components.map(({ id, ...rest }) => rest),
          background: pageBackground
        };
        
        const res = await api.post('/sdui', { 
          screenId, 
          platform, 
          version, 
          layout 
        });
        
        setResponse(res.data);
        setIsSaving(false);
      } catch (error) {
        setResponse({ error: error.message });
        setIsSaving(false);
      }
    };
  
    // Fetch a server-side preview
    const fetchServerPreview = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/sdui/${screenId}?platform=${platform}&version=${version}`);
        
        // Update the server preview data for JSON display
        setServerPreview(data);
        
        // Update the main preview components with server data
        if (data && data.layout && data.layout.children) {
          // Update the components state with server data (add IDs for editor compatibility)
          const serverComponents = data.layout.children.map(comp => ({
            ...comp,
            id: comp.id || crypto.randomUUID() // Ensure each component has an ID
          }));
          setComponents(serverComponents);
          
          // Update the background if available
          if (data.layout.background) {
            setPageBackground(data.layout.background);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        setServerPreview({ error: err.message });
        setIsLoading(false);
      }
    };
  
    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">SDUI Builder</h1>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Layout
                    </>
                  )}
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {previewMode ? 'Exit Preview' : 'Preview'}
                </button>
              </div>
            </div>
          </div>
        </header>
  
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Configuration header */}
          <div className="bg-white p-4 mb-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Screen ID</label>
                <input 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="home-screen" 
                  value={screenId} 
                  onChange={e => setScreenId(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={platform} 
                  onChange={e => setPlatform(e.target.value)}
                >
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="web">Web</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="1.0.0" 
                  value={version} 
                  onChange={e => setVersion(e.target.value)} 
                />
              </div>
            </div>
            
            {/* Background Settings */}
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Page Background</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Type</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={pageBackground.backgroundType} 
                    onChange={e => setPageBackground({...pageBackground, backgroundType: e.target.value})}
                  >
                    <option value="color">Solid Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                
                {/* Color picker for solid color */}
                {pageBackground.backgroundType === 'color' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                    <input 
                      type="color"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-1 h-[38px]" 
                      value={pageBackground.color} 
                      onChange={e => setPageBackground({...pageBackground, color: e.target.value})} 
                    />
                  </div>
                )}
                
                {/* Gradient color pickers */}
                {pageBackground.backgroundType === 'gradient' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gradient Start</label>
                      <input 
                        type="color"
                        className="w-full border border-gray-300 rounded-md shadow-sm p-1 h-[38px]" 
                        value={pageBackground.gradientStart} 
                        onChange={e => setPageBackground({...pageBackground, gradientStart: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gradient End</label>
                      <input 
                        type="color"
                        className="w-full border border-gray-300 rounded-md shadow-sm p-1 h-[38px]" 
                        value={pageBackground.gradientEnd} 
                        onChange={e => setPageBackground({...pageBackground, gradientEnd: e.target.value})} 
                      />
                    </div>
                  </>
                )}
                
                {/* Image URL for background image */}
                {pageBackground.backgroundType === 'image' && (
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input 
                      type="text"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2" 
                      value={pageBackground.image} 
                      onChange={e => setPageBackground({...pageBackground, image: e.target.value})} 
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {response && !response.error && (
              <div className="mt-4 rounded bg-green-50 p-3 border border-green-200">
                <div className="text-sm text-green-800">
                  <span className="font-medium">Success!</span> Layout saved successfully.
                </div>
              </div>
            )}
            {response && response.error && (
              <div className="mt-4 rounded bg-red-50 p-3 border border-red-200">
                <div className="text-sm text-red-800">
                  <span className="font-medium">Error!</span> {response.error}
                </div>
              </div>
            )}
          </div>
  
          {/* Main content area */}
          {previewMode ? (
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-gray-900 mb-6 self-start">Preview Mode</h2>
              <MobilePreview components={components.map(({ id, ...rest }) => rest)} background={pageBackground} />
              <div className="mt-8">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Return to Editor
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Component palette */}
              <div className="lg:col-span-3">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Components</h2>
                  <div className="space-y-1">
                    {COMPONENT_TYPES.map((type) => (
                      <ComponentPaletteItem 
                        key={type.id} 
                        type={type} 
                        onAdd={addComponent} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Builder area */}
              <div className="lg:col-span-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Builder</h2>
                  
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter} 
                    onDragStart={({ active }) => setActiveId(active.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      {components.length > 0 ? (
                        components.map((comp) => (
                          <SortableComponent 
                            key={comp.id} 
                            component={comp} 
                            onEdit={handleEditComponent}
                            onRemove={handleRemoveComponent}
                            onDuplicate={handleDuplicateComponent}
                          />
                        ))
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="mt-2 text-sm">No components added yet</p>
                            <p className="mt-1 text-sm">Select components from the palette to start building</p>
                          </div>
                        </div>
                      )}
                    </SortableContext>
                    
                    <DragOverlay>
                      {activeId ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-lg opacity-80">
                          {renderComponentPreview(components.find(c => c.id === activeId))}
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
                
                {/* Component Editor */}
                {editingComponent && (
                  <div className="mt-4">
                    <ComponentEditor 
                      component={editingComponent} 
                      onChange={handleUpdateComponent}
                      onClose={() => setEditingComponent(null)}
                    />
                  </div>
                )}
              </div>
              
              {/* Preview area */}
              <div className="lg:col-span-3">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
                  <MobilePreview components={components.map(({ id, ...rest }) => rest)} background={pageBackground} />
                  
                  <div className="mt-4 flex flex-col space-y-2">
                    <button
                      onClick={fetchServerPreview}
                      disabled={isLoading}
                      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Load Server Preview
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Full Screen Preview
                    </button>
                  </div>
                  
                  {serverPreview && !serverPreview.error && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">Server Preview</h3>
                        <div className="bg-white p-2 border border-blue-100 rounded max-h-40 overflow-y-auto">
                          <pre className="text-xs">{JSON.stringify(serverPreview, null, 2)}</pre>
                        </div>                    
                      </div>
                    )}
                  
                  {serverPreview && serverPreview.error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <p className="text-xs text-red-600 mt-1">{serverPreview.error}</p>
                        </div>
                      )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }