import { Copy, CircleX, Clipboard } from "lucide-react";
import { fromContactInfoDto, type ShopDraftDto } from "../../../types/shop";
import { useToast } from "../../../widgets/Toast/ToastProvider";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const ContactInfoBlock = ({ draft }: { draft: ShopDraftDto }) => {
  const { showToast } = useToast();
  const copyText = async (textToCopy: string | null | undefined) => {
    try {
      if (!textToCopy) throw new Error();
      await navigator.clipboard.writeText(textToCopy);
      showToast({
        title: "複製成功",
        icon: <Copy className="text-success" />,
      });
    } catch {
      showToast({
        title: "複製失敗",
        icon: <CircleX className="text-error" />,
      });
    }
  };
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="contactInfo">
      <div>
        <span className="opacity-50">聯絡方式</span>

        <div className="flex flex-col gap-4 mt-2">
          {draft.contactInfo.map(fromContactInfoDto).map((contactInfo) => {
            return (
              <div
                className="flex flex-col gap-2 border-1 border-base-300 rounded-field p-4"
                key={contactInfo.href}
              >
                <div className="flex gap-2 items-center">
                  {contactInfo.icon}
                  <h3 className="font-medium">{contactInfo.name}</h3>
                </div>
                <ul>
                  <li className="flex gap-2 items-center">
                    <button
                      className="btn btn-sm btn-ghost btn-square"
                      onClick={() => copyText(contactInfo.content)}
                    >
                      <Clipboard className="w-4 h-4" />
                    </button>
                    <p className="font-mono text-sm">{contactInfo.content}</p>
                  </li>
                  <li className="flex gap-2 items-center">
                    <button
                      className="btn btn-sm btn-ghost btn-square"
                      onClick={() => copyText(contactInfo.href)}
                    >
                      <Clipboard className="w-4 h-4" />
                    </button>
                    <a
                      href={contactInfo.href}
                      target="_blank"
                      className="font-mono text-sm underline"
                    >
                      {contactInfo.href}
                    </a>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default ContactInfoBlock;
