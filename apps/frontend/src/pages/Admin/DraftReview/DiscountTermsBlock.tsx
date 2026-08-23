import type { ShopDraftDto } from "../../../types/shop";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const DiscountTermsBlock = ({ draft }: { draft: ShopDraftDto }) => {
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="discount">
      <div>
        <span className="opacity-50">折扣使用規則</span>
        <p>{draft?.discountTerms}</p>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default DiscountTermsBlock;
