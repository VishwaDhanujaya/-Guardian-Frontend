import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";
import { View } from "react-native";

type Variant = "success" | "error" | "info";
type ToastData = {
  id: number;
  title?: string;
  message: string;
  variant?: Variant;
  duration?: number; // ms
};

// Simple pub/sub so you can call toast.success(...) from anywhere
let subs = new Set<(t: ToastData) => void>();
let _id = 0;

export const toast = {
  show(opts: Omit<ToastData, "id">) {
    const t: ToastData = { id: ++_id, duration: 2500, variant: "info", ...opts };
    subs.forEach((fn) => fn(t));
  },
  success(message: string, title = "Success") {
    toast.show({ message, title, variant: "success" });
  },
  error(message: string, title = "Error") {
    toast.show({ message, title, variant: "error" });
  },
  info(message: string, title = "Info") {
    toast.show({ message, title, variant: "info" });
  },
};

export function ToastOverlay() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    const handler = (t: ToastData) => {
      setItems((prev) => [...prev, t]);
      const d = t.duration ?? 2500;
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, d);
    };
    subs.add(handler);
    return () => {
      subs.delete(handler);
    };
  }, []);

  const barClass = (v?: Variant) =>
    v === "success" ? "bg-ring" : v === "error" ? "bg-destructive" : "bg-foreground";

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, top: 20, alignItems: "center" }}
    >
      <View className="w-[92%] max-w-[520px] gap-2">
        {items.map((t) => (
          <View
            key={t.id}
            className="flex-row items-start bg-background border border-border rounded-xl px-3 py-2 shadow"
          >
            <View className={`w-1.5 mr-3 rounded-full ${barClass(t.variant)}`} />
            <View className="flex-1">
              {t.title ? (
                <Text className="text-sm font-semibold text-foreground">{t.title}</Text>
              ) : null}
              <Text className="text-xs text-muted-foreground mt-0.5">{t.message}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
