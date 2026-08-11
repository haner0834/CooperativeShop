import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import AdaptiveTextArea from "../../widgets/AdaptiveTextArea";

const SubmissionNoteBlock = ({
  submissionNote,
  setSubmissionNote,
}: {
  submissionNote: string;
  setSubmissionNote: Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <QuestionBlock
      title="提交備註"
      status={"optional"}
      description="對於提交內容的備注。如：營業時間由店家提供、電話由店家提供。"
    >
      <AdaptiveTextArea
        value={submissionNote}
        onChange={(e) => setSubmissionNote(e.target.value)}
        placeholder=":D"
        className="textarea w-full"
      ></AdaptiveTextArea>
    </QuestionBlock>
  );
};

export default SubmissionNoteBlock;
