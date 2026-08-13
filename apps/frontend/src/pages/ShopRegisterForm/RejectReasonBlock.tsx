import { CircleAlert } from "lucide-react";

const RejectReasonBlock = ({ reason }: { reason: string }) => {
  return (
    <div
      role="alert"
      className="bg-base-100 rounded-box p-4 flex gap-2 items-center"
      // @ts-expect-error
      style={{ "--depth": 1 }}
    >
      <CircleAlert className="text-error" />

      <div className="space-y-1 flex-1">
        <h3 className="font-bold text-lg">退件原因</h3>
        <div className="text-sm">{reason}</div>
      </div>

      <div className="status status-error"></div>
    </div>
  );
};

export default RejectReasonBlock;
