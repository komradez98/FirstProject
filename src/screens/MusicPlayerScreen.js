import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
  TextInput,
  StatusBar,
} from 'react-native';
import Icon from '../components/Icon';
import { useAuth, useTheme } from '../store';
import { useAuthStore } from '../store/authStore'; // Add this import
import { themes } from '../config/theme';
import { api } from '../store/authStore';
import { useSongsStore } from '../store/songsStore';
import { useActiveListenerStore } from '../store/activeListenerStore'; // ← NEW

const { width, height } = Dimensions.get('window');

export default function MusicPlayerScreen({ navigation, route }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isRehydrated } = useAuthStore(); // Add rehydration check
  const currentTheme = themes[theme];
  const { booth, uniqueId } = route.params;

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [playlist, setPlaylist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Song search (songsStore)
  const [searchQuery, setSearchQuery] = useState('');
  const { songs: availableSongs, isLoading: isSongsLoading, error: songsError, searchSongs } = useSongsStore();
  const [showSongSearch, setShowSongSearch] = useState(false);

  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const updateInterval = useRef(null);

  // ActiveListener store actions/state
  const {
    play: playCmd,
    pause: pauseCmd,
    stop: stopCmd,
    next: nextCmd,
    prev: prevCmd,
    sendCommand,
    isBusy: isALBusy,
    error: alError,
    ping,
  } = useActiveListenerStore();

  useEffect(() => {
    // Wait for auth rehydration to complete before making API calls
    if (!isRehydrated) {
      console.log('[MusicPlayerScreen] Waiting for auth rehydration...');
      return;
    }

    console.log('[MusicPlayerScreen] Auth rehydrated, initializing player...');
    initializePlayer();
    return () => {
      if (updateInterval.current) clearInterval(updateInterval.current);
    };
  }, [isRehydrated]); // Add isRehydrated as dependency

  // Initialize player connection and fetch data
  const initializePlayer = async () => {
    try {
      setIsLoading(true);
      setConnectionError(null);

      // Allow UI to work even if backend checks are flaky
      setIsConnected(true);

      // Load playlist
      try {
        await fetchPlaylist();
      } catch (e) {
        console.log('Playlist fetch failed:', e?.message);
      }

      // Prime the songs list (via songsStore)
      try {
        await searchSongs('', 0, 100);
      } catch (e) {
        console.log('Song list fetch failed:', e?.message);
      }

      // Start periodic status updates from your /player API (kept)
      try {
        startStatusUpdates();
      } catch (e) {
        console.log('Status updates failed:', e?.message);
      }

      // Optional: keep ActiveListener alive (ping)
      try {
        await ping(uniqueId); // posts /activelistener/unique/:uniqueId/ping :contentReference[oaicite:6]{index=6}
      } catch (e) {
        // non-fatal
      }

    } catch (error) {
      console.error('❌ Failed to initialize player:', error);
      setConnectionError('Failed to connect to booth');

      // Still mark as connected so user can try to use the player
      setIsConnected(true);

      Alert.alert(
        'Connection Warning',
        'Some features may not work properly. You can still try to use the basic controls.',
        [
          { text: 'Continue', onPress: () => {} },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current playlist from booth
  const fetchPlaylist = async () => {
    try {
      const boothId = booth.order?.boothId || booth.boothId || booth.id;
      const { data } = await api.get(`/playlists/booth/${boothId}`);
      if (data?.data) {
        setPlaylist(data.data.songs || []);
        setCurrentSong(data.data.currentSong || null);
      } else {
        setPlaylist([]);
        setCurrentSong(null);
      }
    } catch (error) {
      setPlaylist([]);
      setCurrentSong(null);
      throw error;
    }
  };

  // Start periodic status updates (keeps your existing /player status)
  const startStatusUpdates = () => {
    updateInterval.current = setInterval(async () => {
      try {
        const boothId = booth.order?.boothId || booth.boothId || booth.id;
        const { data } = await api.get(`/player/booth/${boothId}/status`);
        if (data?.data) {
          const { isPlaying, currentSong, currentTime, totalTime, volume } = data.data;
          setIsPlaying(isPlaying || false);
          setCurrentSong(currentSong || null);
          setCurrentTime(currentTime || 0);
          setTotalTime(totalTime || 0);
          setVolume(volume || 70);
        }
      } catch (error) {
        // avoid spam
      }
    }, 5000);
  };

  // ----- Player Control Operations via ActiveListener -----
  // These call your ActiveListener backend:
  // POST /activelistener/unique/:uniqueId/send-command  with command: 'play'|'pause'|'stop'|'next'|'prev' :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8}

  const handlePlay = async () => {
    try {
      await playCmd(uniqueId);
      setIsPlaying(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to play');
    }
  };

  const handlePause = async () => {
    try {
      await pauseCmd(uniqueId);
      setIsPlaying(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to pause');
    }
  };

  const handleStop = async () => {
    try {
      await stopCmd(uniqueId);
      setIsPlaying(false);
      setCurrentTime(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop');
    }
  };

  const handleNext = async () => {
    try {
      // attempt to find next song in playlist and send its path
      const idx = playlist.findIndex((s) => s.id === currentSong?.id);
      const nextSong = playlist[idx + 1];
      const extras = nextSong ? { path: nextSong.path || nextSong.file || nextSong.raw?.path || nextSong.id } : {};
      await nextCmd(uniqueId, extras);
      await fetchPlaylist(); // refresh playlist/state
    } catch (error) {
      Alert.alert('Error', 'Failed to skip to next');
    }
  };

  const handlePrevious = async () => {
    try {
      const idx = playlist.findIndex((s) => s.id === currentSong?.id);
      const prevSong = playlist[idx - 1];
      const extras = prevSong ? { path: prevSong.path || prevSong.file || prevSong.raw?.path || prevSong.id } : {};
      await prevCmd(uniqueId, extras);
      await fetchPlaylist();
    } catch (error) {
      Alert.alert('Error', 'Failed to go to previous');
    }
  };

  // ----- Volume & playlist keep existing /player routes -----
  const handleVolumeChange = async (newVolume) => {
    try {
      await api.post(`/player/booth/${booth.order?.boothId || booth.boothId}/volume`, {
        volume: newVolume
      });
      setVolume(newVolume);
    } catch (error) {
      Alert.alert('Error', 'Failed to change volume');
    }
  };

  const handlePlaySong = async (song) => {
    try {
      // determine a path string that your backend/player expects
      const path = song.path || song.file || song.raw?.path || song.id;
      await playCmd(uniqueId, { path }); // <-- send path in body
      setCurrentSong(song);
      setIsPlaying(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to play selected song');
    }
  };

  const handleAddSongToPlaylist = async (song) => {
    try {
      await api.post(`/playlists/booth/${booth.order?.boothId || booth.boothId}/add-song`, {
        songId: song.id
      });
      await fetchPlaylist();
      Alert.alert('Success', `"${song.title}" added to playlist`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add song to playlist');
    }
  };

  const handleRemoveSongFromPlaylist = async (song) => {
    Alert.alert(
      'Remove Song',
      `Remove "${song.title}" from playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/playlists/booth/${booth.order?.boothId || booth.boothId}/songs/${song.id}`);
              await fetchPlaylist();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove song from playlist');
            }
          }
        }
      ]
    );
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keep songs list in sync with query via songsStore (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      try { searchSongs(searchQuery || '', 0, 100); } catch (e) {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filter local songs list (optional extra filter on top of server search)
  const filteredSongs = availableSongs.filter((song) => {
    const q = (searchQuery || '').toLowerCase();
    return song.title?.toLowerCase().includes(q) || song.artist?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>
          Connecting to booth...
        </Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.error }]}>
          {connectionError || 'Connection Lost'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: currentTheme.background, borderColor: currentTheme.primary }]}
          onPress={initializePlayer}
        >
          <Text style={[styles.retryButtonText, { color: currentTheme.primary }]}>
            Retry Connection
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Status bar configuration */}
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={currentTheme.background} />

      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: currentTheme.card }]}>
        <View className="sr-only" />
        <View style={styles.topBarContent}>
          <View style={styles.boothInfo}>
            <Text style={[styles.boothTitle, { color: currentTheme.text }]}>
              {booth.order?.booth?.boothType || 'Booth'} Player
            </Text>
            <Text style={[styles.orderInfo, { color: currentTheme.textSecondary }]}>Order #{booth.order?.id}</Text>
          </View>

          <TouchableOpacity
            style={[styles.iconGhostButton, { borderColor: currentTheme.error + '55' }]}
            onPress={() =>
              Alert.alert('Exit Karaoke Player', 'Are you sure you want to exit the karaoke player?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() },
              ])
            }
          >
            <Text style={[styles.exitButtonText, { color: currentTheme.error }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={[styles.statusBar, { backgroundColor: currentTheme.success }]}>
          <Text style={[styles.statusText, { color: currentTheme.buttonText }]}>
            🔗 Connected to {booth.order?.booth?.boothType || 'Booth'}
          </Text>
        </View>

        {/* Current Song Display */}
        <View style={[styles.currentSongCard, { backgroundColor: currentTheme.card }]}>
          {currentSong ? (
            <>
              <Text style={[styles.currentSongTitle, { color: currentTheme.text }]}>{currentSong.title}</Text>
              <Text style={[styles.currentSongArtist, { color: currentTheme.textSecondary }]}>{currentSong.artist}</Text>

              {/* Progress Bar */}
              <View style={[styles.progressContainer, { backgroundColor: currentTheme.inputBackground }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: currentTheme.primary,
                      width: totalTime > 0 ? `${(currentTime / totalTime) * 100}%` : '0%',
                    },
                  ]}
                />
              </View>

              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>{formatTime(currentTime)}</Text>
                <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>{formatTime(totalTime)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.noSongContainer}>
              <Text style={[styles.noSongText, { color: currentTheme.textSecondary }]}>No song selected</Text>
              <Text style={[styles.noSongSubtext, { color: currentTheme.textSecondary }]}>
                Choose a song from your playlist to start karaoke
              </Text>
            </View>
          )}
        </View>

        {/* Player Controls */}
        <View style={[styles.controlsCard, { backgroundColor: currentTheme.card }]}>
          <View style={styles.mainControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: currentTheme.inputBackground, opacity: isALBusy ? 0.6 : 1 }]}
              onPress={handlePrevious}
              disabled={isALBusy}
            >
              <Text style={[styles.controlIcon, { color: currentTheme.text }]}>⏮️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: currentTheme.primary, opacity: isALBusy ? 0.7 : 1 }]}
              onPress={isPlaying ? handlePause : handlePlay}
              disabled={isALBusy}
            >
              <Text style={[styles.playIcon, { color: currentTheme.buttonText }]}>{isPlaying ? '⏸️' : '▶️'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: currentTheme.inputBackground, opacity: isALBusy ? 0.6 : 1 }]}
              onPress={handleNext}
              disabled={isALBusy}
            >
              <Text style={[styles.controlIcon, { color: currentTheme.text }]}>⏭️</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: currentTheme.error, opacity: isALBusy ? 0.7 : 1 }]}
            onPress={handleStop}
            disabled={isALBusy}
          >
            <Text style={[styles.stopButtonText, { color: currentTheme.buttonText }]}>⏹️ Stop Karaoke</Text>
          </TouchableOpacity>

          {/* Volume Control */}
          <View style={styles.volumeContainer}>
            <Text style={[styles.volumeLabel, { color: currentTheme.text }]}>🔊 Volume: {volume}%</Text>
            <View style={styles.volumeControls}>
              <TouchableOpacity
                style={[styles.volumeButton, { backgroundColor: currentTheme.inputBackground }]}
                onPress={() => handleVolumeChange(Math.max(0, volume - 10))}
              >
                <Text style={[styles.volumeButtonText, { color: currentTheme.text }]}>-</Text>
              </TouchableOpacity>

              <View style={[styles.volumeDisplay, { backgroundColor: currentTheme.inputBackground }]}>
                <Text style={[styles.volumeText, { color: currentTheme.text }]}>{volume}%</Text>
              </View>

              <TouchableOpacity
                style={[styles.volumeButton, { backgroundColor: currentTheme.inputBackground }]}
                onPress={() => handleVolumeChange(Math.min(100, volume + 10))}
              >
                <Text style={[styles.volumeButtonText, { color: currentTheme.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Playlist Actions */}
        <View style={[styles.actionsCard, { backgroundColor: currentTheme.card }]}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: currentTheme.primary }]} onPress={() => setShowPlaylist(true)}>
            <Text style={[styles.actionButtonText, { color: currentTheme.buttonText }]}>📋 View Playlist ({playlist.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: currentTheme.secondary }]}
            onPress={() => setShowSongSearch(true)}
          >
            <Text style={[styles.actionButtonText, { color: currentTheme.buttonText }]}>➕ Add Songs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Playlist Modal */}
      <Modal visible={showPlaylist} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>📋 Current Playlist</Text>
            <TouchableOpacity onPress={() => setShowPlaylist(false)}>
              <Text style={[styles.modalClose, { color: currentTheme.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {playlist.length === 0 ? (
            <View style={styles.emptyPlaylistContainer}>
              <Text style={[styles.emptyPlaylistText, { color: currentTheme.textSecondary }]}>Your playlist is empty</Text>
              <TouchableOpacity
                style={[styles.addSongsButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                  setShowPlaylist(false);
                  setShowSongSearch(true);
                }}
              >
                <Text style={[styles.addSongsButtonText, { color: currentTheme.buttonText }]}>Add Songs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={playlist}
              keyExtractor={(item, index) => `playlist-${index}`}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.playlistItem,
                    {
                      backgroundColor: currentSong?.id === item.id ? currentTheme.primary + '20' : currentTheme.card,
                      borderColor: currentTheme.border,
                    },
                  ]}
                >
                  <View style={styles.playlistItemInfo}>
                    <Text style={[styles.playlistItemTitle, { color: currentTheme.text }]}>
                      {currentSong?.id === item.id && '🎵 '}
                      {item.title}
                    </Text>
                    <Text style={[styles.playlistItemArtist, { color: currentTheme.textSecondary }]}>{item.artist}</Text>
                  </View>
                  <View style={styles.playlistItemActions}>
                    <TouchableOpacity
                      style={[styles.playlistActionButton, { backgroundColor: currentTheme.primary }]}
                      onPress={() => handlePlaySong(item)}
                    >
                      <Text style={[styles.playlistActionText, { color: currentTheme.buttonText }]}>▶️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.playlistActionButton, { backgroundColor: currentTheme.error }]}
                      onPress={() => handleRemoveSongFromPlaylist(item)}
                    >
                      <Text style={[styles.playlistActionText, { color: currentTheme.buttonText }]}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Song Search Modal */}
      <Modal visible={showSongSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>🎵 Add Songs</Text>
            <TouchableOpacity onPress={() => setShowSongSearch(false)}>
              <Text style={[styles.modalClose, { color: currentTheme.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: currentTheme.card }]}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: currentTheme.inputBackground,
                  color: currentTheme.inputText,
                  borderColor: currentTheme.inputBorder,
                },
              ]}
              placeholder="Search songs or artists..."
              placeholderTextColor={currentTheme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Optional: show loading/error from songsStore */}
          {isSongsLoading && (
            <View style={{ padding: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={currentTheme.primary} />
            </View>
          )}
          {!!songsError && !isSongsLoading && (
            <Text style={{ color: currentTheme.error, textAlign: 'center', paddingVertical: 8 }}>
              {songsError}
            </Text>
          )}

          <FlatList
            data={filteredSongs}
            keyExtractor={(item) => `song-${item.id}`}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.songItem,
                  {
                    backgroundColor: currentTheme.card,
                    borderColor: currentTheme.border,
                  },
                ]}
              >
                <View style={styles.songItemInfo}>
                  <Text style={[styles.songItemTitle, { color: currentTheme.text }]}>{item.title}</Text>
                  <Text style={[styles.songItemArtist, { color: currentTheme.textSecondary }]}>{item.artist}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addSongButton, { backgroundColor: currentTheme.success }]}
                  onPress={() => handleAddSongToPlaylist(item)}
                >
                  <Text style={[styles.addSongButtonText, { color: currentTheme.buttonText }]}>➕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boothInfo: { flex: 1 },
  boothTitle: { fontSize: 20, fontWeight: 'bold' },
  orderInfo: { fontSize: 14, marginTop: 2 },
  iconGhostButton: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exitButtonText: { fontSize: 16, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 10 },
  errorText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  retryButton: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: { fontSize: 14, fontWeight: '700' },
  statusBar: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginBottom: 16 },
  statusText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  currentSongCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentSongTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  currentSongArtist: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  progressContainer: { height: 6, borderRadius: 3, marginBottom: 12 },
  progressBar: { height: '100%', borderRadius: 3 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 14, fontWeight: '500' },
  noSongContainer: { alignItems: 'center', paddingVertical: 20 },
  noSongText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  noSongSubtext: { fontSize: 14, textAlign: 'center' },
  controlsCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, gap: 16 },
  controlButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  controlIcon: { fontSize: 24 },
  playButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 32 },
  stopButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  stopButtonText: { fontSize: 16, fontWeight: '600' },
  volumeContainer: { alignItems: 'center' },
  volumeLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  volumeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  volumeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  volumeButtonText: { fontSize: 20, fontWeight: 'bold' },
  volumeDisplay: { minWidth: 60, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  volumeText: { fontSize: 16, fontWeight: '600' },
  actionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  actionButtonText: { fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalClose: { fontSize: 18, fontWeight: '600' },
  emptyPlaylistContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyPlaylistText: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  addSongsButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  addSongsButtonText: { fontSize: 16, fontWeight: '600' },
  playlistItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  playlistItemInfo: { flex: 1, paddingRight: 12 },
  playlistItemTitle: { fontSize: 16, fontWeight: '600' },
  playlistItemArtist: { fontSize: 14, marginTop: 2 },
  playlistItemActions: { flexDirection: 'row', gap: 8 },
  playlistActionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  playlistActionText: { fontSize: 14, fontWeight: '600' },
  searchContainer: { padding: 12, borderRadius: 12, margin: 12 },
  searchInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  songItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderRadius: 8, marginHorizontal: 12, marginBottom: 8 },
  songItemInfo: { flex: 1, paddingRight: 12 },
  songItemTitle: { fontSize: 16, fontWeight: '600' },
  songItemArtist: { fontSize: 14, marginTop: 2 },
  addSongButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addSongButtonText: { fontSize: 16, fontWeight: '600' },
});
