import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { COLORS, useColors } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Square crop frame size
const CROP_SIZE = SCREEN_WIDTH - 24; // 12px inset from each side for a clean WhatsApp-like crop box
const MIN_SCALE = 1.0;
const MAX_SCALE = 5.0;

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onCropDone: (croppedUri: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropDone,
}) => {
  const COLORS = useColors();
  const styles = makeStyles(COLORS);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animated values
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;

  // Real-time tracking refs (synced via listeners)
  const currentPan = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  // Incremental gesture tracking refs
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const lastMidPoint = useRef<{ x: number; y: number } | null>(null);
  const lastTapTime = useRef<number>(0);

  useEffect(() => {
    const pId = pan.addListener((v) => { currentPan.current = v; });
    const sId = scale.addListener(({ value }) => { currentScale.current = value; });
    return () => {
      pan.removeListener(pId);
      scale.removeListener(sId);
    };
  }, [pan, scale]);

  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      currentPan.current = { x: 0, y: 0 };
      currentScale.current = 1;
      lastTouchPos.current = null;
      lastPinchDist.current = null;
      lastMidPoint.current = null;
    }
  }, [visible, imageUri]);

  const calcDist = (t1: any, t2: any) => {
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calcMid = (t1: any, t2: any) => ({
    x: (t1.pageX + t2.pageX) / 2,
    y: (t1.pageY + t2.pageY) / 2,
  });

  const showGrid = () => {
    Animated.timing(gridOpacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const hideGrid = () => {
    Animated.timing(gridOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // WhatsApp-style elastic spring-back to keep image inside crop boundary
  const springBack = () => {
    let targetScale = currentScale.current;
    if (targetScale < MIN_SCALE) {
      targetScale = MIN_SCALE;
    } else if (targetScale > MAX_SCALE) {
      targetScale = MAX_SCALE;
    }

    const maxPanX = (CROP_SIZE * (targetScale - 1)) / 2;
    const maxPanY = (CROP_SIZE * (targetScale - 1)) / 2;

    let targetX = currentPan.current.x;
    let targetY = currentPan.current.y;

    if (targetScale <= MIN_SCALE) {
      targetX = 0;
      targetY = 0;
    } else {
      targetX = Math.max(-maxPanX, Math.min(targetX, maxPanX));
      targetY = Math.max(-maxPanY, Math.min(targetY, maxPanY));
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.spring(pan, {
        toValue: { x: targetX, y: targetY },
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,

      onPanResponderGrant: (evt) => {
        showGrid();
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          lastPinchDist.current = calcDist(touches[0], touches[1]);
          lastMidPoint.current = calcMid(touches[0], touches[1]);
          lastTouchPos.current = null;
        } else if (touches.length === 1) {
          lastTouchPos.current = { x: touches[0].pageX, y: touches[0].pageY };
          lastPinchDist.current = null;
          lastMidPoint.current = null;

          // Double tap to toggle zoom
          const now = Date.now();
          if (now - lastTapTime.current < 280) {
            if (currentScale.current > 1.2) {
              Animated.parallel([
                Animated.spring(scale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
                Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 70, useNativeDriver: true }),
              ]).start();
            } else {
              Animated.spring(scale, { toValue: 2.2, friction: 6, tension: 70, useNativeDriver: true }).start();
            }
          }
          lastTapTime.current = now;
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          // ── Two-finger Pinch-to-Zoom & Pan ──
          const currentDist = calcDist(touches[0], touches[1]);
          const currentMid = calcMid(touches[0], touches[1]);

          // Incremental Scale multiplier (super smooth, 100% reliable)
          if (lastPinchDist.current !== null && lastPinchDist.current > 0) {
            const scaleMultiplier = currentDist / lastPinchDist.current;
            const newScale = Math.max(0.6, Math.min(currentScale.current * scaleMultiplier, 6.5));
            scale.setValue(newScale);
            currentScale.current = newScale;
          }

          // Incremental Midpoint Pan
          if (lastMidPoint.current !== null) {
            const dx = currentMid.x - lastMidPoint.current.x;
            const dy = currentMid.y - lastMidPoint.current.y;
            const nextX = currentPan.current.x + dx;
            const nextY = currentPan.current.y + dy;
            pan.setValue({ x: nextX, y: nextY });
            currentPan.current = { x: nextX, y: nextY };
          }

          lastPinchDist.current = currentDist;
          lastMidPoint.current = currentMid;
          lastTouchPos.current = null;
        } else if (touches.length === 1) {
          // ── Single-finger Pan / Drag ──
          const currentX = touches[0].pageX;
          const currentY = touches[0].pageY;

          if (lastTouchPos.current !== null) {
            const dx = currentX - lastTouchPos.current.x;
            const dy = currentY - lastTouchPos.current.y;
            const nextX = currentPan.current.x + dx;
            const nextY = currentPan.current.y + dy;
            pan.setValue({ x: nextX, y: nextY });
            currentPan.current = { x: nextX, y: nextY };
          }

          lastTouchPos.current = { x: currentX, y: currentY };
          lastPinchDist.current = null;
          lastMidPoint.current = null;
        }
      },

      onPanResponderRelease: (evt) => {
        if (evt.nativeEvent.touches.length === 0) {
          lastTouchPos.current = null;
          lastPinchDist.current = null;
          lastMidPoint.current = null;
          hideGrid();
          springBack();
        }
      },

      onPanResponderTerminate: () => {
        lastTouchPos.current = null;
        lastPinchDist.current = null;
        lastMidPoint.current = null;
        hideGrid();
        springBack();
      },
    })
  ).current;

  const handleDone = () => {
    if (!imageUri) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onCropDone(imageUri);
    }, 280);
  };

  if (!imageUri) return null;

  const topOverlayHeight = (SCREEN_HEIGHT - CROP_SIZE) / 2 - 20;
  const bottomOverlayHeight = (SCREEN_HEIGHT - CROP_SIZE) / 2 - 40;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Full-screen gesture surface */}
        <View style={styles.gestureArea} {...panResponder.panHandlers}>
          <Animated.Image
            source={{ uri: imageUri }}
            style={[
              styles.fullImage,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scale },
                ],
              },
            ]}
            resizeMode="contain"
          />

          {/* Dimmed backdrop outside the crop frame */}
          <View style={[styles.darkOverlay, { top: 0, height: topOverlayHeight }]} pointerEvents="none" />
          <View style={[styles.darkOverlay, { bottom: 0, height: bottomOverlayHeight }]} pointerEvents="none" />

          {/* ── WhatsApp-style Square Crop Frame with 3x3 Grid ── */}
          <View style={styles.cropBox} pointerEvents="none">
            {/* White frame outline */}
            <View style={styles.cropBorder} />

            {/* 3x3 Rule-of-Thirds Grid (visible while gesturing) */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: gridOpacity }]}>
              <View style={[styles.gridH, { top: CROP_SIZE / 3 }]} />
              <View style={[styles.gridH, { top: (CROP_SIZE / 3) * 2 }]} />
              <View style={[styles.gridV, { left: CROP_SIZE / 3 }]} />
              <View style={[styles.gridV, { left: (CROP_SIZE / 3) * 2 }]} />
            </Animated.View>

            {/* Thick L-shaped Corner Handles (WhatsApp signature style) */}
            {/* Top-Left */}
            <View style={[styles.cornerH, { top: 0, left: 0 }]} />
            <View style={[styles.cornerV, { top: 0, left: 0 }]} />
            {/* Top-Right */}
            <View style={[styles.cornerH, { top: 0, right: 0 }]} />
            <View style={[styles.cornerV, { top: 0, right: 0 }]} />
            {/* Bottom-Left */}
            <View style={[styles.cornerH, { bottom: 0, left: 0 }]} />
            <View style={[styles.cornerV, { bottom: 0, left: 0 }]} />
            {/* Bottom-Right */}
            <View style={[styles.cornerH, { bottom: 0, right: 0 }]} />
            <View style={[styles.cornerV, { bottom: 0, right: 0 }]} />

            {/* Mid-edge handle indicators */}
            <View style={[styles.midHandleH, { top: -1.5, left: CROP_SIZE / 2 - 14 }]} />
            <View style={[styles.midHandleH, { bottom: -1.5, left: CROP_SIZE / 2 - 14 }]} />
            <View style={[styles.midHandleV, { left: -1.5, top: CROP_SIZE / 2 - 14 }]} />
            <View style={[styles.midHandleV, { right: -1.5, top: CROP_SIZE / 2 - 14 }]} />
          </View>
        </View>

        {/* ── Top Navigation Bar ── */}
        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable onPress={onClose} hitSlop={16} style={styles.navBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Move and Scale</Text>
          <Pressable
            onPress={handleDone}
            hitSlop={16}
            style={[styles.doneBtn, isProcessing && { opacity: 0.6 }]}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.doneTxt}>Choose</Text>
            )}
          </Pressable>
        </View>

        {/* ── Bottom instruction hint ── */}
        <View style={styles.bottomHint} pointerEvents="none">
          <Text style={styles.hintText}>Pinch with 2 fingers to zoom • Drag to move</Text>
        </View>
      </View>
    </Modal>
  );
};

const CORNER_THICK = 3.5;
const CORNER_LEN = 22;

const makeStyles = (COLORS: ReturnType<typeof useColors>) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gestureArea: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: CROP_SIZE,
    height: CROP_SIZE,
  },
  darkOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  cropBox: {
    position: 'absolute',
    width: CROP_SIZE,
    height: CROP_SIZE,
    alignSelf: 'center',
    top: (SCREEN_HEIGHT - CROP_SIZE) / 2 - 20,
  },
  cropBorder: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  cornerH: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_THICK,
    backgroundColor: '#FFFFFF',
  },
  cornerV: {
    position: 'absolute',
    width: CORNER_THICK,
    height: CORNER_LEN,
    backgroundColor: '#FFFFFF',
  },
  midHandleH: {
    position: 'absolute',
    width: 28,
    height: CORNER_THICK,
    backgroundColor: '#FFFFFF',
  },
  midHandleV: {
    position: 'absolute',
    width: CORNER_THICK,
    height: 28,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  navBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  doneTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
