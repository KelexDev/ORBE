export const VEHICLE_TYPES = {
  ECONOMY: 'economy',
  XL: 'xl',
  PREMIUM: 'premium',
};

export const VEHICLE_CONFIG = [
  {
    id: VEHICLE_TYPES.ECONOMY,
    label: 'Economy',
    description: 'Affordable everyday rides',
    icon: '🚗',
    baseRate: 1.0,
    baseFare: 1.5,
    perKmRate: 0.9,
    perMinRate: 0.12,
    capacity: 4,
    estimatedWait: '3-5 min',
  },
  {
    id: VEHICLE_TYPES.XL,
    label: 'XL',
    description: 'Extra space for groups',
    icon: '🚐',
    baseRate: 1.5,
    baseFare: 2.5,
    perKmRate: 1.4,
    perMinRate: 0.18,
    capacity: 6,
    estimatedWait: '5-8 min',
  },
  {
    id: VEHICLE_TYPES.PREMIUM,
    label: 'Premium',
    description: 'Luxury travel experience',
    icon: '🚙',
    baseRate: 2.2,
    baseFare: 4.0,
    perKmRate: 2.1,
    perMinRate: 0.28,
    capacity: 4,
    estimatedWait: '7-10 min',
  },
];

export const RIDE_STATUS = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  DRIVER_FOUND: 'driver_found',
  DRIVER_APPROACHING: 'driver_approaching',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};
