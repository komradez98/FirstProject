import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import CustomSlider from '../components/CustomSlider';
import HeaderNavbar from '../components/HeaderNavbar';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import { api } from '../store/authStore';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];
  const mapRef = useRef(null);

  // Location and map states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('Getting your address...');
  const [nearbyBooths, setNearbyBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingBooths, setIsLoadingBooths] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchRadius, setSearchRadius] = useState(50); // Default 50km radius

  // Map region state
  const [mapRegion, setMapRegion] = useState({
    latitude: -6.2088, // Default to Jakarta
    longitude: 106.8456,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Promotional banners
  const [promotionalBanners] = useState([
    {
      id: 1,
      title: 'Grand Opening Special!',
      description: 'Get 50% off on your first karaoke session',
      image: 'https://via.placeholder.com/300x150/FF6B6B/FFFFFF?text=Grand+Opening+50%25+OFF',
      backgroundColor: '#FF6B6B',
    },
    {
      id: 2,
      title: 'Weekend Package Deal',
      description: 'Book 2 hours, get 1 hour free on weekends',
      image: 'https://via.placeholder.com/300x150/4ECDC4/FFFFFF?text=Weekend+Special+3+for+2',
      backgroundColor: '#4ECDC4',
    },
    {
      id: 3,
      title: 'Group Booking Discount',
      description: '20% off for bookings of 4+ hours',
      image: 'https://via.placeholder.com/300x150/45B7D1/FFFFFF?text=Group+Discount+20%25+OFF',
      backgroundColor: '#45B7D1',
    },
  ]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Check if permissions are already granted
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (hasPermission) {
          console.log('📍 Location permission already granted');
          getCurrentLocation();
          return;
        }

        // Request both fine and coarse location permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        console.log('📍 Permission results:', granted);

        if (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('📍 Location permission granted');
          getCurrentLocation();
        } else {
          console.log('📍 Location permission denied');
          setIsLoadingLocation(false);
          Alert.alert(
            'Location Permission Required',
            'This app needs location access to show nearby booths. Please enable location permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  // Use default location as fallback
                  setCurrentLocation({
                    latitude: 37.4220,
                    longitude: -122.0840
                  });
                  setMapRegion({
                    latitude: 37.4220,
                    longitude: -122.0840,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  });
                  fetchNearbyBooths(37.4220, -122.0840, searchRadius);
                  getCurrentAddress(37.4220, -122.0840);
                }
              }
            ]
          );
        }
      } catch (err) {
        console.error('📍 Location permission error:', err);
        setIsLoadingLocation(false);
        // Use default location as fallback
        setCurrentLocation({
          latitude: 37.4220,
          longitude: -122.0840
        });
        setMapRegion({
          latitude: 37.4220,
          longitude: -122.0840,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        fetchNearbyBooths(37.4220, -122.0840, searchRadius);
        getCurrentAddress(37.4220, -122.0840);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    console.log('📍 Getting current location...');

    Geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Location obtained:', position.coords);
        const { latitude, longitude } = position.coords;
        const location = { latitude, longitude };

        setCurrentLocation(location);
        setMapRegion({
          ...location,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        setIsLoadingLocation(false);
        fetchNearbyBooths(latitude, longitude, searchRadius);
        // Get address for current location
        getCurrentAddress(latitude, longitude);
      },
      (error) => {
        console.error('📍 Location error:', error);
        setIsLoadingLocation(false);

        let errorMessage = 'Unable to get your current location.';
        switch(error.code) {
          case 1:
            errorMessage = 'Location access denied. Please enable location permissions in settings.';
            break;
          case 2:
            errorMessage = 'Location unavailable. Please check if location services are enabled.';
            break;
          case 3:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }

        Alert.alert(
          'Location Error',
          errorMessage + ' Using your approximate location instead.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setIsLoadingLocation(true);
                getCurrentLocation();
              }
            },
            {
              text: 'Use Default Location',
              onPress: () => {
                // Use Mountain View as default location
                const defaultLocation = {
                  latitude: 37.4220,
                  longitude: -122.0840
                };
                setCurrentLocation(defaultLocation);
                setMapRegion({
                  ...defaultLocation,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                });
                fetchNearbyBooths(defaultLocation.latitude, defaultLocation.longitude, searchRadius);
                getCurrentAddress(defaultLocation.latitude, defaultLocation.longitude);
              }
            }
          ]
        );
      },
      {
        enableHighAccuracy: false, // Try with lower accuracy first
        timeout: 20000,            // Increase timeout
        maximumAge: 30000          // Accept cached location
      }
    );
  };

  const fetchNearbyBooths = async (lat, lng, radius = searchRadius) => {
    try {
      setIsLoadingBooths(true);
      console.log('🔍 Fetching nearby booths for:', lat, lng, 'within', radius, 'km');

      // Try to fetch booths within specified radius
      const response = await api.get(`/booths/nearby/radius`, {
        params: {
          lat: lat,
          lng: lng,
          radius: radius, // Use dynamic radius
          limit: 50, // Increased limit for larger radius
          status: 'available' // Only get available booths
        }
      });

      console.log('📍 Nearby booths API response:', response.data);
      console.log('📊 Response status:', response.status);
      console.log('🏢 Booths data structure:', response.data.data);

      const booths = response.data.data.booths || response.data.data || [];
      console.log('🏠 Processed booths array:', booths);
      console.log('📝 Number of booths:', booths.length);

      // Log each booth's coordinates
      booths.forEach((booth, index) => {
        console.log(`🏢 Booth ${index + 1}:`, {
          id: booth.id,
          type: booth.boothType,
          lat: booth.latitude,
          lng: booth.longitude,
          status: booth.status,
          hasCoordinates: !!(booth.latitude && booth.longitude)
        });
      });

      setNearbyBooths(booths);
    } catch (error) {
      console.error('❌ Error fetching nearby booths:', error);
      console.log('🔄 Trying fallback - fetching all available booths...');

      // Fallback to get all available booths if location-based search fails
      try {
        const fallbackResponse = await api.get('/booths/available');
        console.log('🆘 Fallback response:', fallbackResponse.data);

        const fallbackBooths = fallbackResponse.data.data || fallbackResponse.data || [];
        console.log('🏠 Fallback booths:', fallbackBooths);
        console.log('📝 Fallback booth count:', fallbackBooths.length);

        setNearbyBooths(fallbackBooths);
      } catch (fallbackError) {
        console.error('❌ Error fetching fallback booths:', fallbackError);
        Alert.alert('Error', 'Failed to fetch nearby booths. Check console for details.');
      }
    } finally {
      setIsLoadingBooths(false);
    }
  };

  const getCurrentAddress = async (latitude, longitude) => {
    try {
      setIsLoadingAddress(true);
      console.log('🗺️ Getting address for coordinates:', latitude, longitude);

      // Using free OpenStreetMap Nominatim service for reverse geocoding
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=id,en`;

      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'AHA-Karaoke-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🗺️ Geocoding response:', data);

      if (data && data.display_name) {
        let address = data.display_name;
        // Try to make it shorter and more readable
        if (data.address) {
          const addr = data.address;
          const shortAddress = [
            addr.road || addr.pedestrian,
            addr.village || addr.suburb || addr.neighbourhood,
            addr.city || addr.town || addr.county,
            addr.state
          ].filter(Boolean).join(', ');

          if (shortAddress) {
            address = shortAddress;
          }
        }

        console.log('🏠 Address found:', address);
        setCurrentAddress(address);
      } else {
        console.log('❌ No address found in response');
        setCurrentAddress(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error('❌ Error getting current address:', error);
      setCurrentAddress(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    // Re-fetch booths with new radius if we have location
    if (currentLocation) {
      fetchNearbyBooths(currentLocation.latitude, currentLocation.longitude, newRadius);
    } else if (mapRegion) {
      fetchNearbyBooths(mapRegion.latitude, mapRegion.longitude, newRadius);
    }
  };

  const handleMarkerPress = (booth) => {
    setSelectedBooth(booth);
    // Animate to the selected booth
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(booth.latitude),
        longitude: parseFloat(booth.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleBoothSelect = (booth) => {
    Alert.alert(
      `Booth ${booth.boothType}`,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Details',
          onPress: () => navigation.navigate('BoothDetail', { boothId: booth.id }),
        },
        {
          text: 'Book Now',
          onPress: () => navigation.navigate('CreateOrder', { selectedBoothId: booth.id }),
        },
      ]
    );
  };

  const renderPromotionalBanner = ({ item, index }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.bannerCard,
        { backgroundColor: item.backgroundColor + '20' }, // 20% opacity
      ]}
      onPress={() => {
        Alert.alert(item.title, item.description + '\n\nContact us to learn more!');
      }}
    >
      <View style={styles.bannerContent}>
        <Text style={[styles.bannerTitle, { color: currentTheme.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.bannerDescription, { color: currentTheme.textSecondary }]}>
          {item.description}
        </Text>
      </View>
      <View style={[styles.bannerIcon, { backgroundColor: item.backgroundColor }]}>
        <Text style={styles.bannerIconText}>🎤</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBoothInfo = () => {
    if (!selectedBooth) return null;

    return (
      <View style={[styles.boothInfoCard, { backgroundColor: currentTheme.card }]}>
        <View style={styles.boothInfoHeader}>
          <Text style={[styles.boothInfoTitle, { color: currentTheme.text }]}>
            Booth {selectedBooth.boothType}
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedBooth(null)}
            style={styles.closeButton}
          >
            <Text style={[styles.closeButtonText, { color: currentTheme.primary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.boothInfoStatus, { color: currentTheme.success }]}>
          Status: {selectedBooth.status}
        </Text>

        {selectedBooth.landmark && (
          <Text style={[styles.boothInfoText, { color: currentTheme.textSecondary }]}>
            📍 {selectedBooth.landmark}
          </Text>
        )}

        {selectedBooth.address && (
          <Text style={[styles.boothInfoText, { color: currentTheme.textSecondary }]}>
            🏠 {selectedBooth.address}
          </Text>
        )}

        {selectedBooth.distance && (
          <Text style={[styles.boothInfoText, { color: currentTheme.primary }]}>
            📏 {selectedBooth.distanceFormatted} away
          </Text>
        )}

        <View style={styles.boothInfoButtons}>
          <TouchableOpacity
            style={[styles.boothInfoButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => handleBoothSelect(selectedBooth)}
          >
            <Text style={[styles.boothInfoButtonText, { color: currentTheme.buttonText }]}>
              Book Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoadingLocation) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <HeaderNavbar title="Nearby Booths" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Debug - Booth Information */}
        <View style={[styles.debugContainer, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.debugTitle, { color: currentTheme.text }]}>
            Location data
          </Text>
          <Text style={[styles.debugText, { color: currentTheme.textSecondary }]}>
            Current Location: {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'Loading...'}
          </Text>
          <Text style={[styles.debugText, { color: currentTheme.textSecondary }]}>
            📍 Address: {isLoadingAddress ? 'Loading address...' : currentAddress}
          </Text>
        {nearbyBooths.length > 0 && (
          <>
            <Text style={[styles.debugText, { color: currentTheme.success }]}>
              Nearest Booth: {nearbyBooths[0].address}
            </Text>
          </>
        )}
      </View>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.card }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          Available Booths Nearby
        </Text>
        <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>
          Find nearby booths
        </Text>

        {/* Current Location Address */}
        <View style={styles.addressContainer}>
          <Text style={[styles.addressLabel, { color: currentTheme.text }]}>
            📍 Your Location
          </Text>
          <Text style={[styles.addressText, { color: currentTheme.textSecondary }]} numberOfLines={2}>
            {isLoadingAddress ? 'Getting your address...' : currentAddress}
          </Text>
        </View>

        {/* Search Radius Slider */}
        <View style={styles.radiusContainer}>
          <View style={styles.radiusHeader}>
            <Text style={[styles.radiusLabel, { color: currentTheme.text }]}>
              Search Radius
            </Text>
            <Text style={[styles.radiusValue, { color: currentTheme.primary }]}>
              {searchRadius} km
            </Text>
          </View>
          <CustomSlider
            style={styles.radiusSlider}
            minimumValue={5}
            maximumValue={100}
            value={searchRadius}
            onValueChange={setSearchRadius}
            onSlidingComplete={handleRadiusChange}
            minimumTrackTintColor={currentTheme.primary}
            maximumTrackTintColor={currentTheme.border || 'rgba(0,0,0,0.2)'}
            thumbStyle={{
              backgroundColor: currentTheme.primary,
              width: 20,
              height: 20,
            }}
            trackStyle={{
              height: 4,
              borderRadius: 2,
            }}
            step={5}
          />
          <View style={styles.radiusLabels}>
            <Text style={[styles.radiusLabelText, { color: currentTheme.textSecondary }]}>
              5km
            </Text>
            <Text style={[styles.radiusLabelText, { color: currentTheme.textSecondary }]}>
              100km
            </Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={(region) => setMapRegion(region)}
        >
          {/* Current location marker */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              description="You are here"
              pinColor="blue"
            />
          )}

          {/* Booth markers */}
          {nearbyBooths.map((booth) => (
            <Marker
              key={booth.id}
              coordinate={{
                latitude: parseFloat(booth.latitude || 0),
                longitude: parseFloat(booth.longitude || 0),
              }}
              title={`Booth ${booth.boothType}`}
              description={booth.landmark || booth.address || 'Available booth'}
              pinColor={booth.status === 'available' ? 'green' : 'orange'}
              onPress={() => handleMarkerPress(booth)}
            />
          ))}
        </MapView>

        {/* Loading overlay and controls */}
        {isLoadingBooths && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={currentTheme.primary} />
            <Text style={[styles.loadingOverlayText, { color: currentTheme.text }]}>
              Loading booths...
            </Text>
          </View>
        )}

        {/* Refresh button */}
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: currentTheme.card }]}
          onPress={() => {
            if (currentLocation) {
              handleRadiusChange(searchRadius);
            } else {
              handleRadiusChange(searchRadius);
            }
          }}
          disabled={isLoadingBooths}
        >
          <Text style={[styles.refreshButtonText, { color: currentTheme.primary }]}>
            🔄
          </Text>
        </TouchableOpacity>

        {/* Booth info card */}
        {renderBoothInfo()}
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: currentTheme.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: currentTheme.primary }]}>
              {nearbyBooths.length}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              Booths Found
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: currentTheme.success }]}>
              {nearbyBooths.filter(b => b.status === 'available').length}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              Available
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: currentTheme.info || currentTheme.primary }]}>
              {searchRadius}km
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              Search Radius
            </Text>
          </View>
        </View>

        {/* Promotional Banners */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bannersContainer}
          contentContainerStyle={styles.bannersContent}
        >
          {promotionalBanners.map((banner, index) =>
            renderPromotionalBanner({ item: banner, index })
          )}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => navigation.navigate('CreateOrder')}
          >
            <Text style={[styles.quickActionText, { color: currentTheme.buttonText }]}>
              📅 Book Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: currentTheme.secondary || currentTheme.primary }]}
            onPress={() => navigation.navigate('CustomerOrders')}
          >
            <Text style={[styles.quickActionText, { color: currentTheme.buttonText }]}>
              📋 My Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addressContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  radiusContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  radiusSlider: {
    width: '100%',
    height: 40,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  radiusLabelText: {
    fontSize: 12,
  },
  mapContainer: {
    height: 400, // Larger height for better map viewing
    position: 'relative',
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlayText: {
    marginLeft: 8,
    fontSize: 12,
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  boothInfoCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  boothInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  boothInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  boothInfoStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  boothInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  boothInfoButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  boothInfoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  boothInfoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContent: {
    backgroundColor: 'transparent',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
  },
  bannersContainer: {
    marginTop: 16,
    paddingLeft: 16,
  },
  bannersContent: {
    paddingRight: 16,
  },
  bannerCard: {
    width: 280,
    marginRight: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 14,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  bannerIconText: {
    fontSize: 24,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },
});
