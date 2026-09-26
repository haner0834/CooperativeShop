import { useState, type Dispatch } from "react";
import AdaptiveTextArea from "../../widgets/AdaptiveTextArea";
import QuestionBlock from "./QuestionBlock";
import { Info } from "lucide-react";
import { useModal } from "../../widgets/ModalContext";

const ShopDiscountBlock = ({
  discount,
  showHint,
  setDiscount,
  discountTerms,
  setDiscountTerms,
}: {
  discount: string;
  showHint: boolean;
  setDiscount: Dispatch<React.SetStateAction<string>>;
  discountTerms: string | null;
  setDiscountTerms: Dispatch<React.SetStateAction<string | null>>;
}) => {
  // FUCK react 低能兒做出來的東西
  const [hasTerms, setHasTerms] = useState(discountTerms !== "");
  const { showModal } = useModal();

  const showInfoModal = () => {
    showModal({
      title: "折扣規則為使用該特約的額外規則",
      description:
        "若合約已勾選「本優惠得與店內其他行銷活動並用」，則免填使用規則。本欄位請填寫合約「其他附則」內容，若記載為「無」則免填（可留空）。",
      showDismissButton: true,
    });
  };

  return (
    <QuestionBlock
      title="折扣"
      status={discount ? "ok" : "optional"}
      hint="確定沒有折扣？"
      description="商家給的折扣內容。 **請按照合約書中的折扣內容一字不漏的抄寫，請勿擅自更改優惠內容。**"
      showHint={showHint}
    >
      <AdaptiveTextArea
        value={discount}
        onChange={(e) => setDiscount(e.target.value)}
        placeholder="所有商品 9 折"
        className="textarea w-full"
      ></AdaptiveTextArea>

      <div className="flex gap-1 items-center">
        <input
          type="checkbox"
          className="checkbox"
          checked={hasTerms}
          onChange={(e) => setHasTerms(e.target.checked)}
        />
        有使用規則
        <button className="btn btn-circle btn-ghost btn-xs">
          <Info className="w-4 h-4" onClick={showInfoModal} />
        </button>
      </div>

      {hasTerms && (
        <>
          <div className="flex gap-2 items-center">
            折扣規則
            <div className="divider divider-vertical flex-1 my-auto" />
          </div>
          <AdaptiveTextArea
            value={discountTerms ?? ""}
            onChange={(e) => setDiscountTerms(e.target.value)}
            placeholder=""
            className="textarea w-full"
          ></AdaptiveTextArea>
        </>
      )}
    </QuestionBlock>
  );
};

export default ShopDiscountBlock;
