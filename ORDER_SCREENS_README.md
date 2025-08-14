# Order Management Screens

This document describes the Order Management screens created for the AHA Karaoke application.

## Overview

Three main screens have been created to handle order management:

1. **CustomerOrderScreen** - For customers to view their orders
2. **StaffOrderScreen** - For staff/admin to manage all orders
3. **OrderDetailScreen** - Detailed view of individual orders

## Features

### Customer Order Screen (`CustomerOrderScreen.js`)

**Purpose**: Allows customers to view and manage their own orders.

**Features**:
- View all personal orders with status filtering
- Filter orders by status (All, Pending, Confirmed, Processing, Ready, Completed)
- Pull-to-refresh functionality
- Cancel orders (for draft, pending, confirmed status)
- Navigate to order details
- Create new orders button
- Responsive design with ScrollView

**Key Components**:
- Horizontal filter buttons with ScrollView
- Order cards with status badges
- Empty state with call-to-action
- Cancellation functionality with confirmation dialog

### Staff Order Screen (`StaffOrderScreen.js`)

**Purpose**: Allows staff and admin to manage all orders in the system.

**Features**:
- View all orders from all customers
- Filter orders by status
- Update order status through the workflow
- Set estimated preparation time when confirming orders
- Cancel orders with reason
- Customer information display
- Real-time status management

**Key Components**:
- Status transition buttons
- Modal for estimated time input
- Customer and booth information display
- Action buttons for status updates

### Order Detail Screen (`OrderDetailScreen.js`)

**Purpose**: Provides detailed view of individual orders for both customers and staff.

**Features**:
- Complete order information display
- Order items breakdown with pricing
- Status timeline visualization
- Payment information
- Customer information (for staff)
- Booth details
- Notes and special instructions
- Submit/Cancel actions based on permissions

**Key Components**:
- Status timeline with visual indicators
- Itemized order breakdown
- Payment status display
- Role-based action buttons

## API Integration

All screens integrate with the backend API using the following endpoints:

- `GET /orders` - Fetch orders with optional filters
- `GET /orders/:id` - Fetch specific order details
- `PUT /orders/:id/status` - Update order status
- `PUT /orders/:id/submit` - Submit draft order
- `PUT /orders/:id/cancel` - Cancel order

## Navigation Structure

```
App.js
├── Login (headerShown: false)
├── Register (headerShown: false)
├── UserProfile (title: 'Profile')
├── CustomerOrders (title: 'My Orders')
├── StaffOrders (title: 'Manage Orders')
└── OrderDetail (title: 'Order Details')
```

## Role-Based Access

The screens implement role-based access control:

- **Customers**: Can only see their own orders and have limited actions
- **Staff/Admin**: Can see all orders and perform status updates

## UI/UX Features

### Responsive Design
- All screens use ScrollView for proper scrolling
- Horizontal scroll for filter buttons
- Pull-to-refresh functionality

### Theme Support
- Full support for light/dark themes
- Dynamic color adaptation
- Consistent with app-wide theme system

### Status Management
- Color-coded status badges
- Visual status timeline
- Clear action buttons for next steps

### Error Handling
- Network error handling
- User-friendly error messages
- Graceful fallbacks for missing data

## Utilities

### Order Utils (`orderUtils.js`)

Helper functions for order management:
- `handleApiError()` - Standardized error handling
- `formatCurrency()` - Indonesian Rupiah formatting
- `formatDate()` - Localized date formatting
- `getStatusDisplay()` - Status display mapping
- `getStatusColor()` - Status color mapping
- `orderApi` - Centralized API functions

## Usage Examples

### Navigation to Order Screens

From UserProfile:
```javascript
// For customers
navigation.navigate('CustomerOrders');

// For staff/admin
navigation.navigate('StaffOrders');
```

### Navigating to Order Details
```javascript
navigation.navigate('OrderDetail', { orderId: order.id });
```

## Best Practices

1. **Error Handling**: All API calls include proper error handling
2. **Loading States**: Loading indicators for better UX
3. **Confirmation Dialogs**: Important actions require user confirmation
4. **Responsive Design**: Works on different screen sizes
5. **Accessibility**: Proper text contrast and touch targets
6. **Performance**: Efficient re-rendering and data fetching

## Future Enhancements

Potential improvements for future versions:

1. **Real-time Updates**: WebSocket integration for live order updates
2. **Push Notifications**: Order status change notifications
3. **Order History Export**: Download order history as PDF/CSV
4. **Advanced Filtering**: Date range, customer search, amount filters
5. **Bulk Operations**: Multi-select for bulk status updates
6. **Order Analytics**: Charts and statistics for staff dashboard

## Installation and Setup

1. Ensure all screens are imported in `App.js`
2. Add navigation routes with proper screen options
3. Configure API endpoints in `envConfig.js`
4. Test with both customer and staff user accounts
5. Verify all status transitions work correctly

## Testing Checklist

- [ ] Customer can view their orders
- [ ] Staff can view all orders
- [ ] Filter functionality works
- [ ] Order details load correctly
- [ ] Status updates work properly
- [ ] Cancel functionality works
- [ ] Theme switching works
- [ ] Pull-to-refresh works
- [ ] Navigation between screens works
- [ ] Error handling displays correctly
