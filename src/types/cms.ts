import { ThemeName } from '../components/theme/ThemeProvider';

export type ViewType = 'table' | 'grid' | 'list' | 'video-gallery' | 'ml-analysis';

export interface FieldValidation {
  required?: boolean;
  maxLength?: number;
  fileTypes?: string[];
  maxSize?: string;
}

export interface FieldUI {
  template?: 'default' | 'wysiwyg' | 'image-uploader' | 'video-preview' | 'input' | 'rich-text-editor';
  placeholder?: string;
}

export interface FieldConfig {
  type: 'text' | 'number' | 'file' | 'string' | 'textarea' | 'checkbox' | 'enum' | 'date' | 'datetime' | 'time' | 'json' | 'array' | 'object' | 'relation';
  label: string;
  hidden?: boolean;
  readonly?: boolean;
  validation?: FieldValidation;
  ui?: FieldUI;
  values?: string[];
}

export interface ListView {
  list_type: ViewType;
  displayFields: string[];
  sortableFields: string[];
  filterableFields: string[];
}

export interface DetailView {
  form_type?: string;
  tabs?: Record<string, string[]>;
}

export interface TableConfig {
  title: string;
  route: string;
  dbTable?: string;
  mlmodel?: string[];
  fields: Record<string, FieldConfig>;
  listView: ListView;
  detailView: DetailView;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

export interface CMSConfig {
  cms: {
    name: string;
    tables: Record<string, TableConfig>;
  };
}

export interface CMSStore {
  config: CMSConfig | null;
  theme: ThemeName;
  initialized: boolean;
  setConfig: (config: CMSConfig) => void;
  setTheme: (theme: ThemeName) => void;
  setInitialized: (initialized: boolean) => void;
}
