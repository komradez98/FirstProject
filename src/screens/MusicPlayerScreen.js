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
  Animated,
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
  const [volume, setVolume] = useState(70); // Initialize with default
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // ActiveListener Duration State
  const [alDuration, setAlDuration] = useState(0); // Duration from ActiveListener (static total)
  const [alCurrentTime, setAlCurrentTime] = useState(0); // Current playback time (manual countdown)
  const [songStartTime, setSongStartTime] = useState(null); // When current song started
  const [isTimerActive, setIsTimerActive] = useState(false); // Whether timer is running
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const progressTimer = useRef(null);

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
    setVolume: setVolumeCmd,
    getCurrentVolume,
    currentVolume,
    isBusy: isALBusy,
    error: alError,
    ping,
    status: getALStatus,
  } = useActiveListenerStore();

  // Sync local volume state with store's currentVolume
  useEffect(() => {
    if (currentVolume !== undefined && currentVolume !== volume) {
      setVolume(currentVolume);
    }
  }, [currentVolume]);

  // Animate progress bar based on current time and duration
  const animateProgress = (currentTime, duration) => {
    if (duration > 0) {
      const progress = currentTime / duration;
      Animated.timing(progressAnimation, {
        toValue: Math.min(progress, 1), // Cap at 1 (100%)
        duration: 500, // Smooth animation over 500ms
        useNativeDriver: false,
      }).start();
    } else {
      progressAnimation.setValue(0);
    }
  };

  // Start manual progress timer
  const startProgressTimer = (duration) => {
    console.log('[Timer] Starting with duration:', duration);

    // Clear any existing timer
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }

    const startTime = Date.now();
    setSongStartTime(startTime);
    setAlCurrentTime(0);
    setIsTimerActive(true);

    // Update progress every 100ms for smooth animation
    progressTimer.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // Convert to seconds

      if (elapsed >= duration) {
        // Song completed
        setAlCurrentTime(duration);
        setIsTimerActive(false);
        animateProgress(duration, duration);
        clearInterval(progressTimer.current);
        console.log('[Timer] Song completed');
      } else {
        // Update current time and animate
        setAlCurrentTime(elapsed);
        animateProgress(elapsed, duration);
      }
    }, 100); // Update every 100ms
  };

  // Stop manual progress timer
  const stopProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    setIsTimerActive(false);
    setAlCurrentTime(0);
    setSongStartTime(null);
    progressAnimation.setValue(0);
  };

  // Pause manual progress timer
  const pauseProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    setIsTimerActive(false);
  };

  // Resume manual progress timer
  const resumeProgressTimer = (remainingTime, totalDuration) => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }

    const resumeStartTime = Date.now();
    const initialElapsed = totalDuration - remainingTime;
    setIsTimerActive(true);

    progressTimer.current = setInterval(() => {
      const additionalElapsed = (Date.now() - resumeStartTime) / 1000;
      const totalElapsed = initialElapsed + additionalElapsed;

      if (totalElapsed >= totalDuration) {
        setAlCurrentTime(totalDuration);
        setIsTimerActive(false);
        animateProgress(totalDuration, totalDuration);
        clearInterval(progressTimer.current);
      } else {
        setAlCurrentTime(totalElapsed);
        animateProgress(totalElapsed, totalDuration);
      }
    }, 100);
  };

  // Fetch ActiveListener duration (static value)
  const fetchActiveListenerDuration = async () => {
    try {
      const statusResponse = await getALStatus(uniqueId);
      const data = statusResponse.data?.data;

      console.log('[Duration] ActiveListener data:', {
        duration: data?.duration,
        path: data?.path,
        command: data?.command,
        currentSongPath: currentSong?.path
      });

      if (data && data.duration !== undefined && data.duration > 0) {
        console.log('[Duration] ActiveListener returned:', data.duration, 'seconds (', Math.floor(data.duration/60), ':', (data.duration%60).toString().padStart(2, '0'), ')');
        setAlDuration(data.duration);
        return data.duration;
      } else {
        console.log('[Duration] No valid duration from ActiveListener:', data);
      }
    } catch (error) {
      console.log('[Duration] Error fetching from ActiveListener:', error?.message);
    }
    return null;
  };

  // Enhanced periodic progress updates
  useEffect(() => {
    return () => {
      // Cleanup progress timer on unmount
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, []);

  // Fetch duration when song changes
  useEffect(() => {
    if (currentSong && uniqueId && isRehydrated) {
      fetchActiveListenerDuration();
    }
  }, [currentSong, uniqueId, isRehydrated]);  // Initialize volume and song info from ActiveListener on mount
  useEffect(() => {
    if (uniqueId && isRehydrated) {
      const initializeActiveListener = async () => {
        try {
          const statusResponse = await getALStatus(uniqueId);
          const data = statusResponse.data?.data;

          if (data?.volume !== undefined) {
            setVolume(data.volume);
          }
        } catch (error) {
          // Silent fail - not critical for initialization
        }
      };

      initializeActiveListener();
    }
  }, [uniqueId, isRehydrated, getALStatus]);

  useEffect(() => {
    // Wait for auth rehydration to complete before making API calls
    if (!isRehydrated) {
      return;
    }

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

      // Optional: ping ActiveListener and get current status/volume
      try {
        const pingResponse = await ping(uniqueId);
        console.log('[initializePlayer] Ping response:', pingResponse.data);

        // Update volume if available in ping response
        if (pingResponse.data?.listener?.volume !== undefined) {
          setVolume(pingResponse.data.listener.volume);
        }
      } catch (e) {
        console.log('ActiveListener ping failed:', e?.message);
        // Try to get status instead
        try {
          const statusResponse = await api.get(`/active-listeners/unique/${uniqueId}/status`);
          if (statusResponse.data?.data?.volume !== undefined) {
            setVolume(statusResponse.data.data.volume);
          }
        } catch (statusError) {
          console.log('ActiveListener status failed:', statusError?.message);
        }
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
        // Map playlist songs with proper artist info from Song table
        const playlistSongs = (data.data.songs || []).map(song => ({
          ...song,
          // Ensure artist field is properly mapped from the Song relation
          artist: song.Song?.artist || song.artist || 'Unknown Artist',
          title: song.Song?.title || song.title || song.judul || 'Unknown Title',
          path: song.Song?.path || song.path || null
        }));

        setPlaylist(playlistSongs);
        setCurrentSongIndex(data.data.currentSongIndex || 0);

        // Set current song based on index
        const currentSong = playlistSongs[data.data.currentSongIndex] || null;
        if (currentSong) {
          setCurrentSong(currentSong);
        }
      } else {
        setPlaylist([]);
        setCurrentSong(null);
        setCurrentSongIndex(0);
      }
    } catch (error) {
      setPlaylist([]);
      setCurrentSong(null);
      setCurrentSongIndex(0);
      throw error;
    }
  };


  // Start periodic status updates (keeps your existing /player status)
  const startStatusUpdates = () => {
    updateInterval.current = setInterval(async () => {
      // Skip all external updates when manual timer is active to avoid interference
      if (isTimerActive) {
        console.log('[statusUpdate] Skipping external updates - manual timer active');
        return;
      }

      try {
        // Get regular player status
        const boothId = booth.order?.boothId || booth.boothId || booth.id;
        const { data } = await api.get(`/player/booth/${boothId}/status`);
        if (data?.data) {
          const { isPlaying: serverIsPlaying, currentSong, currentTime, totalTime } = data.data;

          setIsPlaying(serverIsPlaying || false);

          // Map current song with proper artist info if available
          if (currentSong) {
            const mappedCurrentSong = {
              ...currentSong,
              artist: currentSong.Song?.artist || currentSong.artist || 'Unknown Artist',
              title: currentSong.Song?.title || currentSong.title || currentSong.judul || 'Unknown Title',
              path: currentSong.Song?.path || currentSong.path || null
            };
            // setCurrentSong(mappedCurrentSong);
          } else {
            setCurrentSong(null);
          }

          setCurrentTime(currentTime || 0);
          setTotalTime(totalTime || 0);
        }

        // Ping ActiveListener for volume only when timer is inactive
        try {
          const pingResponse = await ping(uniqueId);
          if (pingResponse.data?.listener?.volume !== undefined) {
            setVolume(pingResponse.data.listener.volume);
          }
        } catch (pingError) {
          // Silent fail for volume updates - not critical
          console.log('[statusUpdate] ActiveListener ping failed:', pingError?.message);
        }

      } catch (error) {
        // avoid spam
        console.log('[statusUpdate] Player status failed:', error?.message);
      }
    }, 5000);
  };

  // ----- Player Control Operations via ActiveListener -----
  // These call your ActiveListener backend:
  // POST /activelistener/unique/:uniqueId/send-command  with command: 'play'|'pause'|'stop'|'next'|'prev' :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8}

  const handlePlay = async () => {
    try {
      const songTitle = currentSong?.title || currentSong?.name || null;

      await playCmd(uniqueId, {
        path: currentSong?.path,
        volume,
        songTitle
      });

      setIsPlaying(true);

      // Start progress timer if we have duration
      if (alDuration > 0) {
        if (alCurrentTime > 0) {
          // Resume from paused position
          const remainingTime = alDuration - alCurrentTime;
          resumeProgressTimer(remainingTime, alDuration);
        } else {
          // Start from beginning
          startProgressTimer(alDuration);
        }
      } else {
        // Try to fetch duration and start timer
        const duration = await fetchActiveListenerDuration();
        if (duration > 0) {
          startProgressTimer(duration);
        }
      }
    } catch (error) {
      console.error('[Play] Error:', error);
      Alert.alert('Error', 'Failed to play');
    }
  };

  const handlePause = async () => {
    try {
      await pauseCmd(uniqueId, { volume });
      setIsPlaying(false);

      // Pause the progress timer
      pauseProgressTimer();
    } catch (error) {
      Alert.alert('Error', 'Failed to pause');
    }
  };

  const handleStop = async () => {
    try {
      await stopCmd(uniqueId, { volume });
      setIsPlaying(false);
      setCurrentTime(0);

      // Stop the progress timer completely
      stopProgressTimer();
    } catch (error) {
      Alert.alert('Error', 'Failed to stop');
    }
  };

  // Comprehensive Next Song Function
  const handleNext = async () => {
    try {
      if (playlist.length === 0) {
        Alert.alert('No Songs', 'No songs in playlist');
        return;
      }

      const boothId = booth.order?.boothId || booth.boothId || booth.id;

      // Update playlist position via API
      const { data } = await api.put(`/playlists/booth/${boothId}/current-song`, {
        direction: 'next'
      });

      if (data?.data) {
        const { currentSongIndex: newIndex, currentSong, nextSong } = data.data;

        // Update local state
        setCurrentSongIndex(newIndex);
        if (currentSong) {
          const mappedSong = {
            ...currentSong,
            artist: currentSong.artist || 'Unknown Artist',
            title: currentSong.title || 'Unknown Title',
            path: currentSong.path || null,
            duration: currentSong.duration || null
          };
          setCurrentSong(mappedSong);

          // Reset progress timer first
          stopProgressTimer();

          // Send next command to ActiveListener with song details
          await nextCmd(uniqueId, {
            path: mappedSong.path,
            volume,
            duration: mappedSong.duration || nextSong?.duration // Use new song's duration from API
          });

          // Wait longer for ActiveListener to process the new song, then start timer
          setTimeout(async () => {
            // First, try to use the song's own duration data
            let duration = mappedSong.duration || currentSong.duration;

            if (!duration) {
              // Try multiple times to get the correct duration from ActiveListener
              let attempts = 0;
              const maxAttempts = 3; // Reduced attempts since we have song data

              while (!duration && attempts < maxAttempts) {
                duration = await fetchActiveListenerDuration();
                if (!duration) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                  attempts++;
                }
              }
            }

            if (duration > 0) {
              console.log('[Next] Using duration:', duration, 'for song:', mappedSong.title);
              setAlDuration(duration);
              if (isPlaying) {
                startProgressTimer(duration);
              }
            } else {
              console.log('[Next] No valid duration found for song:', mappedSong.title);
            }

            // Auto-play the next song
            if (isPlaying) {
              await playCmd(uniqueId, {
                path: mappedSong.path,
                volume
              });
            }
          }, 300); // Reduced delay since we're primarily using song data

          console.log('[Next] Moved to:', mappedSong.title);
        }
      }

      // Refresh playlist to ensure sync
      setTimeout(() => fetchPlaylist(), 500);
    } catch (error) {
      console.error('[Next] Error:', error);
      Alert.alert('Error', 'Failed to skip to next song');
    }
  };

  // Comprehensive Previous Song Function
  const handlePrevious = async () => {
    try {
      if (playlist.length === 0) {
        Alert.alert('No Songs', 'No songs in playlist');
        return;
      }

      const boothId = booth.order?.boothId || booth.boothId || booth.id;

      // Update playlist position via API
      const { data } = await api.put(`/playlists/booth/${boothId}/current-song`, {
        direction: 'prev'
      });

      if (data?.data) {
        const { currentSongIndex: newIndex, currentSong, nextSong } = data.data;

        // Update local state
        setCurrentSongIndex(newIndex);
        if (currentSong) {
          const mappedSong = {
            ...currentSong,
            artist: currentSong.artist || 'Unknown Artist',
            title: currentSong.title || 'Unknown Title',
            path: currentSong.path || null,
            duration: currentSong.duration || null
          };
          setCurrentSong(mappedSong);

          // Send prev command to ActiveListener with song details
          await prevCmd(uniqueId, {
            path: mappedSong.path,
            volume,
            duration: mappedSong.duration // Send the new song's duration
          });

          // Reset progress timer for new song
          stopProgressTimer();

          // Wait for ActiveListener to process the new song, then get duration
          setTimeout(async () => {
            // First, try to use the song's own duration data
            let duration = mappedSong.duration || currentSong.duration;

            if (!duration) {
              // Try multiple times to get the correct duration from ActiveListener
              let attempts = 0;
              const maxAttempts = 3; // Reduced attempts since we have song data

              while (!duration && attempts < maxAttempts) {
                duration = await fetchActiveListenerDuration();
                if (!duration) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                  attempts++;
                }
              }
            }

            if (duration > 0) {
              console.log('[Previous] Using duration:', duration, 'for song:', mappedSong.title);
              setAlDuration(duration);
              if (isPlaying) {
                startProgressTimer(duration);
              }
            } else {
              console.log('[Previous] No valid duration found for song:', mappedSong.title);
            }

            // Auto-play the previous song
            if (isPlaying) {
              await playCmd(uniqueId, {
                path: mappedSong.path,
                volume
              });
            }
          }, 300); // Reduced delay since we're primarily using song data

          console.log('[Previous] Moved to:', mappedSong.title);
        }
      }

      // Refresh playlist to ensure sync
      setTimeout(() => fetchPlaylist(), 500);
    } catch (error) {
      console.error('[Previous] Error:', error);
      Alert.alert('Error', 'Failed to go to previous song');
    }
  };

  // Play specific song by index
  const handlePlaySongByIndex = async (index) => {
    try {
      if (index < 0 || index >= playlist.length) {
        Alert.alert('Error', 'Invalid song index');
        return;
      }

      const boothId = booth.order?.boothId || booth.boothId || booth.id;

      // Update playlist position via API
      const { data } = await api.put(`/playlists/booth/${boothId}/current-song`, {
        direction: 'set',
        songIndex: index
      });

      if (data?.data) {
        const { currentSongIndex: newIndex, currentSong } = data.data;

        // Update local state
        setCurrentSongIndex(newIndex);
        if (currentSong) {
          const mappedSong = {
            ...currentSong,
            artist: currentSong.artist || 'Unknown Artist',
            title: currentSong.title || 'Unknown Title',
            path: currentSong.path || null
          };
          setCurrentSong(mappedSong);

          // Play the selected song
          await playCmd(uniqueId, {
            path: mappedSong.path,
            volume
          });

          setIsPlaying(true);

          // Reset progress timer and start for new song
          stopProgressTimer();
          const duration = await fetchActiveListenerDuration();
          if (duration > 0) {
            console.log('[PlayByIndex] Starting timer for selected song with duration:', duration);
            startProgressTimer(duration);
          }

          console.log('[PlayByIndex] Playing song at index:', {
            index: newIndex,
            title: mappedSong.title,
            duration: duration
          });
        }
      }
    } catch (error) {
      console.error('[PlayByIndex] Error:', error);
      Alert.alert('Error', 'Failed to play selected song');
    }
  };

  // ----- Volume & playlist keep existing /player routes -----
  const handleVolumeChange = async (newVolume) => {
    try {
      // Use ActiveListener volume command instead of old player API
      await setVolumeCmd(uniqueId, newVolume);
      // Volume will be updated via the store's currentVolume sync
      // But also update local state immediately for better UX
      setVolume(newVolume);
    } catch (error) {
      console.error('Volume change failed:', error);
      Alert.alert('Error', 'Failed to change volume');
    }
  };

  const handlePlaySong = async (song) => {
    try {
      const path = song.path || song.file || song.raw?.path || song.id;
      const songTitle = song.title || song.name || 'Unknown Song';

      await playCmd(uniqueId, {
        path,
        volume,
        songTitle
      });

      setCurrentSong(song);
      setIsPlaying(true);

      console.log('[PlaySong] Playing:', { songTitle });
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
    // console.log('BABIIIIIIII', {song});
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
              <Text style={[styles.currentSongTitle, { color: currentTheme.text }]}>
                {currentSong.title || currentSong.Song?.title || 'Unknown Title'}
              </Text>
              <Text style={[styles.currentSongArtist, { color: currentTheme.textSecondary }]}>
                {currentSong.Song?.artist || currentSong.artist || 'Unknown Artist'}
              </Text>

              {/* Progress Bar */}
              <View style={[styles.progressContainer, { backgroundColor: currentTheme.inputBackground }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: currentTheme.primary,
                      width: alDuration > 0 ? `${(alCurrentTime / alDuration) * 100}%` : '0%',
                    },
                  ]}
                />
              </View>

              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>{formatTime(alCurrentTime)}</Text>
                <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>{formatTime(alDuration)}</Text>
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
          {/* Navigation Controls */}
          <View style={styles.navigationControls}>
            <TouchableOpacity
              style={[styles.navButton, {
                backgroundColor: currentTheme.inputBackground,
                opacity: (playlist.length === 0 || isALBusy) ? 0.3 : 1
              }]}
              onPress={handlePrevious}
              disabled={playlist.length === 0 || isALBusy}
            >
              <Text style={[styles.navButtonText, { color: currentTheme.text }]}>⏮️</Text>
            </TouchableOpacity>

            <View style={styles.playlistInfo}>
              <Text style={[styles.positionText, { color: currentTheme.textSecondary }]}>
                {playlist.length > 0 ? `${(currentSongIndex || 0) + 1} / ${playlist.length}` : '0 / 0'}
              </Text>

              {playlist.length > 0 && playlist[currentSongIndex + 1] && (
                <Text style={[styles.nextSongText, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                  Next: {playlist[currentSongIndex + 1]?.title || 'Unknown'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.navButton, {
                backgroundColor: currentTheme.inputBackground,
                opacity: (playlist.length === 0 || isALBusy) ? 0.3 : 1
              }]}
              onPress={handleNext}
              disabled={playlist.length === 0 || isALBusy}
            >
              <Text style={[styles.navButtonText, { color: currentTheme.text }]}>⏭️</Text>
            </TouchableOpacity>
          </View>

          {/* Main Play/Pause Control */}
          <View style={styles.mainControls}>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: currentTheme.primary, opacity: isALBusy ? 0.7 : 1 }]}
              onPress={isPlaying ? handlePause : handlePlay}
              disabled={isALBusy}
            >
              <Text style={[styles.playIcon, { color: currentTheme.buttonText }]}>{isPlaying ? '⏸️' : '▶️'}</Text>
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
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.playlistItem,
                    {
                      backgroundColor: index === currentSongIndex ? currentTheme.primary + '20' : currentTheme.card,
                      borderColor: currentTheme.border,
                      borderWidth: index === currentSongIndex ? 2 : 1,
                    },
                  ]}
                  onPress={() => handlePlaySongByIndex(index)}
                >
                  <View style={styles.playlistPositionIndicator}>
                    <View style={styles.positionNumberContainer}>
                      <Text style={[styles.playlistPosition, {
                        color: index === currentSongIndex ? currentTheme.primary : currentTheme.textSecondary
                      }]}>
                        {index + 1}
                      </Text>
                    </View>

                    {/* Animated Progress Ring for Current Song */}
                    {index === currentSongIndex && alDuration > 0 && (
                      <View style={styles.progressRingContainer}>
                        <View style={[styles.progressRingBackground, { borderColor: currentTheme.inputBackground }]} />
                        <Animated.View
                          style={[
                            styles.progressRingForeground,
                            {
                              borderColor: currentTheme.primary,
                              transform: [{
                                rotate: progressAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                })
                              }]
                            }
                          ]}
                        />
                        <View style={styles.progressRingCenter}>
                          <Text style={[styles.progressTimeText, { color: currentTheme.primary }]}>
                            {formatTime(alCurrentTime)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Duration Display for Current Song */}
                    {index === currentSongIndex && alDuration > 0 && (
                      <Text style={[styles.durationText, { color: currentTheme.textSecondary }]}>
                        / {formatTime(alDuration)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.playlistItemInfo}>
                    <Text style={[styles.playlistItemTitle, { color: currentTheme.text }]}>
                      {index === currentSongIndex && '🎵 '}
                      {item.title}
                    </Text>
                    <Text style={[styles.playlistItemArtist, { color: currentTheme.textSecondary }]}>{item.artist}</Text>
                    {index === currentSongIndex && (
                      <Text style={[styles.nowPlayingIndicator, { color: currentTheme.primary }]}>Now Playing</Text>
                    )}
                  </View>
                  <View style={styles.playlistItemActions}>
                    <TouchableOpacity
                      style={[styles.playlistActionButton, {
                        backgroundColor: index === currentSongIndex ? currentTheme.success : currentTheme.primary
                      }]}
                      onPress={() => handlePlaySongByIndex(index)}
                    >
                      <Text style={[styles.playlistActionText, { color: currentTheme.buttonText }]}>
                        {index === currentSongIndex ? '🎤' : '▶️'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.playlistActionButton, { backgroundColor: currentTheme.error }]}
                      onPress={() => handleRemoveSongFromPlaylist(item)}
                    >
                      <Text style={[styles.playlistActionText, { color: currentTheme.buttonText }]}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
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
  nextSongContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  nextSongLabel: { fontSize: 14, fontStyle: 'italic' },
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

  // Navigation Controls Styles
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  navButtonText: { fontSize: 24 },
  playlistInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  nextSongText: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 150
  },

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
  playlistItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderRadius: 8, marginHorizontal: 4, marginVertical: 2 },
  playlistPositionIndicator: {
    width: 60, // Increased width to accommodate progress ring
    alignItems: 'center',
    marginRight: 12,
    position: 'relative'
  },
  positionNumberContainer: {
    alignItems: 'center',
    marginBottom: 4
  },
  playlistPosition: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  // Animated Progress Ring Styles
  progressRingContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4
  },
  progressRingBackground: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    opacity: 0.3
  },
  progressRingForeground: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressRingCenter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  progressTimeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  durationText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2
  },
  playlistItemInfo: { flex: 1, paddingRight: 12 },
  playlistItemTitle: { fontSize: 16, fontWeight: '600' },
  playlistItemArtist: { fontSize: 14, marginTop: 2 },
  nowPlayingIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textTransform: 'uppercase'
  },
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
