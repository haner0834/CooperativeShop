import { createContext, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type PathHistoryContextType = {
  history: string[];
  previous: string | null;
  pushPath: (path: string) => void;
  goBack: (fallback?: string) => void;
};

const PathHistoryContext = createContext<PathHistoryContextType | null>(null);

export function PathHistoryProvider({
  children,
  fallback = "/",
}: {
  children: React.ReactNode;
  fallback?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const historyRef = useRef<string[]>([]);
  const lastPathRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const current = location.pathname + location.search;

    if (isFirstLoadRef.current) {
      lastPathRef.current = current;
      isFirstLoadRef.current = false;
      return;
    }

    if (current !== lastPathRef.current) {
      historyRef.current.push(lastPathRef.current!);
      lastPathRef.current = current;
    }
  }, [location.pathname, location.search]);

  const pushPath = (path: string) => {
    const current = lastPathRef.current;
    if (current && current !== path) {
      historyRef.current.push(current);
      lastPathRef.current = path;
    }
  };

  const goBack = (localFallback?: string) => {
    if (historyRef.current.length > 0) {
      const prev = historyRef.current.pop()!;
      navigate(prev, { replace: true });
      return;
    }

    // 沒有 history，使用 fallback
    const target = localFallback ?? fallback;
    navigate(target, { replace: true });
  };

  return (
    <PathHistoryContext.Provider
      value={{
        history: historyRef.current,
        previous: historyRef.current[historyRef.current.length - 1] ?? null,
        pushPath,
        goBack,
      }}
    >
      {children}
    </PathHistoryContext.Provider>
  );
}

export function usePathHistory() {
  const ctx = useContext(PathHistoryContext);
  if (!ctx)
    throw new Error("usePathHistory must be used inside PathHistoryProvider");
  return ctx;
}
