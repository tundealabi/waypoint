import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { lightCheckHaptic } from '@/lib/haptics';
import type { PackingItem } from '@/store';
import { colors, radius, spacing, swipeColors } from '@/theme';

const CHECK_THRESHOLD = 72;
const DELETE_THRESHOLD = 72;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function PackingRow({
  item,
  assigneeName,
  canMoveUp,
  canMoveDown,
  onTogglePacked,
  onDelete,
  onEdit,
  onMove,
}: {
  item: PackingItem;
  assigneeName?: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTogglePacked: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (_direction: -1 | 1) => void;
}) {
  useColorScheme();
  const x = useSharedValue(0);
  const context = useSharedValue(0);
  const width = useSharedValue(320);
  const packed = item.packed;

  useEffect(() => {
    x.set(0);
  }, [item.id, x]);

  const commitCheck = useCallback(() => {
    onTogglePacked();
    if (!packed) {
      lightCheckHaptic();
    }
  }, [onTogglePacked, packed]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-10, 10])
        .onStart(() => {
          context.set(x.get());
        })
        .onUpdate((event) => {
          x.set(context.get() + event.translationX);
        })
        .onEnd((event) => {
          const projected = x.get() + project(event.velocityX);
          if (projected > CHECK_THRESHOLD) {
            scheduleOnRN(commitCheck);
            x.set(withSpring(0, { duration: 300, dampingRatio: 1, velocity: event.velocityX }));
            return;
          }
          if (projected < -DELETE_THRESHOLD) {
            x.set(
              withTiming(-width.get(), { duration: 200, easing: EASE_OUT }, (finished) => {
                if (finished) {
                  scheduleOnRN(onDelete);
                }
              })
            );
            return;
          }
          x.set(withSpring(0, { duration: 300, dampingRatio: 1, velocity: event.velocityX }));
        }),
    [commitCheck, context, onDelete, width, x]
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  const details = [item.quantity, item.note, assigneeName].filter(Boolean).join(' · ');

  return (
    <View
      onLayout={(event) => {
        width.set(event.nativeEvent.layout.width);
      }}
      style={{
        borderRadius: radius.md,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: colors.secondarySystemGroupedBackground,
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: swipeColors.check,
            justifyContent: 'center',
            paddingLeft: spacing.md,
          }}
        >
          <ThemedText variant="headline" style={{ color: swipeColors.onAction }}>
            {item.packed ? 'Unpack' : 'Packed'}
          </ThemedText>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: swipeColors.delete,
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingRight: spacing.md,
          }}
        >
          <ThemedText variant="headline" style={{ color: swipeColors.onAction }}>
            Delete
          </ThemedText>
        </View>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            rowStyle,
            {
              minHeight: 56,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.secondarySystemGroupedBackground,
            },
          ]}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.packed }}
            accessibilityLabel={`${item.name}${item.packed ? ', packed' : ', not packed'}`}
            accessibilityActions={[
              { name: 'activate', label: item.packed ? 'Mark unpacked' : 'Mark packed' },
              { name: 'delete', label: 'Delete' },
            ]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'delete') {
                onDelete();
                return;
              }
              commitCheck();
            }}
            hitSlop={8}
            onPress={commitCheck}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: item.packed ? colors.systemGreen : colors.separator,
              backgroundColor: item.packed ? colors.systemGreen : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.packed ? (
              <ThemedText variant="caption" style={{ color: colors.onTint, fontWeight: '700' }}>
                ✓
              </ThemedText>
            ) : null}
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText
              variant="body"
              selectable
              style={{ textDecorationLine: item.packed ? 'line-through' : 'none' }}
            >
              {item.name}
            </ThemedText>
            {details ? (
              <ThemedText variant="caption" selectable>
                {details}
              </ThemedText>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Item actions"
            hitSlop={12}
            onPress={() =>
              openItemMenu(item, { canMoveUp, canMoveDown, commitCheck, onDelete, onEdit, onMove })
            }
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <ThemedText variant="headline" style={{ color: colors.secondaryLabel }}>
              ···
            </ThemedText>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function openItemMenu(
  item: PackingItem,
  options: {
    canMoveUp: boolean;
    canMoveDown: boolean;
    commitCheck: () => void;
    onDelete: () => void;
    onEdit: () => void;
    onMove: (_direction: -1 | 1) => void;
  }
) {
  const buttons: {
    text: string;
    style?: 'destructive' | 'cancel';
    onPress?: () => void;
  }[] = [
    { text: item.packed ? 'Mark unpacked' : 'Mark packed', onPress: options.commitCheck },
    { text: 'Edit', onPress: options.onEdit },
  ];
  if (options.canMoveUp) {
    buttons.push({ text: 'Move up', onPress: () => options.onMove(-1) });
  }
  if (options.canMoveDown) {
    buttons.push({ text: 'Move down', onPress: () => options.onMove(1) });
  }
  buttons.push(
    { text: 'Delete', style: 'destructive', onPress: options.onDelete },
    { text: 'Cancel', style: 'cancel' }
  );
  Alert.alert(item.name, undefined, buttons);
}
