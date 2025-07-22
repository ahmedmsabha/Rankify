import { create } from 'zustand';

// ============================================================================
// 1. TYPE DEFINITIONS
// ============================================================================

// These are placeholder types. You should replace them with the actual types
// from the Puter.js SDK documentation if available.
type PuterUser = { uid: string; name: string; email: string; };
type FSItem = { name: string; type: 'file' | 'directory'; path: string; };
type AIResponse = { content: string; };
type KVItem = { key: string; value: string; };
type ChatMessage = { role: 'user' | 'assistant'; content: any; };
type PuterChatOptions = { model?: string; };


// This declaration merges the Puter SDK's structure with the global window object.
declare global {
  interface Window {
    puter: {
      auth: {
        getUser: () => Promise<PuterUser>;
        isSignedIn: () => Promise<boolean>;
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
      };
      fs: {
        write: (path: string, data: string | File | Blob) => Promise<File>;
        read: (path: string) => Promise<Blob>;
        upload: (file: File[] | Blob[]) => Promise<FSItem>;
        delete: (path: string) => Promise<void>;
        readdir: (path: string) => Promise<FSItem[]>;
      };
      ai: {
        chat: (prompt: string | ChatMessage[], options?: PuterChatOptions) => Promise<AIResponse>;
        img2txt: (image: string | File | Blob) => Promise<string>;
      };
      kv: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
        list: (pattern: string, returnValues?: boolean) => Promise<string[] | KVItem[]>;
        flush: () => Promise<boolean>;
      };
    };
  }
}

// Interface for each logical slice of the store
interface AuthSlice {
  auth: {
    user: PuterUser | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Loading state specific to auth actions
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    checkAuthStatus: () => Promise<boolean>;
    refreshUser: () => Promise<void>;
  };
}

interface FsSlice {
  fs: {
    write: (path: string, data: string | File | Blob) => Promise<File | undefined>;
    read: (path: string) => Promise<Blob | undefined>;
    upload: (files: File[] | Blob[]) => Promise<FSItem | undefined>;
    delete: (path: string) => Promise<void | undefined>;
    readDir: (path: string) => Promise<FSItem[] | undefined>;
  };
}

interface AiSlice {
  ai: {
    chat: (prompt: string | ChatMessage[], options?: PuterChatOptions) => Promise<AIResponse | undefined>;
    feedback: (path: string, message: string) => Promise<AIResponse | undefined>;
    img2txt: (image: string | File | Blob) => Promise<string | undefined>;
  };
}

interface KvSlice {
  kv: {
    get: (key: string) => Promise<string | null | undefined>;
    set: (key: string, value: string) => Promise<boolean | undefined>;
    delete: (key: string) => Promise<boolean | undefined>;
    list: (pattern: string, returnValues?: boolean) => Promise<string[] | KVItem[] | undefined>;
    flush: () => Promise<boolean | undefined>;
  };
}

// Global state and actions that don't belong to a specific slice
interface GlobalState {
  puterReady: boolean;
  globalError: string | null;
  init: () => void;
  clearError: () => void;
  // This is a helper function, not part of the state, but defined within the store
  // for access to `set` and `get`. We won't expose it in the final type.
}

// The complete store type is an intersection of all slices and global state.
type PuterStore = AuthSlice & FsSlice & AiSlice & KvSlice & GlobalState;


// ============================================================================
// 2. ZUSTAND STORE IMPLEMENTATION
// ============================================================================

const getPuter = (): Window['puter'] | null =>
  typeof window !== 'undefined' && window.puter ? window.puter : null;

export const usePuterStore = create<PuterStore>((set, get) => {
  /**
   * A centralized function to interact with the Puter SDK.
   * It handles SDK availability checks and global error handling.
   * @param operation The Puter SDK function to execute.
   * @returns The result of the operation, or undefined if an error occurs.
   */
  const callPuter = async <T>(operation: (puter: Window['puter']) => Promise<T>): Promise<T | undefined> => {
    const puter = getPuter();
    if (!puter) {
      set({ globalError: "Puter.js SDK is not available." });
      return undefined;
    }
    set({ globalError: null }); // Clear previous errors on a new call
    try {
      return await operation(puter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown Puter SDK error occurred.";
      set({ globalError: msg });
      return undefined;
    }
  };

  return {
    // --- GLOBAL STATE ---
    puterReady: false,
    globalError: null,

    // --- AUTH SLICE ---
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true until first check is done

      checkAuthStatus: async () => {
        set(state => ({ auth: { ...state.auth, isLoading: true } }));
        const isSignedIn = await callPuter(async (puter) => {
          const signedIn = await puter.auth.isSignedIn();
          if (signedIn) {
            const user = await puter.auth.getUser();
            set(state => ({ auth: { ...state.auth, user, isAuthenticated: true } }));
          } else {
            set(state => ({ auth: { ...state.auth, user: null, isAuthenticated: false } }));
          }
          return signedIn;
        });
        set(state => ({ auth: { ...state.auth, isLoading: false } }));
        return isSignedIn || false;
      },

      signIn: async () => {
        set(state => ({ auth: { ...state.auth, isLoading: true } }));
        await callPuter(async (puter) => {
          await puter.auth.signIn();
          await get().auth.checkAuthStatus(); // Re-check status after sign-in attempt
        });
        // isLoading is handled by checkAuthStatus
      },

      signOut: async () => {
        set(state => ({ auth: { ...state.auth, isLoading: true } }));
        await callPuter(p => p.auth.signOut());
        set({ auth: { ...get().auth, user: null, isAuthenticated: false, isLoading: false } });
      },

      refreshUser: async () => {
        set(state => ({ auth: { ...state.auth, isLoading: true } }));
        await callPuter(async (puter) => {
            const user = await puter.auth.getUser();
            set(state => ({ auth: { ...state.auth, user, isAuthenticated: true } }));
        });
        set(state => ({ auth: { ...state.auth, isLoading: false } }));
      },
    },

    // --- FS SLICE ---
    fs: {
      write: (path, data) => callPuter(p => p.fs.write(path, data)),
      read: (path) => callPuter(p => p.fs.read(path)),
      upload: (files) => callPuter(p => p.fs.upload(files)),
      delete: (path) => callPuter(p => p.fs.delete(path)),
      readDir: (path) => callPuter(p => p.fs.readdir(path)),
    },

    // --- AI SLICE ---
    ai: {
      chat: (prompt, options) => callPuter(p => p.ai.chat(prompt, options)),
      feedback: (path, message) => callPuter(p => p.ai.chat(
        [{ role: "user", content: [{ type: "file", puter_path: path }, { type: "text", text: message }] }],
        { model: "claude-sonnet-4" } // Example of specific model usage
      )),
      img2txt: (image) => callPuter(p => p.ai.img2txt(image)),
    },

    // --- KV SLICE ---
    kv: {
      get: (key) => callPuter(p => p.kv.get(key)),
      set: (key, value) => callPuter(p => p.kv.set(key, value)),
      delete: (key) => callPuter(p => p.kv.delete(key)),
      list: (pattern, returnValues) => callPuter(p => p.kv.list(pattern, returnValues)),
      flush: () => callPuter(p => p.kv.flush()),
    },

    // --- GLOBAL ACTIONS ---
    init: () => {
      if (getPuter()) {
        set({ puterReady: true });
        get().auth.checkAuthStatus();
        return;
      }
      const interval = setInterval(() => {
        if (getPuter()) {
          clearInterval(interval);
          set({ puterReady: true });
          get().auth.checkAuthStatus();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        if (!getPuter()) {
          set({ globalError: "Puter.js failed to load within 10 seconds", auth: { ...get().auth, isLoading: false } });
        }
      }, 10000);
    },

    clearError: () => set({ globalError: null }),
  };
});
