import type { ShopDraftDto } from "../../../types/shop";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const TitleBlock = ({ draft }: { draft: ShopDraftDto }) => {
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="title">
      <div>
        <span className="opacity-50">店名</span>
        <h2 className="font-bold text-lg text-base-content">{draft?.title}</h2>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default TitleBlock;
