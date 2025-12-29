import React, { createContext, useContext, useRef, useEffect } from "react";
import { path } from "../utils/path";
import { useAuth } from "../auth/AuthContext";
import { useAuthFetch } from "../auth/useAuthFetch";
import { getDeviceId } from "../utils/device";

// 定義互動類型（對應後端 DTO）
type Interaction = { shopId: string; type: string; value: number };

const InteractionContext = createContext<{
  addInteraction: (shopId: string, type: string, value?: number) => void;
} | null>(null);

export const InteractionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queue = useRef<Interaction[]>([]);
  const { activeUserRef } = useAuth();
  const { authedFetch } = useAuthFetch();

  const flush = async () => {
    if (queue.current.length === 0) return;

    const deviceId = getDeviceId();

    const payload = {
      interactions: [...queue.current],
      deviceId,
    };
    queue.current = [];

    try {
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      let res = undefined;
      if (activeUserRef.current) {
        res = await authedFetch(path("/api/interactions/batch"), options);
      } else {
        const r = await fetch(path("/api/interactions/batch"), options);
        res = r.json();
      }
      if (!res.success) {
        throw new Error(res.error.code);
      }
    } catch (e) {
      console.error("Failed to flush interactions", e);
    }
  };

  useEffect(() => {
    const timer = setInterval(flush, 5000); // 全局唯一的定時器
    return () => {
      clearInterval(timer);
      flush(); // 元件卸載時最後衝刺發送一次
    };
  }, []);

  const addInteraction = (shopId: string, type: string, value: number = 1) => {
    queue.current.push({ shopId, type, value });
  };

  return (
    <InteractionContext.Provider value={{ addInteraction }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteraction = () => {
  const context = useContext(InteractionContext);
  if (!context)
    throw new Error("useInteraction must be used within InteractionProvider");
  return context;
};
