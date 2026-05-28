import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import theme from '../../constants/theme';
import { formatCurrency, formatDistance, formatDuration } from '../../utils/formatters';

const FareEstimate = ({ fare, distanceMeters, durationSeconds, vehicleLabel }) => {
  if (!fare) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fare Estimate</Text>
      <Text style={styles.fareAmount}>{formatCurrency(fare)}</Text>
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{formatDistance(distanceMeters)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{formatDuration(durationSeconds)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Vehicle</Text>
          <Text style={styles.detailValue}>{vehicleLabel}</Text>
        </View>
      </View>
      <Text style={styles.disclaimer}>
        Final fare may vary based on traffic and actual route.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadow.sm,
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  fareAmount: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  disclaimer: {
    fontSize: theme.fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default FareEstimate;
