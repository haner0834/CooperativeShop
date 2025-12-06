import type { Dispatch } from "react";
import AdaptiveTextArea from "../../widgets/AdaptiveTextArea";
import QuestionBlock from "./QuestionBlock";

const ShopDiscountBlock = ({
  discount,
  showHint,
  setDiscount,
}: {
  discount: string;
  showHint: boolean;
  setDiscount: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <QuestionBlock
      title="折扣"
      status={discount ? "ok" : "optional"}
      hint="確定沒有折扣？"
      description="商家給的折扣內容。"
      showHint={showHint}
    >
      <AdaptiveTextArea
        value={discount}
        onChange={(e) => setDiscount(e.target.value)}
        placeholder="所有商品 9 折"
        className="textarea w-full"
      ></AdaptiveTextArea>
    </QuestionBlock>
  );
};

export default ShopDiscountBlock;
