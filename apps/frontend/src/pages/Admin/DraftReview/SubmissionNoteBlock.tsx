import type { ShopDraftDto } from "../../../types/shop";
import Block from "./Block";

const SubmissionNoteBlock = ({ draft }: { draft: ShopDraftDto }) => {
  return (
    <Block>
      <div>
        <span className="opacity-50">備註</span>
        <h2 className="text-base-content">
          {draft.submissionNote ?? "無備註"}
        </h2>
      </div>
    </Block>
  );
};

export default SubmissionNoteBlock;
