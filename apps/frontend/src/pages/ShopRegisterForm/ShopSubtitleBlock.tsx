import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";

const ShopSubtitleBlock = ({
  subTitle,
  setSubtitle,
}: {
  subTitle: string;
  setSubtitle: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <QuestionBlock title="副標題" status="optional">
      <input
        type="text"
        value={subTitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="台南店"
        className="input w-full"
      />
    </QuestionBlock>
  );
};

export default ShopSubtitleBlock;
