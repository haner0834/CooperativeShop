import { plainToInstance } from "class-transformer";
import { AnimatePresence } from "framer-motion";
import { CircleAlert, CircleX, House } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShopDraftDto, type ShopDraftStage } from "../../types/shop";
import { path } from "../../utils/path";
import {
  getStatusColor,
  getStatusText,
} from "../ShopRegisterForm/ShopRegisterForm";
import { AnimatedListItem } from "../ShopDrafts";
import { useAdminAuthFetch } from "../../auth/admin-auth/useAdminAuthFetch";
import { useAdminAuth } from "../../auth/admin-auth/AdminAuthContext";
import SchoolIcon from "../../widgets/SchoolIcon";
import { SegmentedControl } from "../../widgets/SegmentedControl";

const Navbar = ({}: {}) => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-1 ms-2"></div>
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold">Drafts to Review</h1>
      </div>
      <div className="flex-1 flex me-2 gap-4 justify-end items-center">
        <Link to="/admin" className="btn btn-square btn-ghost">
          <House />
        </Link>
      </div>
    </div>
  );
};

const getStageText = (stage: ShopDraftStage) => {
  switch (stage) {
    case "RESERVED":
      return "已預約";
    case "EDITING":
      return "正在編輯";
    case "SUBMITTED":
      return "已提交";
    case "ARCHIVED":
      return "ARCHIVED";
    case "APPROVED":
      return "已通過";
  }
};

const DraftReviewList = () => {
  const [drafts, setDrafts] = useState<ShopDraftDto[]>([]);
  const { restorePromise } = useAdminAuth();
  const { adminAuthedFetch } = useAdminAuthFetch();
  const [fetchState, setFetchState] = useState<
    "loading" | "success" | "failed" | "idle"
  >("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "IDLE" | "REJECT" | "SUCCESS"
  >("IDLE");

  useEffect(() => {
    getDrafts();
  }, [statusFilter]);

  const getDrafts = async () => {
    if (restorePromise) await restorePromise;

    setFetchState("loading");
    const result = await adminAuthedFetch(
      path(
        `/api/admin/shop-draft?reviewStatus=${statusFilter}&versions=true&currentVersion=true&school=true`
      )
    );

    const { success, error } = result;

    if (!success) {
      console.error(error);
      setFetchState("failed");
      setErrorCode(error.code);
      return;
    }

    const { data }: { data: any[] } = result;
    const drafts = plainToInstance(ShopDraftDto, data);
    setDrafts(drafts);
    setFetchState("success");
  };

  const getFormattedDate = (date: Date): string => {
    const year = date.getFullYear() - 2000;
    const month = date.getMonth();
    const day = date.getDay();

    return `${year}/${month}/${day}`;
  };

  return (
    <div className="min-h-screen flex justify-center bg-base-300">
      <Navbar />
      <main className="pt-18 min-h-screen max-w-xl w-full">
        <SegmentedControl
          value={statusFilter}
          onChange={setStatusFilter}
          className="mx-2"
          options={[
            { label: "待審", value: "IDLE" },
            { label: "通過", value: "SUCCESS" },
            { label: "拒絕", value: "REJECT" },
          ]}
        />
        <ul className="space-y-4 m-4">
          {drafts.length === 0 && fetchState === "success" ? (
            <AnimatedListItem>
              <div className="flex flex-col  justify-center items-center">
                <div className="flex items-center">
                  <CircleX />
                  <h2 className="p-4 text-center">No drafts to review</h2>
                </div>
              </div>
            </AnimatedListItem>
          ) : fetchState === "failed" ? (
            <div className="flex flex-col gap-2 w-full justify-center items-center">
              <CircleAlert className="w-10 h-10 text-error" />
              <h2 className="text-lg font-bold">無法取得草稿</h2>
              <p className="">請檢查網路狀態或稍後再試。錯誤碼：{errorCode}</p>
            </div>
          ) : fetchState === "loading" ? (
            [1, 2, 3, 4].map((i) => {
              return (
                <div
                  className="bg-base-100 rounded-box p-4 flex gap-4"
                  key={`SKELETON_${i}`}
                >
                  <div className="w-30 h-30 rounded-field skeleton" />

                  <div className="flex flex-col gap-2">
                    <div className="w-20 h-6 rounded-field skeleton" />

                    <div className="w-50 flex-1 rounded-field skeleton" />

                    <div className="w-20 h-3 rounded-field skeleton" />
                  </div>
                </div>
              );
            })
          ) : (
            <></>
          )}

          <AnimatePresence initial={false}>
            {[...drafts].map((draft) => (
              <AnimatedListItem key={draft.id}>
                <Link
                  to={`/admin/draft-review/${draft.id}`}
                  className="overflow-clip"
                >
                  <div className="w-full bg-base-100 rounded-box p-4 shadow">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-baseline gap-1 font-semibold">
                            <h3 className="text-lg line-clamp-1">
                              {draft.title || "未命名"}
                            </h3>
                            <h4 className="text-sm opacity-60">
                              {draft.subtitle}
                            </h4>
                          </div>
                          <p className="line-clamp-1">{draft.description}</p>
                        </div>

                        {draft.images[0].previewUrl && (
                          <img
                            src={draft.images[0].previewUrl}
                            className="w-15 h-15 aspect-square rounded-field"
                          />
                        )}
                      </div>

                      <div className="h-[1.5px] w-full bg-base-content/10"></div>

                      <div className="flex justify-between items-center">
                        <span className="flex gap-1 items-center text-sm">
                          <SchoolIcon
                            abbreviation={draft.school.abbr!}
                            className="w-6 h-6"
                          />
                          {draft.school.name}
                        </span>

                        <div className="h-5 w-[1.5px] bg-base-content/10"></div>

                        {draft.currentVersion && (
                          <>
                            <p className="text-sm">
                              Version. {draft.currentVersion?.versionNo}
                            </p>
                            <div className="h-5 w-[1.5px] bg-base-content/10"></div>
                            <p className="text-sm">
                              {getFormattedDate(
                                draft.currentVersion.submittedAt
                              )}{" "}
                              提交
                            </p>
                          </>
                        )}
                      </div>

                      <div className="h-[1.5px] w-full bg-base-content/10"></div>

                      {draft.currentVersion ? (
                        <div className="flex justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                draft.currentVersion.reviewStatus
                              )}`}
                            />
                            <p className="text-xs opacity-40">
                              {getStatusText(draft.currentVersion.reviewStatus)}
                            </p>
                          </div>

                          <span className="badge badge-info badge-sm badge-soft">
                            {getStageText(draft.stage)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs opacity-40">
                          {getFormattedDate(draft.updatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </ul>
      </main>
    </div>
  );
};

export default DraftReviewList;
