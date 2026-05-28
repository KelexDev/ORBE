import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import theme from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';

const VehicleCard = ({ vehicle, fare, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(vehicle.id)}
      style={[styles.card, isSelected && styles.selectedCard]}
      activeOpacity={0.85}>
      <View style={styles.leftSection}>
        <Text style={styles.icon}>{vehicle.icon}</Text>
        <View style={styles.info}>
          <Text style={[styles.label, isSelected && styles.selectedText]}>
            {vehicle.label}
          </Text>
          <Text style={styles.description}>{vehicle.description}</Text>
          <Text style={styles.wait}>{vehicle.estimatedWait} away</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.fare, isSelected && styles.selectedText]}>
          {formatCurrency(fare)}
        </Text>
        <Text style={styles.capacity}>Up to {vehicle.capacity} seats</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginVertical: theme.spacing.xs,
    ...theme.shadow.sm,
  },
  selectedCard: {
    borderColor: colors.accent,
    backgroundColor: '#FFF5F7',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
  },
  description: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  wait: {
    fontSize: theme.fontSize.xs,
    color: colors.success,
    marginTop: 2,
    fontWeight: theme.fontWeight.medium,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  fare: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
  },
  capacity: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedText: {
    color: colors.accent,
  },
});

export default VehicleCard;
