// store/useRulesStore.ts
import { create } from 'zustand';
import { fetchRules, fetchCapabilities, saveRules, validateDsl } from '../api/rules';

interface RulesStore {
  dslCode: string;
  actions: string[];
  validationErrors: string[];
  astPreview: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  setDslCode: (code: string) => void;
  fetchData: () => Promise<void>;
  validateCode: (code: string) => Promise<void>;
  saveCode: () => Promise<boolean>;
}

export const useRulesStore = create<RulesStore>((set, get) => ({
  dslCode: '',
  actions: [],
  validationErrors: [],
  astPreview: '',
  isLoading: false,
  isSaving: false,
  error: null,

  setDslCode: (code) => set({ dslCode: code }),

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [rules, capabilities] = await Promise.all([
        fetchRules(),         // Expected to return { dsl: string, requestId: string }
        fetchCapabilities(),  // Expected to return { actions: string[] }
      ]);

      // Add defensive check for rules.dsl
      if (!rules || typeof rules.data !== 'string') {
        console.error('Invalid rules data received:', rules);
        throw new Error('Invalid rules data received from server');
      }

      // Ensure we're setting a string (not undefined/null) into dslCode
      const dslContent = rules.data || '';
      
      set({
        dslCode: dslContent,
        actions: capabilities.actions || [],
        isLoading: false,
        error: null,
      });
      
      console.log("✅ Set DSL from fetchRules:", dslContent.substring(0, 50) + "...");
    } catch (err: any) {
      console.error('Error fetching DSL/capabilities:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load data',
        // Don't clear dslCode on error to preserve any existing content
      });
    }
  },

  validateCode: async (code) => {
    if (!code) {
      set({
        validationErrors: ['Empty DSL code'],
        astPreview: '',
        error: 'Empty DSL code',
      });
      return;
    }
    
    try {
      const result = await validateDsl(code);
      set({
        validationErrors: [],
        astPreview: JSON.stringify(result.ast, null, 2),
        error: null,
      });
    } catch (err: any) {
      set({
        validationErrors: err.response?.data?.errors || ['Unknown validation error'],
        astPreview: '',
        error: err.message || 'Validation failed',
      });
    }
  },

  saveCode: async () => {
    const { dslCode } = get();
    if (!dslCode) {
      set({ error: 'Cannot save empty DSL code' });
      return false;
    }
    
    set({ isSaving: true });
    try {
      await saveRules(dslCode);
      set({ isSaving: false, error: null });
      return true;
    } catch (err: any) {
      set({ isSaving: false, error: err.message || 'Save failed' });
      return false;
    }
  },
}));