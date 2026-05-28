import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRideHistory } from '../../store/slices/userSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDistance, formatShortAddress } from '../../utils/formatters';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const RideHistoryItem = ({ item }) => {
  const originAddress = item.origin?.address
    ? formatShortAddress(item.origin.address)
    : 'Unknown origin';
  const destinationAddress = item.destination?.address
    ? formatShortAddress(item.destination.address)
    : 'Unknown destination';

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.vehicleType}>{item.vehicleType || 'Economy'}</Text>
        <Text style={styles.fare}>{formatCurrency(item.fare)}</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, styles.originDot]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {originAddress}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, styles.destinationDot]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {destinationAddress}
          </Text>
        </View>
      </View>

      <View style={styles.itemFooter}>
        <Text style={styles.date}>
          {item.createdAt
            ? formatDate(
                item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt),
              )
            : 'Unknown date'}
        </Text>
        {item.distanceMeters ? (
          <Text style={styles.distance}>{formatDistance(item.distanceMeters)}</Text>
        ) : null}
      </View>
    </View>
  );
};

const RideHistoryScreen = () => {
  const dispatch = useDispatch();
  const { rideHistory, historyLoading } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);

  const loadHistory = useCallback(() => {
    if (user?.uid) {
      dispatch(fetchRideHistory(user.uid));
    }
  }, [dispatch, user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderItem = useCallback(({ item }) => <RideHistoryItem item={item} />, []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛣️</Text>
      <Text style={styles.emptyTitle}>No rides yet</Text>
      <Text style={styles.emptySubtitle}>
        Your completed rides will appear here.
      </Text>
    </View>
  );

  if (historyLoading && rideHistory.length === 0) {
    return <LoadingSpinner fullScreen message="Loading ride history..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.count}>
          {rideHistory.length} {rideHistory.length === 1 ? 'ride' : 'rides'}
        </Text>
      </View>

      <FlatList
        data={rideHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={historyLoading}
            onRefresh={loadHistory}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: colors.surface,
    ...theme.shadow.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
  },
  count: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  list: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadow.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  vehicleType: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: colors.primary,
    textTransform: 'capitalize',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
  },
  fare: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
  },
  route: {
    marginBottom: theme.spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  originDot: {
    backgroundColor: colors.success,
  },
  destinationDot: {
    backgroundColor: colors.accent,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  routeText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: colors.text,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: theme.spacing.sm,
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
  },
  distance: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default RideHistoryScreen;
