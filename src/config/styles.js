import { StyleSheet } from 'react-native';
import { colors, semanticColors } from './colors';

// Common component styles using your color palette
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  containerPrimary: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Text styles
  heading1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.blue,
    marginBottom: 16,
  },

  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.blue,
    marginBottom: 12,
  },

  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.blue,
    marginBottom: 8,
  },

  bodyText: {
    fontSize: 16,
    color: colors.black,
    lineHeight: 24,
  },

  smallText: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },

  // Button styles
  buttonPrimary: {
    backgroundColor: colors.red,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonSecondary: {
    backgroundColor: colors.blue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonSuccess: {
    backgroundColor: colors.mint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.red,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  buttonTextOutline: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '600',
  },

  // Input styles
  input: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.black,
  },

  inputFocused: {
    borderColor: colors.red,
    backgroundColor: colors.white,
  },

  inputError: {
    borderColor: colors.red,
    backgroundColor: colors.redTransparent,
  },

  // Status styles
  successBadge: {
    backgroundColor: colors.mint,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  warningBadge: {
    backgroundColor: colors.orange,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  errorBadge: {
    backgroundColor: colors.red,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Layout styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Spacing utilities
  marginSmall: { margin: 8 },
  marginMedium: { margin: 16 },
  marginLarge: { margin: 24 },

  paddingSmall: { padding: 8 },
  paddingMedium: { padding: 16 },
  paddingLarge: { padding: 24 },

  // Auth screen styles (moved from screenStyles for easier access)
  authContainer: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.blue,
    textAlign: 'center',
    marginBottom: 24,
  },

  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.blue,
    marginBottom: 8,
  },
});

// Screen-specific styles (additional styles that don't belong in commonStyles)
export const screenStyles = StyleSheet.create({
  // Add any screen-specific styles here if needed in the future
});

export default { commonStyles, screenStyles };
