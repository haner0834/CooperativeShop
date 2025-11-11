import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import AdaptiveTextArea from "../../widgets/AdaptiveTextArea";

const ShopDescriptionBlock = ({
  description,
  setDescription,
}: {
  description: string;
  setDescription: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <QuestionBlock
      title="描述"
      description="對店家的簡短介紹，介於 100 至 500 字。"
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
