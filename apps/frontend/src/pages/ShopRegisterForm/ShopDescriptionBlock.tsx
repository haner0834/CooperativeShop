import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import AdaptiveTextArea from "../../widgets/AdaptiveTextArea";

const ShopDescriptionBlock = ({
  description,
  showHint,
  setDescription,
}: {
  description: string;
  showHint: boolean;
  setDescription: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <QuestionBlock
      title="描述"
      status={description ? "ok" : "required"}
      description="對店家的介紹，介於 100 至 500 字。"
      hint="尚未填寫店家介紹"
      showHint={showHint}
    >
      <AdaptiveTextArea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="來吃塔↘吉 :D"
        className="textarea w-full"
      ></AdaptiveTextArea>
    </QuestionBlock>
  );
};

export default ShopDescriptionBlock;
