import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";

const ShopSubtitleBlock = ({
  subTitle,
}: {
  subTitle: string;
  setSubtitle: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <QuestionBlock
      title="分店名"
      description="店名、分店名已由最初預約的資料決定，若要修改請新增其他草稿。"
      status="optional"
    >
      <div
        className="p-2 rounded-field bg-base-200 w-full tooltip tooltip-bottom"
        data-tip="一旦決定店、分店名便不可修改"
      >
        <p className="opacity-50 text-sm">{subTitle}</p>
      </div>
    </QuestionBlock>
  );
};

export default ShopSubtitleBlock;
