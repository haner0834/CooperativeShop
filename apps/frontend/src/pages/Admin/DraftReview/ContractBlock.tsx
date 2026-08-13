import { FileText } from "lucide-react";
import type { ShopDraftDto } from "../../../types/shop";
import { getImageUrl } from "../../../utils/get-image-url.utils";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const ContractBlock = ({ draft }: { draft: ShopDraftDto }) => {
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="contract">
      <div>
        <span className="opacity-50">合約書</span>

        <div className="flex w-full rounded-field bg-base-300 items-center justify-center h-30 mt-2">
          <a
            href={getImageUrl(draft.contract?.fileKey ?? "")}
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex gap-1"
          >
            <FileText className="text-primary" />
            {draft.contract?.fileName}
          </a>
        </div>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default ContractBlock;
