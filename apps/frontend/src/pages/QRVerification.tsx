import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldAlert, QrCode } from "lucide-react";
import { getDeviceId } from "../utils/device";
import { path } from "../utils/path";
import SchoolIcon from "../widgets/SchoolIcon";
import { getErrorMessage } from "../utils/errors";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";

// --- Helpers ---
const formatScanTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${yy}/${mm}/${dd} ${time}`;
};

// --- Types ---
export interface QrCodePayload {
  userId: string;
  schoolName: string;
  schoolAbbreviation: string;
  signature: string;
  timestamp?: number;
}

interface ApiError {
  code: string;
  message?: string;
}

// --- Reusable Card Component ---
interface ResultCardProps {
  status: "loading" | "success" | "error";
  data: QrCodePayload | null;
  error: ApiError | null;
  timestamp: number;
}

const ResultCard = ({ status, data, error, timestamp }: ResultCardProps) => {
  const isLoading = status === "loading";
  const isError = status === "error";

  return (
    <div className="relative w-full max-w-[400px] aspect-[1.58/1] mx-auto">
      <div
        className={`w-full h-full rounded-box border shadow-xl flex flex-col p-6 justify-between overflow-hidden relative bg-base-100 ${
          isError ? "border-error/50" : "border-base-content/10"
        }`}
      >
        {/* Top Section */}
        <div className="relative z-10 flex justify-between items-start">
          {isLoading ? (
            <div className="skeleton w-16 h-16 rounded-lg"></div>
          ) : isError ? (
            <div className="w-16 h-16 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <ShieldAlert className="w-8 h-8" />
            </div>
          ) : (
            <SchoolIcon
              abbreviation={data?.schoolAbbreviation || ""}
              className="w-16 h-16 rounded-lg bg-base-content/5 p-1"
            />
          )}

          <div className="flex flex-col items-end gap-1 max-w-[65%]">
            {isLoading ? (
              <>
                <div className="skeleton h-6 w-24 rounded-full"></div>
                <div className="skeleton h-3 w-12 rounded mt-1"></div>
              </>
            ) : (
              <>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold truncate max-w-full ${
                    isError
                      ? "bg-error text-error-content"
                      : "bg-base-content/10 text-base-content"
                  }`}
                >
                  {isError ? "驗證失敗" : data?.schoolName}
                </div>
                <div className="text-xs font-mono opacity-50 pr-1">
                  {isError ? error?.code : data?.schoolAbbreviation}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle Section (Error Message Only) */}
        {isError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="bg-error/5 text-error font-bold text-lg px-4 py-2 rounded-lg transform -rotate-12 border-2 border-error border-dashed opacity-50">
              {getErrorMessage(error?.code || ("UNKNOWN" as any))}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-mono opacity-50 mb-1">STUDENT ID</div>
          {isLoading ? (
            <div className="skeleton h-6 w-32"></div>
          ) : (
            <div
              className={`text-base font-bold ${
                isError ? "text-error" : "text-base-content"
              }`}
            >
              {isError ? "--------" : data?.userId}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 flex justify-between items-end">
          {/* 只有在成功狀態才顯示 badge */}
          {!isLoading && !isError && (
            <span className="badge badge-sm badge-success">驗證成功</span>
          )}
          {/* 如果是 loading 或 error 佔位，保持排版 */}
          {(isLoading || isError) && <span></span>}

          <div className="text-[10px] font-mono opacity-40 text-right">
            {isLoading ? (
              <div className="skeleton h-3 w-24"></div>
            ) : (
              formatScanTime(timestamp)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const QrVerification = () => {
  const [searchParams] = useSearchParams();
  const { setNavbarButtonsByType } = useNavbarButtons();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [qrData, setQrData] = useState<QrCodePayload | null>(null);
  const [errorData, setErrorData] = useState<ApiError | null>(null);
  const [history, setHistory] = useState<QrCodePayload[]>([]);
  const [scanTime, setScanTime] = useState<number>(Date.now());

  // Initialize and read history
  useEffect(() => {
    setNavbarButtonsByType(["logo", "themeToggle"]);
    const saved = localStorage.getItem("recent_verified");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (data: QrCodePayload) => {
    const newRecord = { ...data, timestamp: Date.now() };
    setHistory((prev) => {
      // 確保不重複 (相同的 User 在同一間學校)
      const filtered = prev.filter(
        (item) =>
          item.userId !== data.userId ||
          item.schoolAbbreviation !== data.schoolAbbreviation
      );
      const newHistory = [newRecord, ...filtered].slice(0, 10);
      localStorage.setItem("recent_verified", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const verifyData = async (decodedText: string) => {
    setStatus("loading");
    setScanTime(Date.now());

    try {
      const body = JSON.stringify({ data: decodedText });
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
        setErrorData(error);
        setStatus("error");
        return;
      }

      setQrData(data);
      setStatus("success");
      saveToHistory(data);
    } catch (err) {
      console.error(err);
      setErrorData({ code: "NETWORK_ERROR" });
      setStatus("error");
    }
  };

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("idle");
      return;
    }
    verifyData(code);
  }, [searchParams]);

  // IDLE STATE
  if (status === "idle") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 gap-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-12 h-12 text-base-content/50" />
          </div>
          <h2 className="text-2xl font-bold">等待驗證</h2>
          <p className="text-base-content/70">請掃描 QR Code 以進行驗證</p>
        </div>

        {history.length > 0 && (
          <div className="w-full max-w-sm opacity-50 text-xs text-center">
            已儲存 {history.length} 筆最近驗證紀錄
          </div>
        )}
      </div>
    );
  }

  // ACTIVE STATE (Loading / Success / Error)
  return (
    <div className="bg-base-200 min-h-screen pb-20 pt-18">
      {/* 1. Main Verification Result (Takes up min-h-screen) */}
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        {/* Reused Card Component */}
        <ResultCard
          status={status}
          data={qrData}
          error={errorData}
          timestamp={scanTime}
        />

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => (window.location.href = "/")}
            className="btn btn-ghost btn-sm gap-2"
          >
            返回首頁
          </button>
        </div>
      </div>

      {/* 2. Divider & History Section */}
      {history.length > 0 && (
        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="divider opacity-50 mb-8">
            歷史紀錄 ({history.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {history.map((record, index) => (
              <div key={`${record.userId}-${record.timestamp}-${index}`}>
                <ResultCard
                  status="success" // 歷史紀錄必定是成功狀態
                  data={record}
                  error={null}
                  timestamp={record.timestamp || Date.now()}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QrVerification;
