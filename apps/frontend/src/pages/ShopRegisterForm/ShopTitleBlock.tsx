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
      status={title ? "ok" : "required"}
      hint="尚未填寫店家名稱"
      showHint={showHint}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="塔↘吉 摩ˇ洛哥料理"
        className="input w-full"
      />
    </QuestionBlock>
  );
};

export default ShopTitleBlock;
