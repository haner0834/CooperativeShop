import type { ShopDraftDto } from "../../../types/shop";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const DescriptionBlock = ({ draft }: { draft: ShopDraftDto }) => {
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="description">
      <div>
        <span className="opacity-50">店家介紹</span>
        <p className="">{draft?.description}</p>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default DescriptionBlock;
