import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";

const ShopTitleBlock = ({
  title,
  setTitle,
}: {
  title: string;
  setTitle: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <QuestionBlock title="店家名稱" status={title ? "ok" : "required"}>
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
