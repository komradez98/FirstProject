import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import { api } from '../store/authStore';
import HeaderNavbar from '../components/HeaderNavbar';

const { width, height } = Dimensions.get('window');

export default function RemoteScreen({ navigation, route }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  // State management
  const [uniqueId, setUniqueId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedBooth, setConnectedBooth] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingReadyOrders, setIsLoadingReadyOrders] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Load user's successful orders on component mount
  useEffect(() => {
    fetchUserOrders();
    fetchReadyOrders();
  }, []);

  // Fetch user's ready orders (orders with unique IDs)
  const fetchReadyOrders = async () => {
    try {
      setIsLoadingReadyOrders(true);
      const response = await api.get('/orders/customer/ready');

      if (response.data?.data) {
        setReadyOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching ready orders:', error);
      // Don't show error alert for ready orders as it's not critical
    } finally {
      setIsLoadingReadyOrders(false);
    }
  };

  // Fetch user's completed/confirmed orders
  const fetchUserOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await api.get('/orders/customer', {
        params: {
          status: 'confirmed', // Only get confirmed orders
          limit: 10
        }
      });

      if (response.data?.data) {
        setUserOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load your orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Handle manual unique ID input
  const handleConnectById = async () => {
    if (!uniqueId.trim()) {
      Alert.alert('Input Required', 'Please enter a unique ID to connect');
      return;
    }

    await connectToBooth(uniqueId.trim());
  };

  // Autofill unique ID from ready order
  const handleAutofillUniqueId = (order) => {
    setUniqueId(order.uniqueId);
    Alert.alert(
      'ID Autofilled',
      `Unique ID from Order #${order.id} has been filled. Tap "Connect to Booth" to continue.`,
      [
        { text: 'Connect Now', onPress: () => connectToBooth(order.uniqueId) },
        { text: 'OK' }
      ]
    );
  };

  // Connect to booth using unique ID
  const connectToBooth = async (id) => {
    try {
      setIsConnecting(true);

      // First approach: Try to find the order directly by unique ID
      let orderWithBooth = null;

      try {
        // Check if the unique ID belongs to user's ready orders
        const readyOrdersResponse = await api.get('/orders/customer/ready');
        const readyOrder = readyOrdersResponse.data?.data?.find(order => order.uniqueId === id);

        if (readyOrder) {
          orderWithBooth = readyOrder;
          console.log('Found order from ready orders:', orderWithBooth);
        }
      } catch (readyOrderError) {
        console.log('Ready orders check failed, trying alternative approach');
      }

      // Second approach: Try to verify through active listeners (fallback)
      if (!orderWithBooth) {
        try {
          const verifyResponse = await api.get(`/active-listeners/unique/${id}`);

          if (verifyResponse.data?.data) {
            const listener = verifyResponse.data.data;

            // Check if this booth belongs to one of user's orders
            const userOrder = userOrders.find(order =>
              order.boothId === listener.boothId &&
              (order.orderStatus === 'confirmed' || order.orderStatus === 'ready' || order.orderStatus === 'processing')
            );

            if (userOrder) {
              orderWithBooth = {
                ...userOrder,
                uniqueId: id,
                booth: userOrder.booth || listener.booth
              };
            }
          }
        } catch (verifyError) {
          console.log('Active listeners verification failed');
        }
      }

      if (!orderWithBooth) {
        Alert.alert(
          'Access Denied',
          'This unique ID is not associated with your orders, or you don\'t have permission to access this booth.'
        );
        return;
      }

      // Connect to the booth
      const connectResponse = await api.post(`/active-listeners/unique/${id}/connect`, {
        userId: user.id
      });

      if (connectResponse.data?.data) {
        // Successfully connected
        const boothData = {
          ...connectResponse.data.data,
          order: orderWithBooth,
          uniqueId: id
        };

        setConnectedBooth(boothData);

        Alert.alert(
          'Connected Successfully!',
          `Connected to Booth ${orderWithBooth.booth?.boothType || 'Unknown'}\nStatus: ${connectResponse.data.data.status?.toUpperCase() || 'CONNECTED'}\nOrder: #${orderWithBooth.id}`,
          [
            {
              text: 'Open Remote Control',
              onPress: () => {
                navigation.navigate('MusicPlayer', {
                  booth: boothData,
                  uniqueId: id
                });
              }
            },
            {
              text: 'Later',
              style: 'cancel'
            }
          ]
        );
      }

    } catch (error) {
      console.error('Connection error:', error);

      if (error.response?.status === 404) {
        Alert.alert('Not Found', 'Booth with this unique ID was not found or is not active');
      } else if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'You do not have permission to access this booth');
      } else if (error.response?.status === 400) {
        Alert.alert(
          'Connection Failed',
          error.response?.data?.message || 'Booth is not available for connection'
        );
      } else {
        Alert.alert('Connection Error', 'Failed to connect to booth. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from booth
  const disconnectFromBooth = async () => {
    if (!connectedBooth?.uniqueId) return;

    try {
      setIsConnecting(true);

      const response = await api.post(`/active-listeners/unique/${connectedBooth.uniqueId}/disconnect`);

      if (response.data?.data) {
        Alert.alert(
          'Disconnected Successfully',
          'You have been disconnected from the booth.',
          [
            {
              text: 'OK',
              onPress: () => {
                setConnectedBooth(null);
                setUniqueId('');
              }
            }
          ]
        );
      }

    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Disconnect Error', 'Failed to disconnect from booth.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle QR code scan (placeholder for now)
  const handleScanQR = () => {
    // TODO: Implement QR code scanning functionality
    Alert.alert(
      'QR Scanner',
      'QR code scanning will be implemented in the next update. For now, please use manual input.',
      [
        { text: 'OK' }
      ]
    );
  };

  // Render ready orders for autofill
  const renderReadyOrders = () => {
    if (isLoadingReadyOrders) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={currentTheme.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
            Loading ready orders...
          </Text>
        </View>
      );
    }

    if (readyOrders.length === 0) {
      return null; // Don't show anything if no ready orders
    }

    return (
      <View style={[styles.readyOrdersContainer, { backgroundColor: currentTheme.card }]}>
        <Text style={[styles.readyOrdersTitle, { color: currentTheme.text }]}>
          🎮 Ready Orders (Quick Connect)
        </Text>
        <Text style={[styles.readyOrdersSubtitle, { color: currentTheme.textSecondary }]}>
          Your orders are ready! Tap to autofill the unique ID
        </Text>

        {readyOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={[styles.readyOrderItem, { backgroundColor: currentTheme.success + '20', borderColor: currentTheme.success }]}
            onPress={() => handleAutofillUniqueId(order)}
          >
            <View style={styles.readyOrderInfo}>
              <Text style={[styles.readyOrderText, { color: currentTheme.text }]}>
                Order #{order.id} - {order.booth?.boothType || 'N/A'}
              </Text>
              <Text style={[styles.readyOrderSubtext, { color: currentTheme.textSecondary }]}>
                Ready: {new Date(order.readyAt).toLocaleTimeString()}
              </Text>
              <Text style={[styles.readyOrderId, { color: currentTheme.primary }]}>
                ID: {order.uniqueId}
              </Text>
            </View>
            <View style={[styles.autofillBadge, { backgroundColor: currentTheme.success }]}>
              <Text style={[styles.autofillText, { color: currentTheme.buttonText }]}>
                📱 Connect
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render user's orders for reference
  const renderUserOrders = () => {
    if (isLoadingOrders) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={currentTheme.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
            Loading your orders...
          </Text>
        </View>
      );
    }

    if (userOrders.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
            No Active Bookings
          </Text>
          <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
            You need a confirmed booking to use the remote control.
          </Text>
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => navigation.navigate('CreateOrder')}
          >
            <Text style={[styles.bookButtonText, { color: currentTheme.buttonText }]}>
              Book a Booth Now
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.ordersContainer, { backgroundColor: currentTheme.card }]}>
        <Text style={[styles.ordersTitle, { color: currentTheme.text }]}>
          Your Active Bookings
        </Text>
        {userOrders.slice(0, 3).map((order) => (
          <View key={order.id} style={[styles.orderItem, { borderColor: currentTheme.border }]}>
            <View style={styles.orderInfo}>
              <Text style={[styles.orderText, { color: currentTheme.text }]}>
                Order #{order.id} - Booth {order.booth?.boothType || 'N/A'}
              </Text>
              <Text style={[styles.orderSubtext, { color: currentTheme.textSecondary }]}>
                {order.booth?.landmark || order.booth?.address || 'No location'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: currentTheme.success }
            ]}>
              <Text style={[styles.statusText, { color: currentTheme.buttonText }]}>
                {order.orderStatus}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <HeaderNavbar title="Remote Control" />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            Connect to Your Booth
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            Enter or scan the unique ID from your booked booth to start remote control
          </Text>
        </View>

        {/* Connection Methods */}
        <View style={[styles.methodsContainer, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.methodsTitle, { color: currentTheme.text }]}>
            Connection Methods
          </Text>

          {/* Manual Input Method */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
              Enter Unique ID
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: currentTheme.inputBackground,
                  color: currentTheme.inputText,
                  borderColor: currentTheme.inputBorder,
                }
              ]}
              placeholder="Enter booth unique ID..."
              placeholderTextColor={currentTheme.textSecondary}
              value={uniqueId}
              onChangeText={setUniqueId}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.connectButton,
                { backgroundColor: currentTheme.primary },
                isConnecting && styles.disabledButton
              ]}
              onPress={handleConnectById}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color={currentTheme.buttonText} />
              ) : (
                <Text style={[styles.connectButtonText, { color: currentTheme.buttonText }]}>
                  Connect to Booth
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* QR Scanner Method */}
          <View style={styles.scannerSection}>
            <Text style={[styles.orText, { color: currentTheme.textSecondary }]}>
              OR
            </Text>

            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: currentTheme.secondary }]}
              onPress={handleScanQR}
            >
              <Text style={[styles.scanButtonText, { color: currentTheme.buttonText }]}>
                📷 Scan QR Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ready Orders Quick Access */}
        {readyOrders.length > 0 && (
          <View style={[styles.readyOrdersContainer, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.readyOrdersTitle, { color: currentTheme.text }]}>
              🎮 Quick Access - Ready Orders
            </Text>
            <Text style={[styles.readyOrdersSubtitle, { color: currentTheme.textSecondary }]}>
              Tap an order to autofill its Unique ID
            </Text>
            {readyOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.readyOrderItem, { borderColor: currentTheme.border }]}
                onPress={() => handleAutofillUniqueId(order)}
              >
                <View style={styles.readyOrderInfo}>
                  <Text style={[styles.readyOrderText, { color: currentTheme.text }]}>
                    Order #{order.id} - Booth {order.booth?.boothType || 'N/A'}
                  </Text>
                  <Text style={[styles.readyOrderSubtext, { color: currentTheme.textSecondary }]}>
                    {order.booth?.landmark || 'Ready for pickup'}
                  </Text>
                  <Text style={[styles.readyOrderId, { color: currentTheme.primary }]}>
                    ID: {order.uniqueId}
                  </Text>
                </View>
                <View style={[styles.readyBadge, { backgroundColor: currentTheme.success }]}>
                  <Text style={[styles.readyBadgeText, { color: currentTheme.buttonText }]}>
                    READY
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* User Orders Reference */}
        {renderReadyOrders()}
        {renderUserOrders()}

        {/* Connected Booth Info */}
        {connectedBooth && (
          <View style={[styles.connectedContainer, { backgroundColor: currentTheme.success }]}>
            <Text style={[styles.connectedTitle, { color: currentTheme.buttonText }]}>
              ✅ Connected Successfully!
            </Text>
            <Text style={[styles.connectedText, { color: currentTheme.buttonText }]}>
              Booth: {connectedBooth.boothType} (ID: {connectedBooth.boothId})
            </Text>
            <Text style={[styles.connectedText, { color: currentTheme.buttonText }]}>
              Status: {connectedBooth.status?.toUpperCase() || 'CONNECTED'}
            </Text>
            <Text style={[styles.connectedText, { color: currentTheme.buttonText }]}>
              Room: {connectedBooth.roomName}
            </Text>
            {connectedBooth.remainingTime > 0 && (
              <Text style={[styles.connectedText, { color: currentTheme.buttonText }]}>
                Time Remaining: {connectedBooth.remainingTime} minutes
              </Text>
            )}

            <View style={styles.connectedActions}>
              <TouchableOpacity
                style={[styles.remoteControlButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                  navigation.navigate('MusicPlayer', {
                    booth: connectedBooth,
                    uniqueId: connectedBooth.uniqueId
                  });
                }}
              >
                <Text style={[styles.remoteControlButtonText, { color: currentTheme.buttonText }]}>
                  🎮 Open Music Player
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.disconnectButton, { backgroundColor: currentTheme.error }]}
                onPress={disconnectFromBooth}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color={currentTheme.buttonText} />
                ) : (
                  <Text style={[styles.disconnectButtonText, { color: currentTheme.buttonText }]}>
                    🚪 Disconnect
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  methodsContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  connectButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  scannerSection: {
    alignItems: 'center',
  },
  orText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  scanButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ordersContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  orderInfo: {
    flex: 1,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  orderSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  bookButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  connectedContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  connectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  connectedText: {
    fontSize: 16,
    marginBottom: 4,
  },
  connectedActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  remoteControlButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  remoteControlButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  readyOrdersContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  readyOrdersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  readyOrdersSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  readyOrderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  readyOrderInfo: {
    flex: 1,
  },
  readyOrderText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  readyOrderSubtext: {
    fontSize: 14,
    marginBottom: 2,
  },
  readyOrderId: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  readyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  readyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Ready Orders Styles
  readyOrdersContainer: {
    marginBottom: 20,
  },
  readyOrdersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  readyOrdersLoading: {
    padding: 16,
    alignItems: 'center',
  },
  readyOrdersEmpty: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  readyOrdersEmptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  readyOrdersList: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 8,
  },
  readyOrderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  readyOrderInfo: {
    flex: 1,
  },
  readyOrderId: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  readyOrderBooth: {
    fontSize: 11,
    opacity: 0.7,
  },
  readyOrderUseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  readyOrderUseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
