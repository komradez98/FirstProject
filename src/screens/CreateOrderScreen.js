import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth, useTheme } from '../store';
import { themes } from '../config/theme';
import { commonStyles } from '../config/styles';
import { api } from '../store/authStore';
import HomeButton from '../components/HomeButton';

export default function CreateOrderScreen({ navigation, route }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  // Get selectedBoothId from navigation params
  const selectedBoothId = route?.params?.selectedBoothId;

  // State for booths
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [isBoothModalVisible, setIsBoothModalVisible] = useState(false);

  // State for items
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);

  // Order details
  const [notes, setNotes] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('60');

  // Loading states
  const [isLoadingBooths, setIsLoadingBooths] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Order state
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    fetchBooths();
    fetchItems();
  }, []);

  useEffect(() => {
    // Auto-select booth if selectedBoothId is provided
    if (selectedBoothId && booths.length > 0) {
      const preSelectedBooth = booths.find(booth => booth.id === selectedBoothId);
      if (preSelectedBooth) {
        setSelectedBooth(preSelectedBooth);
      }
    }
  }, [selectedBoothId, booths]);

  const fetchBooths = async () => {
    try {
      setIsLoadingBooths(true);
      console.log('Fetching booths...');
      const response = await api.get('/booths/available');
      console.log('Booths response:', response.data);
      setBooths(response.data.data || []);
    } catch (error) {
      console.error('Error fetching booths:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', 'Failed to fetch booths');
    } finally {
      setIsLoadingBooths(false);
    }
  };

  const fetchItems = async () => {
    try {
      setIsLoadingItems(true);
      console.log('Fetching items...');
      const response = await api.get('/items?limit=100');
      console.log('Items response:', response.data);
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', 'Failed to fetch items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleBoothSelect = (booth) => {
    setSelectedBooth(booth);
    setIsBoothModalVisible(false);
  };

  const handleItemSelect = (item) => {
    const existingItemIndex = selectedItems.findIndex(
      selectedItem => selectedItem.itemId === item.id
    );

    if (existingItemIndex >= 0) {
      // Item already selected, increase quantity
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      setSelectedItems([
        ...selectedItems,
        {
          itemId: item.id,
          item: item,
          quantity: 1,
        }
      ]);
    }
  };

  const handleItemQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
    } else {
      // Update quantity
      const updatedItems = selectedItems.map(item =>
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      );
      setSelectedItems(updatedItems);
    }
  };

  const calculateTotalAmount = () => {
    return selectedItems.reduce((total, selectedItem) => {
      const basePrice = parseFloat(selectedItem.item.itemPrice) * selectedItem.quantity;
      const taxAmount = basePrice * (parseFloat(selectedItem.item.itemTax) / 100);
      const discountAmount = basePrice * (parseFloat(selectedItem.item.itemDiscount) / 100);
      const subtotal = basePrice + taxAmount - discountAmount;
      return total + subtotal;
    }, 0);
  };

  const handleCreateOrder = async () => {
    // Validation
    if (!selectedBooth) {
      Alert.alert('Error', 'Please select a booth');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item');
      return;
    }

    if (!estimatedTime || parseInt(estimatedTime) <= 0) {
      Alert.alert('Error', 'Please enter a valid estimated time');
      return;
    }

    try {
      setIsCreatingOrder(true);

      const orderData = {
        boothId: selectedBooth.id,
        items: selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        notes: notes.trim() || undefined,
        estimatedTime: parseInt(estimatedTime),
      };

      const response = await api.post('/orders', orderData);
      const order = response.data.data;

      setCreatedOrder(order);

      Alert.alert(
        'Success',
        'Order created successfully! Your order is in draft status. Do you want to submit it now?',
        [
          {
            text: 'Submit Later',
            style: 'cancel',
            onPress: () => {
              navigation.navigate('OrderDetail', { orderId: order.id });
            },
          },
          {
            text: 'Submit Now',
            onPress: () => handleSubmitOrder(order.id),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create order';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSubmitOrder = async (orderId = null) => {
    const targetOrderId = orderId || createdOrder?.id;

    if (!targetOrderId) {
      Alert.alert('Error', 'No order to submit');
      return;
    }

    try {
      setIsSubmittingOrder(true);

      await api.put(`/orders/${targetOrderId}/submit`);

      Alert.alert(
        'Success',
        'Order submitted successfully! It is now pending confirmation.',
        [
          {
            text: 'View Order',
            onPress: () => {
              navigation.navigate('OrderDetail', { orderId: targetOrderId });
            },
          },
          {
            text: 'Back to Orders',
            onPress: () => {
              navigation.navigate('CustomerOrders');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit order';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const renderBoothModal = () => (
    <Modal
      visible={isBoothModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsBoothModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
              Select Booth
            </Text>
            <TouchableOpacity
              onPress={() => setIsBoothModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: currentTheme.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            {isLoadingBooths ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={currentTheme.primary} />
                <Text style={[styles.loadingText, { color: currentTheme.text }]}>
                  Loading booths...
                </Text>
              </View>
            ) : (
              <View>
                <Text style={[{ color: currentTheme.text, marginVertical: 8, fontSize: 16, fontWeight: 'bold' }]}>
                  Found {booths.length} booths
                </Text>
                {booths.map((booth, index) => (
                  <TouchableOpacity
                    key={`booth-${booth.id}-${index}`}
                    style={[
                      styles.boothItem,
                      {
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border,
                        marginBottom: 8,
                      }
                    ]}
                    onPress={() => handleBoothSelect(booth)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.boothType, { color: currentTheme.text }]}>
                      Booth {booth.boothType} (ID: {booth.id})
                    </Text>
                    <Text style={[styles.boothStatus, { color: currentTheme.success }]}>
                      Status: {booth.status}
                    </Text>
                    {booth.landmark && (
                      <Text style={[styles.boothLocation, { color: currentTheme.textSecondary }]}>
                        Landmark: {booth.landmark}
                      </Text>
                    )}
                    {booth.address && (
                      <Text style={[styles.boothAddress, { color: currentTheme.textSecondary }]}>
                        Address: {booth.address}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}

                {booths.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                      No available booths found
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderItemModal = () => (
    <Modal
      visible={isItemModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsItemModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
              Select Items
            </Text>
            <TouchableOpacity
              onPress={() => setIsItemModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: currentTheme.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            {isLoadingItems ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={currentTheme.primary} />
                <Text style={[styles.loadingText, { color: currentTheme.text }]}>
                  Loading items...
                </Text>
              </View>
            ) : (
              <View>
                <Text style={[{ color: currentTheme.text, marginVertical: 8, fontSize: 16, fontWeight: 'bold' }]}>
                  Found {items.length} items
                </Text>
                {items.map((item, index) => {
                  console.log('Rendering item:', item.itemName, item.id);
                  const selectedItem = selectedItems.find(
                    selectedItem => selectedItem.itemId === item.id
                  );
                  const quantity = selectedItem ? selectedItem.quantity : 0;

                  return (
                    <View
                      key={`item-${item.id}-${index}`}
                      style={[
                        styles.itemContainer,
                        {
                          backgroundColor: currentTheme.background,
                          borderColor: currentTheme.border,
                          marginBottom: 8,
                        }
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.itemInfo}
                        onPress={() => {
                          console.log('Item selected:', item.itemName);
                          handleItemSelect(item);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.itemName, { color: currentTheme.text }]}>
                          {item.itemName}
                        </Text>
                        <Text style={[styles.itemType, { color: currentTheme.textSecondary }]}>
                          Type: {item.itemType}
                        </Text>
                        <Text style={[styles.itemPrice, { color: currentTheme.primary }]}>
                          Rp {parseInt(item.itemPrice).toLocaleString('id-ID')}
                        </Text>
                        {item.itemDescription && (
                          <Text style={[styles.itemDescription, { color: currentTheme.textSecondary }]}>
                            {item.itemDescription}
                          </Text>
                        )}
                        <Text style={[{ color: currentTheme.textSecondary, fontSize: 10 }]}>
                          Tax: {item.itemTax}% | Discount: {item.itemDiscount}%
                        </Text>
                      </TouchableOpacity>

                      {quantity > 0 && (
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={[styles.quantityButton, { borderColor: currentTheme.primary }]}
                            onPress={() => handleItemQuantityChange(item.id, quantity - 1)}
                          >
                            <Text style={[styles.quantityButtonText, { color: currentTheme.primary }]}>
                              -
                            </Text>
                          </TouchableOpacity>
                          <Text style={[styles.quantityText, { color: currentTheme.text }]}>
                            {quantity}
                          </Text>
                          <TouchableOpacity
                            style={[styles.quantityButton, { borderColor: currentTheme.primary }]}
                            onPress={() => handleItemQuantityChange(item.id, quantity + 1)}
                          >
                            <Text style={[styles.quantityButtonText, { color: currentTheme.primary }]}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}

                {items.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                      No items available
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSelectedItems = () => {
    if (selectedItems.length === 0) return null;

    return (
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text, marginBottom: 12 }]}>
          Selected Items
        </Text>
        {selectedItems.map((selectedItem) => {
          const basePrice = parseFloat(selectedItem.item.itemPrice) * selectedItem.quantity;
          const taxAmount = basePrice * (parseFloat(selectedItem.item.itemTax) / 100);
          const discountAmount = basePrice * (parseFloat(selectedItem.item.itemDiscount) / 100);
          const subtotal = basePrice + taxAmount - discountAmount;

          return (
            <View key={selectedItem.itemId} style={styles.selectedItemRow}>
              <View style={styles.selectedItemInfo}>
                <Text style={[styles.selectedItemName, { color: currentTheme.text }]}>
                  {selectedItem.item.itemName}
                </Text>
                <Text style={[styles.selectedItemDetails, { color: currentTheme.textSecondary }]}>
                  {selectedItem.quantity}x @ Rp {parseInt(selectedItem.item.itemPrice).toLocaleString('id-ID')}
                </Text>
                <Text style={[styles.selectedItemTax, { color: currentTheme.textSecondary }]}>
                  Tax: {selectedItem.item.itemTax}% | Discount: {selectedItem.item.itemDiscount}%
                </Text>
              </View>
              <Text style={[styles.selectedItemSubtotal, { color: currentTheme.primary }]}>
                Rp {subtotal.toLocaleString('id-ID')}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const isOrderComplete = createdOrder && !isCreatingOrder;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Debug - Uncomment to check data */}
      {/* <View>
        <Text style={{ color: currentTheme.text }}>Booths: {booths.length}</Text>
        <Text style={{ color: currentTheme.text }}>Items: {items.length}</Text>
        <Text style={{ color: currentTheme.text }}>Loading Booths: {isLoadingBooths ? 'Yes' : 'No'}</Text>
        <Text style={{ color: currentTheme.text }}>Loading Items: {isLoadingItems ? 'Yes' : 'No'}</Text>
      </View> */}
      <Text style={[commonStyles.heading2, { color: currentTheme.text, marginBottom: 24 }]}>
        Create New Order
      </Text>

      {/* Booth Selection */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          Select Booth
        </Text>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            {
              backgroundColor: currentTheme.background,
              borderColor: selectedBooth ? currentTheme.primary : currentTheme.border,
            }
          ]}
          onPress={() => setIsBoothModalVisible(true)}
          disabled={isOrderComplete}
        >
          <Text style={[
            styles.selectionButtonText,
            { color: selectedBooth ? currentTheme.text : currentTheme.textSecondary }
          ]}>
            {selectedBooth
              ? `Booth ${selectedBooth.boothType}${selectedBooth.landmark ? ` - ${selectedBooth.landmark}` : ''}`
              : 'Select a booth'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Item Selection */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          Select Items
        </Text>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            {
              backgroundColor: currentTheme.background,
              borderColor: selectedItems.length > 0 ? currentTheme.primary : currentTheme.border,
            }
          ]}
          onPress={() => setIsItemModalVisible(true)}
          disabled={isOrderComplete}
        >
          <Text style={[
            styles.selectionButtonText,
            { color: selectedItems.length > 0 ? currentTheme.text : currentTheme.textSecondary }
          ]}>
            {selectedItems.length > 0
              ? `${selectedItems.length} item(s) selected`
              : 'Select items'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Items Display */}
      {renderSelectedItems()}

      {/* Order Details */}
      <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text, marginBottom: 12 }]}>
          Order Details
        </Text>

        <Text style={[styles.inputLabel, { color: currentTheme.text, marginBottom: 4 }]}>
          Estimated Time (minutes)
        </Text>
        <TextInput
          style={[
            commonStyles.input,
            {
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border,
              color: currentTheme.text,
              marginBottom: 16,
              opacity: isOrderComplete ? 0.6 : 1,
            }
          ]}
          value={estimatedTime}
          onChangeText={setEstimatedTime}
          keyboardType="numeric"
          placeholder="60"
          placeholderTextColor={currentTheme.textSecondary}
          editable={!isOrderComplete}
        />

        <Text style={[styles.inputLabel, { color: currentTheme.text, marginBottom: 4 }]}>
          Notes (Optional)
        </Text>
        <TextInput
          style={[
            commonStyles.input,
            {
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border,
              color: currentTheme.text,
              height: 80,
              textAlignVertical: 'top',
              opacity: isOrderComplete ? 0.6 : 1,
            }
          ]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Add any special instructions or notes..."
          placeholderTextColor={currentTheme.textSecondary}
          editable={!isOrderComplete}
        />
      </View>

      {/* Order Summary */}
      {selectedItems.length > 0 && (
        <View style={[commonStyles.card, { backgroundColor: currentTheme.card, marginBottom: 24 }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text, marginBottom: 12 }]}>
            Order Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>
              Total Items:
            </Text>
            <Text style={[styles.summaryValue, { color: currentTheme.text }]}>
              {selectedItems.reduce((total, item) => total + item.quantity, 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>
              Total Amount:
            </Text>
            <Text style={[styles.totalAmount, { color: currentTheme.primary }]}>
              Rp {calculateTotalAmount().toLocaleString('id-ID')}
            </Text>
          </View>
          {createdOrder && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>
                Order Status:
              </Text>
              <Text style={[styles.summaryValue, { color: currentTheme.warning }]}>
                {createdOrder.orderStatus}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {!isOrderComplete ? (
        <TouchableOpacity
          style={[
            commonStyles.buttonPrimary,
            {
              backgroundColor: currentTheme.primary,
              opacity: isCreatingOrder ? 0.7 : 1,
            }
          ]}
          onPress={handleCreateOrder}
          disabled={isCreatingOrder}
        >
          {isCreatingOrder ? (
            <ActivityIndicator size="small" color={currentTheme.buttonText} />
          ) : (
            <Text style={[commonStyles.buttonText, { color: currentTheme.buttonText }]}>
              Create Order
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              commonStyles.buttonPrimary,
              {
                backgroundColor: currentTheme.primary,
                opacity: isSubmittingOrder ? 0.7 : 1,
                flex: 1,
                marginRight: 8,
              }
            ]}
            onPress={() => handleSubmitOrder()}
            disabled={isSubmittingOrder}
          >
            {isSubmittingOrder ? (
              <ActivityIndicator size="small" color={currentTheme.buttonText} />
            ) : (
              <Text style={[commonStyles.buttonText, { color: currentTheme.buttonText }]}>
                Submit Order
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              commonStyles.buttonOutline,
              {
                borderColor: currentTheme.primary,
                flex: 1,
                marginLeft: 8,
              }
            ]}
            onPress={() => navigation.navigate('OrderDetail', { orderId: createdOrder.id })}
          >
            <Text style={[commonStyles.buttonTextOutline, { color: currentTheme.primary }]}>
              View Order
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Regular Home Button - Always Visible */}
      <View style={styles.homeButtonContainer}>
        <HomeButton
          size="medium"
          showLabel={true}
          variant="filled"
          style={styles.homeButton}
        />
      </View>

      {/* Modals */}
      {renderBoothModal()}
      {renderItemModal()}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectionButtonText: {
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedItemDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedItemTax: {
    fontSize: 10,
    marginTop: 2,
  },
  selectedItemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '100%',
    minHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  // Booth modal styles
  boothItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  boothType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boothStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  boothLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  boothAddress: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Item modal styles
  itemContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
    overflow: 'hidden',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemType: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  itemDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  homeButtonContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  homeButton: {
    minWidth: 140,
  },
});
