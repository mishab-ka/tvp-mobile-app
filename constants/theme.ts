/**
 * UI theme matching the car booking / ride-sharing reference:
 * Lime green primary, white backgrounds, dark grey text.
 */
export const theme = {
  primary: '#84cc16',       // vibrant lime green - buttons, active tabs
  primaryDark: '#65a30d',   // darker lime - pressed state
  background: '#ffffff',
  backgroundSecondary: '#f8faf5', // very light green tint
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  card: '#ffffff',
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#d97706',
  error: '#dc2626',
  errorLight: '#fef2f2',
  inactive: '#6b7280',
};

/** Card style: border only, no shadow (consistent on Android & iOS) */
export const cardStyle = {
  backgroundColor: theme.card,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: theme.border,
  padding: 20,
  marginBottom: 16,
};
