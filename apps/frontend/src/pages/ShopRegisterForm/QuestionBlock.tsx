import type { ReactNode } from "react";

const QuestionBlock = ({
  title = "",
  description = "",
  status = "required",
  children = null,
}: {
  title?: string;
  description?: string;
  status?: "required" | "optional" | "ok" | null;
  children?: ReactNode;
}) => {
  const statusStyle =
    status === "required"
      ? "status-error"
      : status === "optional"
      ? "status-info"
      : "status-success";
  return (
    <div className="w-full bg-base-100 rounded-box p-4 space-y-2">
      <div>
        <div className="flex items-center">
          <h2 className="font-bold text-lg flex-1">{title}</h2>
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
