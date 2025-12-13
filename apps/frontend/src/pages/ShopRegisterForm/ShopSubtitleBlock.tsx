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
    <QuestionBlock
      title="副標題"
      description="請填寫該店家的 **分店名或地區** ，如：崇德店"
      status="optional"
    >
      <input
        type="text"
        value={subTitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="崇德店"
        className="input w-full"
      />
    </QuestionBlock>
  );
};

export default ShopSubtitleBlock;
