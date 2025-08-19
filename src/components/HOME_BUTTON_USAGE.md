# Home Button Components Usage Guide

This project includes two home button components that provide easy navigation back to the home screen:

## Components

### 1. HomeButton.js
A standard button component that can be integrated into any screen layout.

**Props:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `showLabel`: boolean (default: false) - Shows "Home" text below icon
- `style`: Custom styles to override defaults

**Usage:**
```javascript
import HomeButton from '../components/HomeButton';

// Basic usage
<HomeButton />

// With custom size and label
<HomeButton size="large" showLabel={true} />

// With custom styling
<HomeButton
  size="small"
  style={{ marginTop: 10 }}
/>
```

### 2. FloatingHomeButton.js
A floating action button that overlays on top of screen content.

**Props:**
- `position`: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center' (default: 'bottom-right')
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `showOnHome`: boolean (default: false) - Whether to show on Home screen
- `style`: Custom styles to override defaults

**Usage:**
```javascript
import FloatingHomeButton from '../components/FloatingHomeButton';

// Basic usage (appears in bottom-right corner)
<FloatingHomeButton />

// Custom position and size
<FloatingHomeButton
  position="bottom-left"
  size="large"
/>

// Show on all screens including Home
<FloatingHomeButton
  position="top-right"
  showOnHome={true}
/>
```

## Implementation Examples

### Adding to CreateOrderScreen
```javascript
import FloatingHomeButton from '../components/FloatingHomeButton';

export default function CreateOrderScreen() {
  return (
    <ScrollView>
      {/* Your screen content */}

      <FloatingHomeButton position="bottom-right" size="medium" />
    </ScrollView>
  );
}
```

### Adding to CustomerOrderScreen
```javascript
import FloatingHomeButton from '../components/FloatingHomeButton';

export default function CustomerOrderScreen() {
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Your screen content */}

        <FloatingHomeButton position="bottom-left" size="small" />
      </ScrollView>
    </View>
  );
}
```

### Using Regular HomeButton in Layout
```javascript
import HomeButton from '../components/HomeButton';

export default function SomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Your screen content */}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <HomeButton size="medium" showLabel={true} />
      </View>
    </View>
  );
}
```

## Features

### Automatic Hide on Home Screen
The `FloatingHomeButton` automatically hides when the user is on the Home screen (unless `showOnHome={true}` is specified).

### Theme Integration
Both components use the app's theme system and will automatically adapt to light/dark themes.

### Navigation Integration
Both components use React Navigation's `useNavigation` hook to navigate to the 'Home' screen.

### Customizable Positioning
The `FloatingHomeButton` supports 5 different positions:
- `top-left`: Upper left corner
- `top-right`: Upper right corner
- `bottom-left`: Lower left corner
- `bottom-right`: Lower right corner (default)
- `bottom-center`: Bottom center

### Size Variants
Both components support 3 sizes:
- `small`: Compact size for minimal interface intrusion
- `medium`: Standard size (default)
- `large`: Prominent size for better visibility

## Best Practices

1. **Use FloatingHomeButton** for screens where you want unobtrusive navigation
2. **Use HomeButton** when you want the button to be part of the screen layout
3. **Choose position wisely** - avoid blocking important content
4. **Use small size** for screens with limited space
5. **Consider showOnHome** property based on your app's navigation flow

## Current Implementation

The following screens already have FloatingHomeButton implemented:
- `CreateOrderScreen` - bottom-right, medium size
- `CustomerOrderScreen` - bottom-left, small size

To add to other screens, simply import the component and add it to your JSX with desired props.
