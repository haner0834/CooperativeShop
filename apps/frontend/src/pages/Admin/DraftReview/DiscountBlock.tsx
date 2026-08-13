import type { ShopDraftDto } from "../../../types/shop";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const DiscountBlock = ({ draft }: { draft: ShopDraftDto }) => {
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="discount">
      <div>
        <span className="opacity-50">折扣內容</span>
        <p>{draft?.discount}</p>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default DiscountBlock;
