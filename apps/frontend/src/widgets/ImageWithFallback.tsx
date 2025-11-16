import {
  useState,
  useEffect,
  type ReactNode,
  type ImgHTMLAttributes,
} from "react";

/**
 * A smart image component that handles loading and error states with customizable fallbacks.
 *
 * @param src - The image URL to load
 * @param skeleton - Optional loading UI (defaults to a simple skeleton)
 * @param error - Optional error UI (defaults to a localized message)
 * @param alt - Optional alt text for accessibility (recommended)
 */
interface ImageWithFallbackProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  skeleton?: ReactNode;
  error?: ReactNode;
}

export function ImageWithFallback({
  src,
  skeleton,
  error,
  alt = "",
  ...imgProps
}: ImageWithFallbackProps) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    const img = new Image();
    img.onload = () => mounted && setState("ok");
    img.onerror = () => mounted && setState("error");
    img.src = src;

    return () => {
      mounted = false;
    };
  }, [src]);

  if (state === "loading") {
    return (
      <>
        {skeleton ?? (
          <div className="w-full h-full skeleton" aria-label="圖片載入中" />
        )}
      </>
    );
  }

  if (state === "error") {
    return (
      <>{error ?? <div className="bg-error/30 text-sm">圖片無法載入</div>}</>
    );
  }

  return <img src={src} alt={alt} loading="lazy" {...imgProps} />;
}
