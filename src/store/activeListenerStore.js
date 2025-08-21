// /store/activeListenerStore.js
import { create } from 'zustand';
import { api } from './authStore';

// The ActiveListener API supports commands: play, stop, next, prev, pause, add
// We'll use the "send-command" route for control operations.
// Endpoint reference: /activelistener/unique/:uniqueId/send-command  :contentReference[oaicite:0]{index=0}

export const useActiveListenerStore = create((set, get) => ({
  isBusy: false,
  lastCommand: null,
  error: null,
  currentVolume: 70, // Track current volume

  // Core sender
  sendCommand: async (uniqueId, command, extras = {}) => {
    if (!uniqueId) {
      set({ error: 'UniqueId missing' });
      return;
    }
    set({ isBusy: true, error: null });
    try {

      const body = { command, ...extras };
      await api.post(`/active-listeners/unique/${uniqueId}/send-command`, body);
      console.log(`Command sent: ${command} for uniqueId: ${uniqueId}`, body); // Debug log
      set({ lastCommand: { command, at: Date.now(), extras } });

      // Update currentVolume if volume was sent
      if (extras.volume !== undefined) {
        set({ currentVolume: extras.volume });
      }
    } catch (e) {
      set({ error: e?.response?.data?.message || e.message });
      throw e;
    } finally {
      set({ isBusy: false });
    }
  },

  // allow passing path or extras object: play(id, 'ZM.mp4') or play(id, { path, voc })
  play:   async (uniqueId, pathOrExtras) => get().sendCommand(uniqueId, 'play', typeof pathOrExtras === 'string' ? { path: pathOrExtras } : (pathOrExtras || {})),
  pause:  async (uniqueId, extras) => get().sendCommand(uniqueId, 'pause', extras || {}),
  stop:   async (uniqueId, extras) => get().sendCommand(uniqueId, 'stop', extras || {}),
  next:   async (uniqueId, pathOrExtras) => get().sendCommand(uniqueId, 'next', typeof pathOrExtras === 'string' ? { path: pathOrExtras } : (pathOrExtras || {})),
  prev:   async (uniqueId, pathOrExtras) => get().sendCommand(uniqueId, 'prev', typeof pathOrExtras === 'string' ? { path: pathOrExtras } : (pathOrExtras || {})),

  // Volume control methods
  setVolume: async (uniqueId, volume) => {
    if (!uniqueId) {
      set({ error: 'UniqueId missing' });
      return;
    }
    if (volume < 0 || volume > 100) {
      set({ error: 'Volume must be between 0 and 100' });
      return;
    }
    set({ isBusy: true, error: null });
    try {
      const body = { volume };
      await api.put(`/active-listeners/unique/${uniqueId}/command`, body);
      console.log(`Volume set to: ${volume} for uniqueId: ${uniqueId}`);
      set({ lastCommand: { command: 'volume', at: Date.now(), extras: { volume } }, currentVolume: volume });
    } catch (e) {
      set({ error: e?.response?.data?.message || e.message });
      throw e;
    } finally {
      set({ isBusy: false });
    }
  },

  // Helper to get current volume
  getCurrentVolume: () => get().currentVolume,

  // Optional helpers (you can use if needed later)
  clear:  async (uniqueId) => api.delete(`/active-listeners/unique/${uniqueId}/command`),   // :contentReference[oaicite:3]{index=3}
  ping:   async (uniqueId) => {
    const response = await api.post(`/active-listeners/unique/${uniqueId}/ping`);

    // Update volume from ping response if available
    if (response.data?.listener?.volume !== undefined) {
      set({ currentVolume: response.data.listener.volume });
    }

    return response;
  },
  status: async (uniqueId) => {
    const response = await api.get(`/active-listeners/unique/${uniqueId}/status`);

    // Update volume from status response if available
    if (response.data?.data?.volume !== undefined) {
      set({ currentVolume: response.data.data.volume });
    }

    return response;
  },
}));
