import type { AiReviewField } from "../../../types/ai-review-result";
import type { ShopDraftDto } from "../../../types/shop";
import Block from "./Block";

const FieldBlockWithAiReviewResult = ({
  draft,
  fieldName,
  children,
}: {
  draft: ShopDraftDto;
  fieldName: AiReviewField;
  children?: React.ReactNode;
}) => {
  const IsValidIndicator = () => {
    return (
      draft?.currentVersion?.aiReviewResult?.title && (
        <span
          className={`badge badge-sm badge-soft ${
            draft.currentVersion.aiReviewResult?.[fieldName].isValid
              ? "badge-success"
              : "badge-error"
          }`}
        >
          {draft.currentVersion.aiReviewResult?.[fieldName].isValid
            ? "未發現明顯問題"
            : "與資料來源不符"}
        </span>
      )
    );
  };
  return (
    <Block>
      {children}

      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs font-medium opacity-30 whitespace-nowrap">
          AI 分析
        </span>
        <div className="h-[1.5px] w-full bg-base-content/10" />
      </div>

      {draft.currentVersion?.aiReviewResult?.[fieldName].isValid === false ? (
        <div>
          <p className="text-sm text-error">
            {draft.currentVersion.aiReviewResult?.[fieldName].reason}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-base-content/60 pt-1">
              <span>資料來源：</span>
              <span className="badge badge-sm badge-soft">
                {draft.currentVersion.aiReviewResult?.[fieldName].source}
              </span>
            </div>

            <IsValidIndicator />
          </div>
        </div>
      ) : draft.currentVersion?.aiReviewResult?.[fieldName].isValid === true ? (
        <div className="flex justify-between">
          <p className="text-xs text-base-content/40 italic">
            尚無 AI 輔助分析內容
          </p>
          <IsValidIndicator />
        </div>
      ) : (
        <div className="flex justify-between">
          <p className="text-xs text-base-content/40 italic">
            尚無 AI 輔助分析內容
          </p>
          <IsValidIndicator />
        </div>
      )}
    </Block>
  );
};

export default FieldBlockWithAiReviewResult;
