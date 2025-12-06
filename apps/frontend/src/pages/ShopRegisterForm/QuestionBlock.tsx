import type { ReactNode } from "react";

const QuestionBlock = ({
  title = "",
  description = "",
  hint = "",
  showHint = false,
  status = "required",
  children = null,
}: {
  title?: string;
  description?: string;
  hint?: string;
  showHint?: boolean;
  status?: "required" | "optional" | "ok" | null;
  children?: ReactNode;
}) => {
  const style =
    status === "required"
      ? "error"
      : status === "optional"
      ? "info"
      : "success";
  const statusStyle = "status-" + style;
  const hintStyle = "text-" + style;

  return (
    <div className="w-full bg-base-100 rounded-box p-4 space-y-2">
      <div>
        <div className="flex items-center">
          <h2 className="font-bold text-lg flex-1">{title}</h2>
          {showHint && hint && status !== "ok" && (
            <span className={"text-xs pe-2 " + hintStyle}>{hint}</span>
          )}
          {status && (
            <div
              aria-label={status + " question"}
              className={"status flex-none " + statusStyle}
            ></div>
          )}
        </div>

        {description && <p className="opacity-50 text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
};
export default QuestionBlock;
