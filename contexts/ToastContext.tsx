// ToastContext.tsx
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
          setMessage(null);
        });
      }, 1500);
    });
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {visible && message && (
        <View pointerEvents="none" style={styles.wrapper}>
          <Animated.View style={[styles.toast, { opacity }]}>
            <Text style={styles.toastText}>{message}</Text>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});
