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
import { COLORS } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Square crop box inset from screen edges
const CROP_SIZE = SCREEN_WIDTH - 0; // full width square crop

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false); // show grid only while touching

  // Animated pan & scale on native thread (60 fps)
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;

  // Refs for live gesture math (avoids calling getValue())
  const currentPan = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);
  const startPan = useRef({ x: 0, y: 0 });
  const startScale = useRef(1);
  const initialPinchDist = useRef<number | null>(null);
  const pinchCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const lastTap = useRef(0);
  const gestureTouchCount = useRef(0);

  useEffect(() => {
    const pId = pan.addListener((v) => { currentPan.current = v; });
    const sId = scale.addListener(({ value }) => { currentScale.current = value; });
    return () => { pan.removeListener(pId); scale.removeListener(sId); };
  }, [pan, scale]);

  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      currentPan.current = { x: 0, y: 0 };
      currentScale.current = 1;
      isPinching.current = false;
      initialPinchDist.current = null;
    }
  }, [visible, imageUri]);

  const dist = (touches: readonly any[]) => {
    const [a, b] = touches;
    return Math.sqrt(Math.pow(a.pageX - b.pageX, 2) + Math.pow(a.pageY - b.pageY, 2));
  };

  const mid = (touches: readonly any[]) => ({
    x: (touches[0].pageX + touches[1].pageX) / 2,
    y: (touches[0].pageY + touches[1].pageY) / 2,
  });

  const showGrid = () => {
    setIsGesturing(true);
    Animated.timing(gridOpacity, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  };

  const hideGrid = () => {
    Animated.timing(gridOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setIsGesturing(false);
    });
  };

  // Elastic spring-back to stay within crop zone
  const springBack = () => {
    let tScale = Math.max(1, Math.min(currentScale.current, 5));
    const maxPanX = (SCREEN_WIDTH * (tScale - 1)) / 2;
    const maxPanY = (SCREEN_WIDTH * (tScale - 1)) / 2;

    const tX = Math.max(-maxPanX, Math.min(currentPan.current.x, maxPanX));
    const tY = Math.max(-maxPanY, Math.min(currentPan.current.y, maxPanY));

    Animated.parallel([
      Animated.spring(scale, { toValue: tScale, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(pan, { toValue: { x: tX, y: tY }, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        showGrid();
        startPan.current = { ...currentPan.current };
        startScale.current = currentScale.current;
        gestureTouchCount.current = evt.nativeEvent.touches.length;

        if (evt.nativeEvent.touches.length >= 2) {
          isPinching.current = true;
          initialPinchDist.current = dist(evt.nativeEvent.touches);
          pinchCenter.current = mid(evt.nativeEvent.touches);
        } else {
          isPinching.current = false;
          initialPinchDist.current = null;
          // Double tap → toggle zoom
          const now = Date.now();
          if (now - lastTap.current < 280) {
            Animated.parallel([
              Animated.spring(scale, {
                toValue: currentScale.current > 1.2 ? 1 : 2.5,
                friction: 6, tension: 70, useNativeDriver: true,
              }),
              ...(currentScale.current > 1.2
                ? [Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 70, useNativeDriver: true })]
                : []),
            ]).start();
          }
          lastTap.current = now;
        }
      },

      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          // Initialize pinch if second finger joined mid-gesture
          if (!isPinching.current || initialPinchDist.current === null) {
            isPinching.current = true;
            initialPinchDist.current = dist(touches);
            startScale.current = currentScale.current;
            startPan.current = { ...currentPan.current };
            pinchCenter.current = mid(touches);
          }

          // Scale from raw finger distance
          const newDist = dist(touches);
          const factor = newDist / (initialPinchDist.current || newDist);
          scale.setValue(Math.max(0.8, Math.min(startScale.current * factor, 6)));

          // Pan from midpoint movement (no gestureState drift)
          const midPt = mid(touches);
          pan.setValue({
            x: startPan.current.x + (midPt.x - pinchCenter.current.x),
            y: startPan.current.y + (midPt.y - pinchCenter.current.y),
          });
        } else if (touches.length === 1) {
          if (isPinching.current) {
            // Re-anchor after lifting one finger
            isPinching.current = false;
            initialPinchDist.current = null;
            startPan.current = { ...currentPan.current };
            startScale.current = currentScale.current;
            return;
          }
          pan.setValue({
            x: startPan.current.x + gs.dx,
            y: startPan.current.y + gs.dy,
          });
        }
      },

      onPanResponderRelease: (evt) => {
        if (evt.nativeEvent.touches.length === 0) {
          isPinching.current = false;
          initialPinchDist.current = null;
          hideGrid();
          springBack();
        }
      },

      onPanResponderTerminate: () => {
        isPinching.current = false;
        initialPinchDist.current = null;
        hideGrid();
        springBack();
      },
    })
  ).current;

  const handleDone = () => {
    if (!imageUri) return;
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); onCropDone(imageUri); }, 280);
  };

  if (!imageUri) return null;

  const TOP_OVERLAY = (SCREEN_HEIGHT - CROP_SIZE) / 2 - 30;
  const BOTTOM_OVERLAY = (SCREEN_HEIGHT - CROP_SIZE) / 2 - 50;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>

        {/* ── Full-screen gesture area (image lives here) ── */}
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

          {/* Dark overlay ABOVE the crop box */}
          <View style={[styles.overlay, { height: TOP_OVERLAY, top: 0 }]} pointerEvents="none" />
          {/* Dark overlay BELOW the crop box */}
          <View style={[styles.overlay, { height: BOTTOM_OVERLAY, bottom: 0 }]} pointerEvents="none" />

          {/* ── Crop box frame centred on screen ── */}
          <View style={styles.cropFrame} pointerEvents="none">
            {/* White border */}
            <View style={styles.cropBorder} />

            {/* 3×3 Grid — fades in while touching, out on release */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: gridOpacity }]}>
              {/* Horizontal lines */}
              <View style={[styles.gridH, { top: CROP_SIZE / 3 }]} />
              <View style={[styles.gridH, { top: (CROP_SIZE / 3) * 2 }]} />
              {/* Vertical lines */}
              <View style={[styles.gridV, { left: CROP_SIZE / 3 }]} />
              <View style={[styles.gridV, { left: (CROP_SIZE / 3) * 2 }]} />
            </Animated.View>

            {/* WhatsApp-style thick corner handles (L-shape) */}
            {/* Top-Left */}
            <View style={[styles.handleH, { top: 0, left: 0 }]} />
            <View style={[styles.handleV, { top: 0, left: 0 }]} />
            {/* Top-Right */}
            <View style={[styles.handleH, { top: 0, right: 0 }]} />
            <View style={[styles.handleV, { top: 0, right: 0 }]} />
            {/* Bottom-Left */}
            <View style={[styles.handleH, { bottom: 0, left: 0 }]} />
            <View style={[styles.handleV, { bottom: 0, left: 0 }]} />
            {/* Bottom-Right */}
            <View style={[styles.handleH, { bottom: 0, right: 0 }]} />
            <View style={[styles.handleV, { bottom: 0, right: 0 }]} />

            {/* Edge mid-handles */}
            <View style={[styles.edgeHandleH, { top: -1.5, left: CROP_SIZE / 2 - 14 }]} />
            <View style={[styles.edgeHandleH, { bottom: -1.5, left: CROP_SIZE / 2 - 14 }]} />
            <View style={[styles.edgeHandleV, { left: -1.5, top: CROP_SIZE / 2 - 14 }]} />
            <View style={[styles.edgeHandleV, { right: -1.5, top: CROP_SIZE / 2 - 14 }]} />
          </View>
        </View>

        {/* ── Top bar ── */}
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
            {isProcessing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.doneTxt}>Choose</Text>}
          </Pressable>
        </View>

        {/* ── Bottom hint ── */}
        <View style={styles.bottomHint} pointerEvents="none">
          <Text style={styles.hintText}>Pinch to zoom • Drag to position</Text>
        </View>
      </View>
    </Modal>
  );
};

const HANDLE_THICK = 3;
const HANDLE_LEN = 22;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* Full-screen gesture surface */
  gestureArea: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,   // square image region
  },

  /* Dimmed areas outside the crop box */
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  /* The centred square crop frame */
  cropFrame: {
    position: 'absolute',
    width: CROP_SIZE,
    height: CROP_SIZE,
    alignSelf: 'center',
    top: (SCREEN_HEIGHT - CROP_SIZE) / 2 - 30,
  },

  /* Main border */
  cropBorder: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* 3×3 grid lines */
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  /* Corner handles – horizontal bar of L */
  handleH: {
    position: 'absolute',
    width: HANDLE_LEN,
    height: HANDLE_THICK,
    backgroundColor: '#FFFFFF',
  },
  /* Corner handles – vertical bar of L */
  handleV: {
    position: 'absolute',
    width: HANDLE_THICK,
    height: HANDLE_LEN,
    backgroundColor: '#FFFFFF',
  },

  /* Mid-edge handles */
  edgeHandleH: {
    position: 'absolute',
    width: 28,
    height: HANDLE_THICK,
    backgroundColor: '#FFFFFF',
  },
  edgeHandleV: {
    position: 'absolute',
    width: HANDLE_THICK,
    height: 28,
    backgroundColor: '#FFFFFF',
  },

  /* Top bar (sits over the gesture area) */
  topBar: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  navBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  cancelText: { color: '#E2E8F0', fontSize: 16, fontWeight: '500' },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  doneTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  /* Bottom hint */
  bottomHint: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
