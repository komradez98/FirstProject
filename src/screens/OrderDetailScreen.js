import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import { api } from '../store/authStore';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      Alert.alert('Error', 'Failed to fetch order details', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setIsLoading(false);
    }
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

  const handleSubmitOrder = async () => {
    if (!order || order.orderStatus !== 'draft') return;

    Alert.alert(
      'Submit Pesanan',
      'Apakah Anda yakin ingin mengirim pesanan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Submit',
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}/submit`);
              Alert.alert('Berhasil', 'Pesanan berhasil dikirim');
              fetchOrderDetail();
            } catch (error) {
              Alert.alert('Error', 'Gagal mengirim pesanan');
            }
          },
        },
      ]
    );
  };

  const handleCancelOrder = async () => {
    if (!order || !['draft', 'pending', 'confirmed'].includes(order.orderStatus)) return;

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
              fetchOrderDetail();
            } catch (error) {
              Alert.alert('Error', 'Gagal membatalkan pesanan');
            }
          },
        },
      ]
    );
  };

  const renderOrderItems = () => {
    if (!order?.orderItems || order.orderItems.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
          Tidak ada item dalam pesanan
        </Text>
      );
    }

    return order.orderItems.map((orderItem, index) => (
      <View key={index} style={[styles.itemCard, { backgroundColor: currentTheme.surface }]}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, { color: currentTheme.text }]}>
            {orderItem.item?.itemName || 'Unknown Item'}
          </Text>
          <Text style={[styles.itemPrice, { color: currentTheme.primary }]}>
            Rp {parseInt(orderItem.unitPrice).toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.itemDetails}>
          <Text style={[styles.itemQuantity, { color: currentTheme.textSecondary }]}>
            Qty: {orderItem.quantity}
          </Text>
          <Text style={[styles.itemSubtotal, { color: currentTheme.text }]}>
            Subtotal: Rp {parseInt(orderItem.subtotal).toLocaleString('id-ID')}
          </Text>
        </View>

        {orderItem.item?.itemType && (
          <Text style={[styles.itemType, { color: currentTheme.textSecondary }]}>
            Type: {orderItem.item.itemType}
          </Text>
        )}
      </View>
    ));
  };

  const renderStatusTimeline = () => {
    const statusTimeline = [
      { status: 'draft', label: 'Draft', completed: true },
      { status: 'pending', label: 'Pending', completed: order?.orderStatus !== 'draft' },
      { status: 'confirmed', label: 'Confirmed', completed: ['confirmed', 'processing', 'ready', 'completed'].includes(order?.orderStatus) },
      { status: 'processing', label: 'Processing', completed: ['processing', 'ready', 'completed'].includes(order?.orderStatus) },
      { status: 'ready', label: 'Ready', completed: ['ready', 'completed'].includes(order?.orderStatus) },
      { status: 'completed', label: 'Completed', completed: order?.orderStatus === 'completed' },
    ];

    if (order?.orderStatus === 'cancelled') {
      return (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineItem, { borderLeftColor: currentTheme.error }]}>
            <Text style={[styles.timelineLabel, { color: currentTheme.error }]}>
              Pesanan Dibatalkan
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        {statusTimeline.map((item, index) => (
          <View
            key={item.status}
            style={[
              styles.timelineItem,
              {
                borderLeftColor: item.completed ? currentTheme.success : currentTheme.textSecondary,
                opacity: item.completed ? 1 : 0.5,
              },
            ]}
          >
            <Text
              style={[
                styles.timelineLabel,
                {
                  color: item.completed ? currentTheme.success : currentTheme.textSecondary,
                  fontWeight: order?.orderStatus === item.status ? 'bold' : 'normal',
                },
              ]}
            >
              {item.label}
            </Text>
            {order?.orderStatus === item.status && (
              <Text style={[styles.currentStatusIndicator, { color: currentTheme.primary }]}>
                • Current
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>
          Memuat detail pesanan...
        </Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.error }]}>
          Pesanan tidak ditemukan
        </Text>
        <TouchableOpacity
          style={[commonStyles.buttonPrimary, { backgroundColor: currentTheme.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[commonStyles.buttonText, { color: currentTheme.buttonText }]}>
            Kembali
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCustomer = user?.role === 'customer';
  const canSubmit = order.orderStatus === 'draft' && isCustomer;
  const canCancel = ['draft', 'pending', 'confirmed'].includes(order.orderStatus);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.orderTitle, { color: currentTheme.text }]}>
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

        <Text style={[styles.orderDate, { color: currentTheme.textSecondary }]}>
          {new Date(order.orderDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Customer & Booth Info */}
      {!isCustomer && (
        <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Informasi Customer
          </Text>
          <Text style={[styles.customerName, { color: currentTheme.text }]}>
            {order.user?.name || 'N/A'}
          </Text>
          <Text style={[styles.customerDetail, { color: currentTheme.textSecondary }]}>
            @{order.user?.username || 'N/A'} • {order.user?.email || 'N/A'}
          </Text>
        </View>
      )}

      {/* Booth Info */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          Informasi Booth
        </Text>
        <Text style={[styles.boothType, { color: currentTheme.text }]}>
          {order.booth?.boothType || 'N/A'}
        </Text>
        {order.estimatedTime && (
          <Text style={[styles.estimatedTime, { color: currentTheme.info }]}>
            Estimasi: {order.estimatedTime} menit
          </Text>
        )}
      </View>

      {/* Order Items */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          Item Pesanan
        </Text>
        {renderOrderItems()}

        <View style={styles.totalSection}>
          <Text style={[styles.totalLabel, { color: currentTheme.text }]}>
            Total Pesanan:
          </Text>
          <Text style={[styles.totalAmount, { color: currentTheme.primary }]}>
            Rp {parseInt(order.totalAmount).toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Catatan
          </Text>
          <Text style={[styles.notesText, { color: currentTheme.textSecondary }]}>
            {order.notes}
          </Text>
        </View>
      )}

      {/* Status Timeline */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          Status Pesanan
        </Text>
        {renderStatusTimeline()}
      </View>

      {/* Payment Info */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          Informasi Pembayaran
        </Text>
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentLabel, { color: currentTheme.textSecondary }]}>
            Status:
          </Text>
          <Text style={[styles.paymentValue, { color: currentTheme.text }]}>
            {order.paymentStatus || 'Belum ditentukan'}
          </Text>
        </View>
        {order.paymentMethod && (
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: currentTheme.textSecondary }]}>
              Metode:
            </Text>
            <Text style={[styles.paymentValue, { color: currentTheme.text }]}>
              {order.paymentMethod}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {canSubmit && (
          <TouchableOpacity
            style={[
              commonStyles.buttonPrimary,
              { backgroundColor: currentTheme.primary, marginBottom: 12 },
            ]}
            onPress={handleSubmitOrder}
          >
            <Text style={[commonStyles.buttonText, { color: currentTheme.buttonText }]}>
              Submit Pesanan
            </Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[
              commonStyles.buttonOutline,
              { borderColor: currentTheme.error, marginBottom: 12 },
            ]}
            onPress={handleCancelOrder}
          >
            <Text style={[commonStyles.buttonTextOutline, { color: currentTheme.error }]}>
              Batalkan Pesanan
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            commonStyles.buttonOutline,
            { borderColor: currentTheme.textSecondary },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[commonStyles.buttonTextOutline, { color: currentTheme.textSecondary }]}>
            Kembali
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
  },
  boothType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemType: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    borderLeftWidth: 3,
    paddingLeft: 16,
    paddingVertical: 8,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentStatusIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
});
