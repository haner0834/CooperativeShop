import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
// The import path uses a CDN to resolve the module error in some environments.
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"; // TODO: Make this lazy-loaded for better LCP
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { CameraOff, Check, IdCard, Scan, School } from "@icons";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import { getDeviceId } from "../utils/device";
import type { QrCodePayload } from "../types/qr";
import { path } from "../utils/path";

// == Installation Note ==
// The 'html5-qrcode' library is being loaded from a CDN,
// so a local 'npm install' is not required for this component to work.

// == Type Definitions (as they might not be exported from the minified file) ==
type QrCodeSuccessCallback = (decodedText: string, decodedResult: any) => void;
type QrCodeErrorCallback = (errorMessage: string) => void;

// == Component Props & Ref Handle ==

interface QrCodeScannerProps {
  onResult: (decodedText: string, decodedResult: any) => void;
  onError?: (errorMessage: string) => void;
  className?: string;
  qrbox?: number | { width: number; height: number };
  fps?: number;
}

export interface QrCodeScannerHandle {
  startCamera: () => Promise<void>;
  stopCamera: () => Promise<void>;
}

// == The Reusable QR Code Scanner Component ==

const QrCodeScanner = forwardRef<QrCodeScannerHandle, QrCodeScannerProps>(
  ({ onResult, onError, className = "", qrbox = 250, fps = 10 }, ref) => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const qrcodeRegionId = "html5qr-code-full-region";

    useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }
      if (!html5QrCodeRef.current && scannerContainerRef.current) {
        const newScanner = new Html5Qrcode(scannerContainerRef.current.id, {
          verbose: false,
        });
        html5QrCodeRef.current = newScanner;
      }
      return () => {
        if (html5QrCodeRef.current?.isScanning) {
          html5QrCodeRef.current
            .stop()
            .catch((err) =>
              console.error("Failed to stop scanner on cleanup.", err)
            );
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      startCamera: async () => {
        if (!html5QrCodeRef.current || isScanning) {
          console.warn("Scanner not initialized or already scanning.");
          return;
        }
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length) {
            const cameraId =
              devices.find((d) => d.label.toLowerCase().includes("back"))?.id ||
              devices[0].id;
            const successCallback: QrCodeSuccessCallback = (
              decodedText,
              decodedResult
            ) => onResult(decodedText, decodedResult);
            const errorCallback: QrCodeErrorCallback = (errorMessage) =>
              onError?.(errorMessage);

            await html5QrCodeRef.current.start(
              {
                facingMode: {
                  exact: "environment",
                },
              },
              { fps, qrbox },
              successCallback,
              errorCallback
            );
            setIsScanning(true);
          }
        } catch (err) {
          console.error("Failed to start camera:", err);
          onError?.(String(err));
        }
      },
      stopCamera: async () => {
        if (
          !html5QrCodeRef.current ||
          html5QrCodeRef.current.getState() !== Html5QrcodeScannerState.SCANNING
        ) {
          if (isScanning) setIsScanning(false);
          return;
        }
        try {
          await html5QrCodeRef.current.stop();
          setIsScanning(false);
        } catch (err) {
          console.error("Failed to stop camera:", err);
        }
      },
    }));

    return (
      <div
        className={`relative w-full h-80 max-w-md mx-auto overflow-hidden rounded-lg ${className}`}
      >
        <div
          id={qrcodeRegionId}
          ref={scannerContainerRef}
          className="w-full h-full bg-gray-900"
        />
        {!isScanning && (
          <div className="w-full h-full bg-neutral flex flex-col justify-center items-center text-base-100 font-medium">
            <CameraOff className="w-15 h-15" />
            <p>相機已關閉</p>
          </div>
        )}
      </div>
    );
  }
);

const RawIcon = ({ title }: { title: string }) => {
  switch (title) {
    case "userId":
      return <IdCard />;
    case "schoolName":
      return <School />;
    case "schoolAbbreviation":
      return <School />;
  }
};

const translate = (origin: string) => {
  switch (origin) {
    case "userId":
      return "ID";
    case "schoolName":
      return "校名";
    case "schoolAbbreviation":
      return "校名（簡寫）";
  }
};

const Row = ({ value, title }: { value: string; title: string }) => {
  return (
    <li className="flex justify-between items-center">
      <div className="flex space-x-2">
        <RawIcon title={title} />
        <p className="">{translate(title)}</p>
      </div>
      <p className="font-mono">{value}</p>
    </li>
  );
};

const QrCodePayloadViewer = ({
  qrData = null,
}: {
  qrData: QrCodePayload | null;
}) => {
  if (!qrData) {
    return (
      <div className="h-40 flex flex-col justify-center items-center">
        <span className="loading" />
        <p className="opacity-60 text-xs font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="divider mt-0" />

      <ul className="space-y-4">
        {Object.keys(qrData).map((key) => {
          const value = qrData[key as keyof QrCodePayload];
          return <Row key={key} title={key} value={value} />;
        })}
      </ul>

      <div className="divider" />

      <div className="m-4 flex items-center justify-center">
        <div className="flex badge badge-success text-base-100">
          <Check className="w-4 h-4" strokeWidth={3} />
          驗證通過
        </div>
      </div>
    </div>
  );
};

// == Example Usage: App Component (with improved logic) ==

export default function App() {
  const scannerRef = useRef<QrCodeScannerHandle>(null);
  // This state ensures we only process one successful scan
  const [isScanComplete, setIsScanComplete] = useState(false);
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();
  const [isSheetOn, setIsSheetOn] = useState(false);
  const [qrData, setQrData] = useState<QrCodePayload | null>(null);

  const showSheet = () => setIsSheetOn(true);
  const onSheetClose = () => {
    setIsSheetOn(false);
  };

  useEffect(() => {
    setNavbarButtonsByType(["logo", "themeToggle"]);
    setNavbarTitle(undefined);
  }, []);

  const verifyData = async (decodedText: string) => {
    const body = JSON.stringify({
      data: decodedText,
    });
    const res = await fetch(path("/api/qr/verify"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": getDeviceId(),
      },
      body,
    });

    const { success, data, error } = await res.json();
    if (!success) {
      console.error(error);
      return;
    }

    setQrData(data);
  };

  const handleStart = () => {
    // Reset states for a new scanning session
    setIsScanComplete(false);
    scannerRef.current?.startCamera();
  };

  const handleStop = () => {
    setIsScanComplete(false);
    scannerRef.current?.stopCamera();
  };

  const handleScanResult = (decodedText: string) => {
    console.log("Called");
    // If a scan is already complete, ignore subsequent scans
    if (isScanComplete) {
      console.warn("isScanComplete is true");
      return;
    }

    console.log(`Scan result: ${decodedText}`);

    // Set the state to indicate a successful scan
    setIsScanComplete(true);
    // Automatically stop the camera to finalize the result
    if (!decodedText) return; // As the result might me an empty string
    handleStop();
    verifyData(decodedText);
    showSheet();
  };

  const handleScanError = (error: string) => {
    // This is the key change: we check for the common "NotFound" error and ignore it.
    // This prevents the UI from flashing error messages constantly when no QR code is in view.
    if (error.includes("NotFoundException")) {
      // This is expected, do nothing.
      return;
    }

    // For any other error, we'll log it and show a message.
    console.error(`Scan error: ${error}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-300 items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg p-6 bg-base-100 rounded-xl shadow-lg">
        <QrCodeScanner
          ref={scannerRef}
          qrbox={350}
          onResult={handleScanResult}
          onError={handleScanError}
          className=""
        />

        <div className="flex items-center justify-center gap-4 mt-6">
          {/* <button onClick={handleStart} className="btn btn-primary">
            Start Scan
          </button>
          <button onClick={handleStop} className="btn btn-error">
            Stop Scan
          </button> */}

          <button
            onClick={handleStop}
            className="btn btn-error btn-soft flex-1 rounded-full"
          >
            <CameraOff className="w-5 h-5" />
            停止
          </button>

          <button
            onClick={handleStart}
            className="btn btn-primary flex-1 rounded-full"
          >
            <Scan className="w-5 h-5" />
            掃描
          </button>
        </div>
      </div>

      <ResponsiveSheet isOn={isSheetOn} title="驗證結果" onClose={onSheetClose}>
        <QrCodePayloadViewer qrData={qrData} />
      </ResponsiveSheet>
    </div>
  );
}
