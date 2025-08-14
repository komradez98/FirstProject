import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import { api } from '../store/authStore';

export default function CustomerOrderScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/orders', { params });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      draft: currentTheme.textSecondary,
      pending: currentTheme.warning,
      confirmed: currentTheme.info,
      processing: currentTheme.primary,
      ready: currentTheme.success,
      completed: currentTheme.success,
      cancelled: currentTheme.error,
    };
    return statusColors[status] || currentTheme.textSecondary;
  };

  const getStatusDisplay = (status) => {
    const statusDisplayMap = {
      'draft': 'Draft',
      'pending': 'Menunggu Konfirmasi',
      'confirmed': 'Dikonfirmasi',
      'processing': 'Sedang Diproses',
      'ready': 'Siap Diambil',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return statusDisplayMap[status] || status;
  };

  const handleOrderPress = (orderId) => {
    // Navigate to order detail screen
    navigation.navigate('OrderDetail', { orderId });
  };

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      'Batalkan Pesanan',
      'Apakah Anda yakin ingin membatalkan pesanan ini?',
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}/cancel`);
              Alert.alert('Berhasil', 'Pesanan berhasil dibatalkan');
              fetchOrders();
            } catch (error) {
              Alert.alert('Error', 'Gagal membatalkan pesanan');
            }
          },
        },
      ]
    );
  };

  const renderFilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {[
        { key: 'all', label: 'Semua' },
        { key: 'pending', label: 'Menunggu' },
        { key: 'confirmed', label: 'Dikonfirmasi' },
        { key: 'processing', label: 'Diproses' },
        { key: 'ready', label: 'Siap' },
        { key: 'completed', label: 'Selesai' },
      ].map((filterOption) => (
        <TouchableOpacity
          key={filterOption.key}
          style={[
            styles.filterButton,
            {
              backgroundColor: filter === filterOption.key
                ? currentTheme.primary + '20' // 20% opacity
                : 'transparent',
              borderColor: filter === filterOption.key
                ? currentTheme.primary
                : currentTheme.primary + '40', // 40% opacity border
            },
          ]}
          onPress={() => setFilter(filterOption.key)}
        >
          <Text
            style={[
              styles.filterButtonText,
              {
                color: filter === filterOption.key
                  ? currentTheme.primary
                  : currentTheme.textSecondary,
              },
            ]}
          >
            {filterOption.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOrderCard = (order) => (
    <TouchableOpacity
      key={order.id}
      style={[
        commonStyles.card,
        { backgroundColor: currentTheme.card, marginBottom: 12 },
      ]}
      onPress={() => handleOrderPress(order.id)}
    >
      <View style={styles.orderHeader}>
        <Text style={[styles.orderNumber, { color: currentTheme.text }]}>
          Order #{order.id}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.orderStatus) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusDisplay(order.orderStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={[styles.boothText, { color: currentTheme.textSecondary }]}>
          Booth: {order.booth?.boothType || 'N/A'}
        </Text>
        <Text style={[styles.dateText, { color: currentTheme.textSecondary }]}>
          {new Date(order.orderDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={[styles.itemCount, { color: currentTheme.textSecondary }]}>
          {order.orderItems?.length || 0} item(s)
        </Text>
        <Text style={[styles.totalAmount, { color: currentTheme.primary }]}>
          Rp {parseInt(order.totalAmount).toLocaleString('id-ID')}
        </Text>
      </View>

      {order.notes && (
        <Text style={[styles.notesText, { color: currentTheme.textSecondary }]}>
          Notes: {order.notes}
        </Text>
      )}

      {(['draft', 'pending', 'confirmed'].includes(order.orderStatus)) && (
        <TouchableOpacity
          style={[
            styles.cancelButton,
            { borderColor: currentTheme.error },
          ]}
          onPress={() => handleCancelOrder(order.id)}
        >
          <Text style={[styles.cancelButtonText, { color: currentTheme.error }]}>
            Batalkan Pesanan
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>
          Memuat pesanan...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[commonStyles.heading2, { color: currentTheme.text, marginHorizontal: 16, marginTop: 16, marginBottom: 12 }]}>
        Pesanan Saya
      </Text>

      {renderFilterButtons()}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.primary]}
            tintColor={currentTheme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
              {filter === 'all'
                ? 'Belum ada pesanan'
                : `Tidak ada pesanan dengan status "${getStatusDisplay(filter)}"`
              }
            </Text>
            <TouchableOpacity
              style={[
                commonStyles.buttonPrimary,
                { backgroundColor: currentTheme.primary, marginTop: 16 },
              ]}
              onPress={() => navigation.navigate('CreateOrder')}
            >
              <Text style={[commonStyles.buttonText, { color: currentTheme.buttonText }]}>
                Buat Pesanan Baru
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {orders.map(renderOrderCard)}

            <TouchableOpacity
              style={[
                commonStyles.buttonOutline,
                {
                  borderColor: currentTheme.primary,
                  marginTop: 16,
                  marginBottom: 32,
                },
              ]}
              onPress={() => navigation.navigate('CreateOrder')}
            >
              <Text style={[commonStyles.buttonTextOutline, { color: currentTheme.primary }]}>
                Buat Pesanan Baru
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 0.5,
    marginRight: 4,
    minWidth: 60,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterButtonText: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
  scrollContainer: {

  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boothText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 14,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
