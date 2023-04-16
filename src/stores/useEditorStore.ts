import _debounce from "lodash.debounce";
import { useEffect, useState } from "react";
import create from "zustand";
import { persist, StateStorage } from "zustand/middleware";

interface EditorStore {
  contentHtml: string;
  titleHtml: string;
  setTitleHtml: (title: string) => void;
  setContentHtml: (content: string) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const APIStorage: StateStorage = {
  getItem: async (name) => {
    const url = window.location.search
    const searchParams = new URLSearchParams(url)
    const token = searchParams.get('token')
    const id = searchParams.get('id')
    try {
      const response = await fetch(`${import.meta.env.VITE_API}/content-update/${id}/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`);
      }
      const data = await response.json();
      return JSON.stringify({state:data, version:0});
    } catch (error) {
      return null;
    }
  },
  setItem: _debounce(async (name: string, value: string) => {
    const parsed = JSON.parse(value);
    const url = window.location.search
    const searchParams = new URLSearchParams(url)
    const token = searchParams.get('token')
    const id = searchParams.get('id')

    const newValue = JSON.stringify({...parsed.state, id:id});
    try {
      const response = await fetch(`${import.meta.env.VITE_API}/content-update/${id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: newValue
      });
      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  }, 1500),
  removeItem: async (name) => {
    const url = window.location.search
    const searchParams = new URLSearchParams(url)
    const token = searchParams.get('token')
    const id = searchParams.get('id')
    try {
      const response = await fetch(`${import.meta.env.VITE_API}/content-update/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  },
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      titleHtml: "",
      contentHtml: "",
      setContentHtml: (contentHtml) => set({ contentHtml }),
      setTitleHtml: (titleHtml) => set({ titleHtml }),
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: 'editor',
      getStorage: () => APIStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (s) => ({
        titleHtml: s.titleHtml,
        contentHtml: s.contentHtml,
      }),
    },
  ),
);

export const useEditorHydration = () => {
  const [hydrated, setHydrated] = useState(useEditorStore.persist.hasHydrated);

  useEffect(() => {
    const unsubFinishHydration = useEditorStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );

    setHydrated(useEditorStore.persist.hasHydrated());

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
