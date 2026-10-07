import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { display, useTheme } from '../lib/theme';

interface ToastOpts {
  message: string;
  emoji?: string;
  action?: { label: string; onPress: () => void };
  duration?: number;
}

const Ctx = createContext<(o: ToastOpts) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOpts & { key: number }) | null>(null);
  const [anim] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [anim]);

  const show = useCallback(
    (o: ToastOpts) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ ...o, key: Date.now() });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 90 }).start();
      timer.current = setTimeout(hide, o.duration ?? 4000);
    },
    [anim, hide],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            {
              bottom: insets.bottom + 18,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: t.toast }]}>
            {toast.emoji ? <Text style={styles.emoji}>{toast.emoji}</Text> : null}
            <Text style={[styles.msg, { color: t.onToast }]} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.action && (
              <Pressable
                hitSlop={10}
                onPress={() => {
                  toast.action!.onPress();
                  hide();
                }}
                style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.actionText, { color: t.accent }]}>{toast.action.label}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    maxWidth: 520,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  emoji: { fontSize: 20 },
  msg: { flex: 1, fontSize: 15, fontWeight: '600', fontFamily: display },
  action: { paddingHorizontal: 4 },
  actionText: { fontSize: 15, fontWeight: '800', fontFamily: display },
});
