import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShopDraftDto } from "../../../types/shop";
import { plainToInstance } from "class-transformer";
import { path } from "../../../utils/path";
import { useAdminAuthFetch } from "../../../auth/admin-auth/useAdminAuthFetch";
import { useModal } from "../../../widgets/ModalContext";
import GroundingSourcesBlock from "./GroundingSourcesBlock";
import TitleBlock from "./TitleBlock";
import ContractBlock from "./ContractBlock";
import SubtitleBlock from "./SubtitleBlock";
import ContactInfoBlock from "./ContactInfoBlock";
import DescriptionBlock from "./DescriptionBlock";
import DiscountBlock from "./DiscountBlock";
import LocationBlock from "./LocationBlock";
import WorkScheduleBlock from "./WorkScheduleBlock";
import MetadataBlock from "./MetadataBlock";
import HumanDecisionBlock from "./HumanDecisionBlock";
import ImagesBlock from "./ImagesBlock";
import { List } from "lucide-react";

const Navbar = ({}: {}) => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-1 ms-2"></div>
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold">Shop Info Review</h1>
      </div>
      <div className="flex-1 flex me-2 gap-4 justify-end items-center">
        <Link
          to="/admin/draft-review-list"
          className="btn btn-ghost btn-square"
        >
          <List />
        </Link>
      </div>
    </div>
  );
};

const DraftReview = () => {
  const { id: draftId } = useParams();
  const { adminAuthedFetch } = useAdminAuthFetch();
  const { showModal } = useModal();
  const [draft, setDraft] = useState<ShopDraftDto | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | undefined>(undefined);
  const [rejectReason, setRejectReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const a = async () => {
      if (!draftId) return;
      const draft = await getDraft(draftId);
      if (!draft) {
        showModal({
          title: "Draft not found",
          showDismissButton: true,
        });
        return;
      }
      setDraft(draft);

      if (
        draft.currentVersion &&
        draft.currentVersion.reviewStatus !== "IDLE"
      ) {
        setIsApproved(draft.currentVersion.reviewStatus === "SUCCESS");
        setRejectReason(draft.currentVersion.rejectReason ?? "");
      }
    };
    a();
  }, [draftId]);

  const handleSubmit = () => {
    if (isApproved === undefined) {
      showModal({
        title: "請先選擇是否通過此次審核",
        showDismissButton: true,
      });
    }
    showModal({
      title: "確認送出？",
      description: "請確認所有資料無誤後再送出",
      buttons: [
        {
          label: "再檢查一下",
        },
        {
          label: "確認送出",
          role: "primary",
          style: "btn-primary",
          onClick: submitReview,
        },
      ],
    });
  };

  const submitReview = async () => {
    if (!draftId) return;
    const body = JSON.stringify({
      result: isApproved ? "APPROVE" : "REJECT",
      rejectReason: isApproved ? undefined : rejectReason.trim(),
    });

    const apiUrl = path(`/api/admin/shop-draft/${draftId}/review`);
    const result = await adminAuthedFetch(apiUrl, {
      body,
      method: "POST",
    });

    const { success, error } = result;
    if (!success) {
      showModal({
        title: "Failed to submit review result",
        description: `Error code: ${error.code}`,
        showDismissButton: true,
      });
      return;
    }
    navigate("/admin/draft-review-list");
  };

  const getDraft = async (id: string): Promise<ShopDraftDto | null> => {
    const apiUrl = new URL(path(`/api/admin/shop-draft/${id}/snapshot`));

    const result = await adminAuthedFetch(apiUrl.toString(), { method: "GET" });
    const { success, data, error } = result;
    if (!success) {
      console.error(error);
      return null;
    }
    return plainToInstance(ShopDraftDto, data);
  };

  return (
    <div>
      <Navbar />
      <main className="flex flex-col items-center bg-base-300 min-h-screen pt-20 p-4 gap-4">
        <ul className="flex flex-col gap-4 max-w-lg w-full">
          {draft && (
            <>
              <MetadataBlock draft={draft} />

              <TitleBlock draft={draft} />

              <SubtitleBlock draft={draft} />

              <DescriptionBlock draft={draft} />

              <DiscountBlock draft={draft} />

              <ContractBlock draft={draft} />

              <ContactInfoBlock draft={draft} />

              <LocationBlock
                draft={draft}
                point={{
                  title: draft.title,
                  lat: draft.latitude ?? 0,
                  lng: draft.longitude ?? 0,
                }}
              />

              <WorkScheduleBlock draft={draft} />

              <GroundingSourcesBlock draft={draft} />

              <span className="text-xs opacity-50 text-center">
                Gemini is AI and can make mistakes. Check important info.
              </span>

              <div className="divider text-base-content/40 font-medium">
                Unreviewed Content
              </div>

              <ImagesBlock images={draft.images} />

              <div className="divider text-base-content/40 font-medium"></div>

              <HumanDecisionBlock
                isApproved={isApproved}
                setIsApproved={setIsApproved}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                draft={draft}
              />

              <button
                className="btn btn-primary w-full"
                disabled={draft.currentVersion?.reviewStatus !== "IDLE"}
                onClick={handleSubmit}
              >
                送出
              </button>
            </>
          )}
        </ul>
      </main>
    </div>
  );
};
export default DraftReview;
