import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const LoadingSpinner = ({ message, fullScreen = false, size = 'large' }) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.accent} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
