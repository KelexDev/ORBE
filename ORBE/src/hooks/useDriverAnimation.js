import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { updateDriverLocation } from '../store/slices/rideSlice';
import { RIDE_STATUS } from '../constants/vehicleTypes';
import { getDirections } from '../services/googleMapsService';

// ── Math helpers ──────────────────────────────────────────────────────────────

/** Compass bearing (0–360°) from start → end. */
export const getBearing = (start, end) => {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const dLon = ((end.longitude - start.longitude) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const lerp = (a, b, t) => ({
  latitude:  a.latitude  + (b.latitude  - a.latitude)  * t,
  longitude: a.longitude + (b.longitude - a.longitude) * t,
});

/** Random starting point ~radiusDeg away in a random direction. */
const randomNearby = (center, radiusDeg = 0.012) => {
  const angle = Math.random() * 2 * Math.PI;
  return {
    latitude:  center.latitude  + radiusDeg * Math.sin(angle),
    longitude: center.longitude + radiusDeg * Math.cos(angle),
  };
};

/**
 * Reduce a polyline to at most maxPoints while always keeping
 * the first and last coordinate.
 */
const thinPath = (coords, maxPoints = 50) => {
  if (!coords || coords.length <= maxPoints) return coords;
  const result = [coords[0]];
  const step = (coords.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    result.push(coords[Math.round(i * step)]);
  }
  result.push(coords[coords.length - 1]);
  return result;
};

/** Straight-line fallback path when Directions API is unavailable. */
const straightPath = (start, end, points = 8) => {
  const path = [];
  for (let i = 0; i <= points; i++) {
    path.push(lerp(start, end, i / points));
  }
  return path;
};

// ── Animation engine ──────────────────────────────────────────────────────────

/** Target interval between position updates (ms). ~12 fps is smooth on mobile. */
const TARGET_TICK_MS = 80;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Animates a driver marker through the full ride lifecycle.
 *
 * Phase 1 (DRIVER_FOUND):
 *   Fetches a REAL Google Directions route from a nearby random start → pickup,
 *   so the driver follows actual streets while approaching.
 *
 * Phase 2 (IN_PROGRESS):
 *   Uses the routeCoordinates already stored in Redux (fetched by RideRequestScreen)
 *   so the driver follows the exact road route to the destination.
 *
 * Returns: { driverPos, driverBearing, etaSeconds }
 */
const useDriverAnimation = (rideStatus, origin, destination, routeCoordinates = []) => {
  const dispatch = useDispatch();
  const [driverPos,     setDriverPos]     = useState(null);
  const [driverBearing, setDriverBearing] = useState(0);
  const [etaSeconds,    setEtaSeconds]    = useState(null);
  const tickRef = useRef(null);

  // ── Stop any running animation ────────────────────────────────────────────
  const stopAnimation = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  /**
   * Animate through pathPoints over totalDurationMs.
   * Automatically computes steps-per-segment to keep each tick near TARGET_TICK_MS.
   */
  const animatePath = useCallback(
    (pathPoints, totalDurationMs, onComplete) => {
      stopAnimation();
      if (!pathPoints || pathPoints.length < 2) {
        onComplete?.();
        return;
      }

      const segCount       = pathPoints.length - 1;
      const idealTicks     = Math.ceil(totalDurationMs / TARGET_TICK_MS);
      const stepsPerSeg    = Math.max(1, Math.ceil(idealTicks / segCount));
      const totalSteps     = segCount * stepsPerSeg;
      const interval       = Math.max(totalDurationMs / totalSteps, 16);

      let step = 0;

      tickRef.current = setInterval(() => {
        if (step >= totalSteps) {
          stopAnimation();
          const last = pathPoints[pathPoints.length - 1];
          setDriverPos(last);
          dispatch(updateDriverLocation(last));
          setEtaSeconds(0);
          onComplete?.();
          return;
        }

        const segIdx    = Math.floor(step / stepsPerSeg);
        const stepInSeg = step % stepsPerSeg;
        const t         = stepInSeg / stepsPerSeg;

        const segStart = pathPoints[segIdx];
        const segEnd   = pathPoints[Math.min(segIdx + 1, pathPoints.length - 1)];
        const pos      = lerp(segStart, segEnd, t);
        const bearing  = getBearing(segStart, segEnd);

        setDriverPos(pos);
        setDriverBearing(bearing);
        dispatch(updateDriverLocation(pos));

        const remaining = totalSteps - step;
        setEtaSeconds(Math.round((remaining * interval) / 1000));

        step += 1;
      }, interval);
    },
    [dispatch, stopAnimation],
  );

  // ── Phase 1: Driver found → approaches pickup via REAL road route ─────────
  useEffect(() => {
    if (rideStatus !== RIDE_STATUS.DRIVER_FOUND || !origin) return;

    let cancelled = false;

    const start = randomNearby(origin, 0.013); // ~1.3 km away

    // Show driver immediately at the starting position
    setDriverPos(start);
    dispatch(updateDriverLocation(start));

    const run = async () => {
      // Small delay so the map can pan to the driver before animation starts
      await new Promise((res) => setTimeout(res, 800));
      if (cancelled) return;

      let approachPath;
      try {
        // Fetch the REAL road route from the driver's start to the pickup
        const routeData = await getDirections(start, origin);
        approachPath = thinPath(routeData.coordinates, 50);
      } catch {
        // Fallback: straight line if Directions API fails
        approachPath = straightPath(start, origin, 12);
      }

      if (cancelled) return;

      animatePath(approachPath, 22000, () => {
        if (!cancelled) {
          setDriverPos(origin);
          dispatch(updateDriverLocation(origin));
        }
      });
    };

    run();

    return () => {
      cancelled = true;
      stopAnimation();
    };
  }, [rideStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 2: In progress → follows REAL road route to destination ─────────
  useEffect(() => {
    if (rideStatus !== RIDE_STATUS.IN_PROGRESS || !origin || !destination) return;

    let cancelled = false;

    const run = async () => {
      let path;

      if (routeCoordinates && routeCoordinates.length >= 4) {
        // Best case: use the route already fetched in RideRequestScreen
        path = thinPath(routeCoordinates, 50);
      } else {
        // Fallback: fetch now if somehow not in Redux yet
        try {
          const routeData = await getDirections(origin, destination);
          path = thinPath(routeData.coordinates, 50);
        } catch {
          path = straightPath(origin, destination, 12);
        }
      }

      if (cancelled) return;

      animatePath(path, 38000, () => {
        if (!cancelled) {
          setDriverPos(destination);
          dispatch(updateDriverLocation(destination));
        }
      });
    };

    run();

    return () => {
      cancelled = cancelled || true;
      stopAnimation();
    };
  }, [rideStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop on cancelled / completed ────────────────────────────────────────
  useEffect(() => {
    if (rideStatus === RIDE_STATUS.CANCELLED || rideStatus === RIDE_STATUS.COMPLETED) {
      stopAnimation();
      if (rideStatus === RIDE_STATUS.CANCELLED) {
        setDriverPos(null);
        setEtaSeconds(null);
      }
    }
  }, [rideStatus, stopAnimation]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  return { driverPos, driverBearing, etaSeconds };
};

export default useDriverAnimation;
