import { useEffect, useState } from "react";
import type { ShopDraftDto } from "../../../types/shop";
import SchoolIcon from "../../../widgets/SchoolIcon";
import Block from "./Block";
import { useModal } from "../../../widgets/ModalContext";
import { CircleQuestionMark } from "lucide-react";

const MetadataBlock = ({ draft }: { draft: ShopDraftDto }) => {
  const [tapTimes, setTapTimes] = useState(0);
  const { showModal } = useModal();
  const version = draft.currentVersion;

  const reviewStatus = version?.aiReviewStatus;

  const reviewStatusConfig = {
    APPROVED: {
      label: "提交內容與公開資訊相符",
      className: "badge-success",
    },
    REJECTED: {
      label: "提交內容與公開資訊不符",
      className: "badge-error",
    },
    default: {
      label: "尚未檢查",
      className: "badge-ghost",
    },
  };

  useEffect(() => {
    if (tapTimes >= 50) {
      showModal({
        title: "何意味",
        icon: (
          <CircleQuestionMark className="text-info w-10 h-10"></CircleQuestionMark>
        ),
        description: "按五十次了大姐你真的很閒",
        showDismissButton: true,
      });
    } else if (tapTimes >= 40) {
      showModal({
        title: "操蛋的",
        description: "你真的沒別的事做了嗎 這有那麼好玩？",
        showDismissButton: true,
      });
    } else if (tapTimes >= 30) {
      showModal({
        title: "？",
        description: "這位奶龍請問你按了三十次是還好嗎",
        showDismissButton: true,
      });
    } else if (tapTimes >= 20) {
      showModal({
        title: "再按變奶龍",
        showDismissButton: true,
      });
    } else if (tapTimes >= 10) {
      showModal({
        title: "你是說你為了不寫拒絕理由在這裡按了10次？",
        description: "",
        showDismissButton: true,
      });
    } else if (tapTimes >= 2) {
      showModal({
        title: "別點了自己想拒絕原因",
        description: "連這個都要複製是多懶 再抄 AI 我就把 AI 功能關掉",
        showDismissButton: true,
      });
    }
  }, [tapTimes]);

  const status =
    reviewStatusConfig[reviewStatus as keyof typeof reviewStatusConfig] ??
    reviewStatusConfig.default;

  const formatDateTime = (date?: Date | null) => {
    if (!date) return "—";

    return date.toLocaleString("zh-TW", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Block>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <SchoolIcon
              abbreviation={draft.school.abbr ?? "kmsh"}
              className="h-6 w-6 shrink-0"
            />

            <div className="min-w-0">
              <p className="truncate font-medium">{draft.school.name}</p>
              <p className="text-xs opacity-50">店家資料提交</p>
            </div>
          </div>

          <span className="shrink-0 text-sm font-medium opacity-60">
            No.{version?.versionNo ?? "—"}
          </span>
        </div>

        <div className="border border-base-300 w-full p-4 rounded-field">
          <p className="text-center font-bold">
            商家資訊已審核完畢，無法再次提交審核結果
          </p>
        </div>

        <div className="divider my-0" />

        {/* Review Status */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">AI 分析</span>

          <span className={`badge badge-sm badge-soft ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">分析摘要</span>

          <button
            onClick={() => setTapTimes((prev) => prev + 1)}
            className="rounded-field border text-left border-base-300 bg-base-200/30 p-3 text-sm leading-relaxed select-none"
          >
            {version?.aiReviewResult?.summary || (
              <span className="opacity-50">尚無分析摘要</span>
            )}
          </button>
        </div>

        <div className="divider my-0" />

        {/* Timestamps */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs opacity-50">提交時間</span>
            <span className="text-sm">
              {formatDateTime(version?.submittedAt)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 sm:text-right">
            <span className="text-xs opacity-50">AI 審核時間</span>
            <span className="text-sm">
              {formatDateTime(version?.aiReviewedAt)}
            </span>
          </div>

          {version?.reviewStatus !== "IDLE" && (
            <div className="flex flex-col gap-0.5 sm:text-right">
              <span className="text-xs opacity-50">審核時間</span>
              <span className="text-sm">
                {formatDateTime(version?.reviewedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Block>
  );
};

export default MetadataBlock;
