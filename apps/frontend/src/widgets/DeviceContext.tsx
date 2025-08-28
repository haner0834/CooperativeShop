import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface DeviceContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isMobileOrTablet: boolean;
  isDesktop: boolean;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [device, setDevice] = useState<DeviceContextValue>({
    isMobile: false,
    isTablet: false,
    isMobileOrTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;

      const isMobile = width <= 767;
      const isTablet = width > 767 && width <= 1024;
      const isMobileOrTablet = isMobile || isTablet;
      const isDesktop = width > 1024;

      setDevice({
        isMobile,
        isTablet,
        isMobileOrTablet,
        isDesktop,
      });
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return (
    <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context)
    throw new Error("useDevice must be used within a DeviceProvider");
  return context;
};
