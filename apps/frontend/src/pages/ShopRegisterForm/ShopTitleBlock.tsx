import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";

const ShopTitleBlock = ({
  title,
  showHint,
}: {
  title: string;
  setTitle: Dispatch<React.SetStateAction<string>>;
  showHint: boolean;
}) => {
  return (
    <QuestionBlock
      title="店家名稱"
      description="店名、分店名已由最初預約的資料決定，若要修改請新增其他草稿。"
      status={null}
      hint="尚未填寫店家名稱"
      showHint={showHint}
    >
      <div
        className="p-2 rounded-field bg-base-200 w-full tooltip tooltip-bottom"
        data-tip="一旦決定店、分店名便不可修改"
      >
        <p className="opacity-50 text-sm">{title}</p>
      </div>
    </QuestionBlock>
  );
};

export default ShopTitleBlock;
