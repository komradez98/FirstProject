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
  Modal,
  TextInput,
} from 'react-native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import { api } from '../store/authStore';
import HeaderNavbar from '../components/HeaderNavbar';

export default function StaffOrderScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, processing, ready
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('');

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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'processing',
      'processing': 'ready',
      'ready': 'completed',
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusDisplay = (currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusDisplay(nextStatus) : null;
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updateData = { status: newStatus };

      // If confirming an order, include estimated time
      if (newStatus === 'confirmed' && estimatedTime) {
        updateData.estimatedTime = parseInt(estimatedTime);
      }

      await api.put(`/orders/${orderId}/status`, updateData);
      Alert.alert('Berhasil', `Status pesanan berhasil diubah ke ${getStatusDisplay(newStatus)}`);
      setIsModalVisible(false);
      setEstimatedTime('');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', error.response?.data?.message || 'Gagal mengubah status pesanan');
    }
  };

  const handleOrderPress = (orderId) => {
    // Navigate to order detail screen
    navigation.navigate('OrderDetail', { orderId });
  };

  const handleStatusPress = (order) => {
    const nextStatus = getNextStatus(order.orderStatus);
    if (!nextStatus) return;

    if (nextStatus === 'confirmed') {
      // Show modal to input estimated time
      setSelectedOrder(order);
      setIsModalVisible(true);
    } else {
      // Direct status update
      Alert.alert(
        'Ubah Status',
        `Ubah status pesanan #${order.id} ke "${getStatusDisplay(nextStatus)}"?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Ubah',
            onPress: () => handleStatusUpdate(order.id, nextStatus),
          },
        ]
      );
    }
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
              await api.put(`/orders/${orderId}/cancel`, {
                cancelReason: 'Dibatalkan oleh staff'
              });
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
        { key: 'pending', label: 'Pending' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'processing', label: 'Processing' },
        { key: 'ready', label: 'Ready' },
        { key: 'completed', label: 'Completed' },
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

  const renderOrderCard = (order) => {
    const nextStatus = getNextStatus(order.orderStatus);
    const canUpdateStatus = nextStatus && ['pending', 'confirmed', 'processing', 'ready'].includes(order.orderStatus);
    const canCancel = ['pending', 'confirmed'].includes(order.orderStatus);

    return (
      <TouchableOpacity
        key={order.id}
        style={[
          commonStyles.card,
          { backgroundColor: currentTheme.card, marginBottom: 5 },
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

        <View style={styles.customerInfo}>
          <Text style={[styles.customerText, { color: currentTheme.text }]}>
            Customer: {order.user?.name || 'N/A'}
          </Text>
          <Text style={[styles.boothText, { color: currentTheme.textSecondary }]}>
            Booth: {order.booth?.boothType || 'N/A'}
          </Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={[styles.dateText, { color: currentTheme.textSecondary }]}>
            {new Date(order.orderDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {order.estimatedTime && (
            <Text style={[styles.estimatedTimeText, { color: currentTheme.info }]}>
              Est: {order.estimatedTime} min
            </Text>
          )}
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

        <View style={styles.actionButtons}>
          {canUpdateStatus && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: currentTheme.success },
              ]}
              onPress={() => handleStatusPress(order)}
            >
              <Text style={[styles.actionButtonText, { color: currentTheme.buttonText }]}>
                {getNextStatusDisplay(order.orderStatus)}
              </Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: currentTheme.error, marginLeft: 8 },
              ]}
              onPress={() => handleCancelOrder(order.id)}
            >
              <Text style={[styles.actionButtonText, { color: currentTheme.buttonText }]}>
                Batalkan
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEstimatedTimeModal = () => (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
            Konfirmasi Pesanan #{selectedOrder?.id}
          </Text>

          <Text style={[styles.modalLabel, { color: currentTheme.text }]}>
            Estimasi waktu persiapan (menit):
          </Text>

          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: currentTheme.inputBackground,
                color: currentTheme.inputText,
                borderColor: currentTheme.inputBorder,
                marginBottom: 16,
              },
            ]}
            value={estimatedTime}
            onChangeText={setEstimatedTime}
            placeholder="Contoh: 30"
            placeholderTextColor={currentTheme.textSecondary}
            keyboardType="numeric"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: currentTheme.textSecondary },
              ]}
              onPress={() => {
                setIsModalVisible(false);
                setEstimatedTime('');
              }}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>
                Batal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: currentTheme.success, marginLeft: 12 },
              ]}
              onPress={() => handleStatusUpdate(selectedOrder?.id, 'confirmed')}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>
                Konfirmasi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
      <HeaderNavbar title="Staff Orders" />

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
                : `Tidak ada pesanan dengan status "${filter}"`
              }
            </Text>
          </View>
        ) : (
          orders.map(renderOrderCard)
        )}
      </ScrollView>

      {renderEstimatedTimeModal()}
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
    marginBottom: 4,
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
    marginTop: 8,
    paddingVertical: 4,
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
  customerInfo: {
    marginBottom: 8,
  },
  customerText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  boothText: {
    fontSize: 14,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
  },
  estimatedTimeText: {
    fontSize: 14,
    fontWeight: '600',
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
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    maxWidth: 100,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    maxWidth: 100,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
