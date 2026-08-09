import type { ShopDraftDto } from "../../../types/shop";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const SubtitleBlock = ({ draft }: { draft: ShopDraftDto }) => {
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="subtitle">
      <div>
        <span className="opacity-50">分店名</span>
        <h2 className="font-bold text-lg text-base-content">
          {draft?.subtitle}
        </h2>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default SubtitleBlock;
