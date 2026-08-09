import type { Dispatch } from "react";
import Block from "./Block";

const HumanDecisionBlock = ({
  isApproved,
  setIsApproved,
  rejectReason,
  setRejectReason,
}: {
  isApproved: boolean | undefined;
  setIsApproved: Dispatch<React.SetStateAction<boolean | undefined>>;
  rejectReason: string;
  setRejectReason: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <Block>
      <span className="opacity-50">自己審的部分</span>

      <div className="flex space-x-1 p-1 bg-base-300 rounded-xl">
        <button
          onClick={() => setIsApproved(false)}
          className={
            isApproved === false
              ? "btn flex-1 btn-error"
              : "btn btn-ghost font-normal flex-1 text-sm px-4"
          }
        >
          不通過
        </button>
        <button
          onClick={() => setIsApproved(true)}
          className={
            isApproved === true
              ? "btn flex-1 btn-success"
              : "btn btn-ghost font-normal flex-1 text-sm px-4"
          }
        >
          通過
        </button>
      </div>

      {isApproved === false && (
        <div>
          <div className="divider"></div>
          <label className="">Reject Reason</label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reject Reason"
            className="input w-full"
          />
        </div>
      )}
    </Block>
  );
};

export default HumanDecisionBlock;
