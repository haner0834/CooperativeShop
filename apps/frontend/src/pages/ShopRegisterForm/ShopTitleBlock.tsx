import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";

const ShopTitleBlock = ({
  title,
  setTitle,
  showHint,
}: {
  title: string;
  setTitle: Dispatch<React.SetStateAction<string>>;
  showHint: boolean;
}) => {
  return (
    <QuestionBlock
      title="店家名稱"
      description="請填寫該店家的 **店名** ，如：丹丹漢堡"
      status={title ? "ok" : "required"}
      hint="尚未填寫店家名稱"
      showHint={showHint}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="丹丹漢堡"
        className="input w-full"
      />
    </QuestionBlock>
  );
};

export default ShopTitleBlock;
