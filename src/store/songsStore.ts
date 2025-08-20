// src/store/songsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from './authStore';

export type SongItem = {
  id: string | number;
  title: string;
  artist?: string;
  durationSec?: number;
  coverUrl?: string;
  // keep the raw in case you need extra fields later
  raw?: any;
};

type SortDir = 'ASC' | 'DESC';

type SongsState = {
  // data
  songs: SongItem[];
  total: number;
  page: number;
  size: number;
  query: string;
  sortBy: string;
  sortDir: SortDir;

  // status
  isLoading: boolean;
  error: string | null;

  // actions
  setQuery: (q: string) => void;
  setPage: (p: number) => void;
  setSize: (s: number) => void;
  searchSongs: (q?: string, page?: number, size?: number, sortBy?: string, sortDir?: SortDir) => Promise<void>;
  clear: () => void;
};

// Helper to normalize any backend shape into our SongItem[]
function normalizeSongs(payload: any): { items: SongItem[]; total: number } {
  // Accept a few shapes: {items, total} | {data:{items,total}} | array
  const data = payload?.data ?? payload;
  const itemsRaw = Array.isArray(data?.items) ? data.items
                  : Array.isArray(data) ? data
                  : Array.isArray(payload) ? payload
                  : [];

  const items: SongItem[] = itemsRaw.map((x: any, idx: number) => ({
    id: x.id ?? x.songId ?? idx,
    title: x.title ?? x.name ?? x.judul ?? 'Unknown Title',
    artist: x.artist ?? x.singer ?? x.penyanyi ?? '',
    durationSec: x.durationSec ?? x.duration ?? undefined,
    coverUrl: x.coverUrl ?? x.thumbnail ?? x.image ?? undefined,
    raw: x,
  }));

  const total = typeof data?.total === 'number'
    ? data.total
    : typeof payload?.total === 'number'
    ? payload.total
    : items.length;

  return { items, total };
}

export const useSongsStore = create<SongsState>()(
  devtools((set, get) => ({
    songs: [],
    total: 0,
    page: 0,
    size: 10,
    query: '',
    sortBy: 'new',
    sortDir: 'DESC',

    isLoading: false,
    error: null,

    setQuery: (q) => set({ query: q }),
    setPage: (p) => set({ page: p }),
    setSize: (s) => set({ size: s }),

    clear: () => set({ songs: [], total: 0, page: 0, query: '', error: null }),

    /**
     * Calls: {{LOCALSACENG}}/?s=<query>&page=<page>&size=<size>&sortBy=<sortBy>&sortDir=<sortDir>
     * Uses your existing axios `api` instance so headers/tokens remain consistent.
     */
    searchSongs: async (
      q = get().query || '',
      page = get().page,
      size = get().size,
      sortBy = get().sortBy,
      sortDir = get().sortDir
    ) => {
      try {
        set({ isLoading: true, error: null });
        const { data } = await api.get(`/`, {
          params: { s: q, page, size, sortBy, sortDir },
        });

        const { items, total } = normalizeSongs(data);
        set({ songs: items, total, page, size, query: q });
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Song search failed';
        set({ error: message, songs: [], total: 0 });
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);
