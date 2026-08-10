import {
  Ban,
  Check,
  CircleAlert,
  Clock3,
  CloudAlert,
  CloudCheck,
  CloudSync,
  CloudUpload,
  List,
  Loader,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormHeader from "./FormHeader";
import ShopTitleBlock from "./ShopTitleBlock";
import ShopDescriptionBlock from "./ShopDescriptionBlock";
import ShopContactInfoBlock from "./ShopContactInfoBlock";
import ShopImagesBlock from "./ShopImagesBlock";
import ShopLocationBlock from "./ShopLocationBlock";
import ShopWorkSchedulesBlock from "./ShopWorkSchedulesBlock";
import {
  DEFAULT_WORKSCHEDULE,
  fromContactInfoDto,
  ShopDraftVersionDto,
  type ContactInfoDto,
  type ReviewStatus,
} from "../../types/shop";
import type { SelectedImage } from "../../types/selectedImage";
import { ShopDraftDto, type ContactInfo } from "../../types/shop";
import type { Point } from "./ShopLocationBlock";
import ShopDiscountBlock from "./ShopDiscountBlock";
import { useToast } from "../../widgets/Toast/ToastProvider";
import { useAuth } from "../../auth/AuthContext";
import { useModal } from "../../widgets/ModalContext";
import {
  fromBackendSchedules,
  hasWorkScheduleOverlap,
  toBackendSchedules,
  type WorkSchedule,
} from "../../types/workSchedule";
import ShopSignedSchool from "./ShopSignedSchool";
import ShopSubtitleBlock from "./ShopSubtitleBlock";
import { buildHref } from "../../utils/contactInfoMap";
import { useAuthFetch } from "../../auth/useAuthFetch";
import { path } from "../../utils/path";
import ShopContractBlock, { type UploadedContract } from "./ShopContractBlock";
import { plainToInstance } from "class-transformer";
import RejectReasonBlock from "./RejectReasonBlock";
import { usePathHistory } from "../../contexts/PathHistoryContext";

type SyncStatus = "success" | "failed" | "idle" | "syncing";

export const getStatusColor = (status: ReviewStatus): string => {
  switch (status) {
    case "IDLE":
      return "bg-gray-500";

    case "REJECT":
      return "bg-error";
    case "SUCCESS":
      return "bg-success";
    case "SUPERSEDED":
      return "bg-base-300";

    default:
      return "";
  }
};

export const getStatusText = (status: ReviewStatus): string => {
  switch (status) {
    case "IDLE":
      return "待審核";
    case "REJECT":
      return "審核未通過";
    case "SUCCESS":
      return "提交成功";
    case "SUPERSEDED":
      return "已取消";
    default:
      return "";
  }
};

export const StatusIcon = ({ status }: { status: ReviewStatus }) => {
  return (
    <div
      className={`h-6 w-6 rounded-full flex justify-center items-center text-center ${getStatusColor(
        status
      )}`}
    >
      {status === "IDLE" ? (
        <Clock3 className="w-4 h-4 text-base-100" />
      ) : status === "REJECT" ? (
        <X className="w-4 h-4 text-base-100" />
      ) : status === "SUCCESS" ? (
        <Check className="w-4 h-4 text-base-100" />
      ) : status === "SUPERSEDED" ? (
        <Ban className="w-4 h-4 text-base-content" />
      ) : (
        <></>
      )}
    </div>
  );
};

const Navbar = ({
  syncStatus,
  showLeaveHint,
}: {
  syncStatus: SyncStatus;
  showLeaveHint: boolean;
}) => {
  const { showModal } = useModal();
  const navigate = useNavigate();

  const showHintModal = () => {
    showModal({
      title: "尚有未保存的內容，確認離開？",
      buttons: [
        {
          label: "取消",
        },
        {
          label: "離開",
          role: "error",
          style: "btn-error",
          onClick: () => navigate("/shops/drafts"),
        },
      ],
    });
  };

  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-none ms-2">
        {syncStatus === "syncing" ? (
          <CloudSync />
        ) : syncStatus === "success" ? (
          <CloudCheck />
        ) : syncStatus === "failed" ? (
          <CloudAlert />
        ) : (
          <Loader />
        )}
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold">特約商家註冊</h1>
      </div>
      <div className="flex-none flex gap-4 justify-center items-center">
        {showLeaveHint ? (
          <button className="btn btn-square btn-ghost" onClick={showHintModal}>
            <List />
          </button>
        ) : (
          <Link className="btn btn-square btn-ghost" to="/shops/drafts">
            <List />
          </Link>
        )}
      </div>
    </div>
  );
};

interface EditLockRef {
  id: string | null;
  generation: number;
  queue: Promise<void>;
}

type DraftViewMode = "edit" | "edit_after_submit";

const ShopRegisterForm = () => {
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [searchParams] = useSearchParams();
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [address, setAddress] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [contract, setContract] = useState<UploadedContract | null>(null);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([
    DEFAULT_WORKSCHEDULE,
  ]);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentVersion, setCurrentVersion] =
    useState<ShopDraftVersionDto | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { authedFetch } = useAuthFetch();
  const lastSavedDraft = useRef<ShopDraftDto | null>(null);
  const lockRef = useRef<EditLockRef>({
    id: null,
    generation: 0,
    queue: Promise.resolve(), // 序列化 acquire/release,避免平行競態
  });
  const { goBack } = usePathHistory();
  const [images, setImages] = useState<SelectedImage[]>([]); // 用 base64 URL 預覽
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [viewMode, setViewMode] = useState<DraftViewMode>("edit");

  // get draft data
  useEffect(() => {
    const a = async () => {
      if (!searchParams.get("id")) {
        showModal({
          title: "無效網址",
          showDismissButton: true,
        });
      }

      const id = searchParams.get("id") ?? "FUCK";
      const draft = await getDraft(id);
      lastSavedDraft.current = draft;
      if (draft) {
        if (activeUser && draft.school.id !== activeUser.schoolId) {
          showModal({
            title: "權限錯誤",
            description:
              "您目前的帳號所屬校系與此商店草稿不符，請切換帳號或取消編輯。",
            buttons: [
              {
                label: "切換帳號",
                style: "btn-outline",
                onClick: () => {
                  const target = `/shops/register?id=${id}`;
                  navigate(`/choose-school?to=${encodeURIComponent(target)}`);
                },
              },
              {
                label: "離開",
                style: "btn-error",
                role: "primary",
                onClick: () => {
                  navigate("/shops/drafts", { replace: true });
                },
              },
            ],
          });
          return;
        }

        if (draft.stage === "SUBMITTED") {
          showModal({
            title: "此草稿已提交",
            description: "若仍需編輯，所有變更在再次提交前皆不會同步至雲端。",
            buttons: [
              {
                label: "仍要編輯",
                onClick: () => {
                  setViewMode("edit_after_submit");
                },
              },
              {
                label: "離開",
                role: "primary",
                style: "btn-primary",
                onClick: () => {
                  goBack("/shops/drafts");
                },
              },
            ],
          });
        }

        setTitle(draft.title);
        setSubTitle(draft.subtitle ?? "");
        setDescription(draft.description);
        setDiscount(draft.discount ?? "");
        setImages(
          draft.images.map((image) => {
            const { status, isUploading, ...rest } = image;
            return {
              ...rest,
              status: status === "success" ? "success" : "error",
              isUploading: false,
            };
          })
        );
        const selectedPoint = {
          id: crypto.randomUUID() as string,
          title: draft.address,
          lat: draft.latitude ?? 0,
          lng: draft.longitude ?? 0,
        };
        setWorkSchedules(fromBackendSchedules(draft.workSchedules));
        setContract(draft.contract);
        setAddress(draft.address);
        setSelectedPoint(selectedPoint);
        setCurrentVersion(
          draft.currentVersion
            ? plainToInstance(ShopDraftVersionDto, draft.currentVersion)
            : null
        );
        setContactInfo(draft.contactInfo.map(fromContactInfoDto));
      }
    };
    a();
  }, []);

  // Force login
  const { activeUser, hasAttemptedRestore, restorePromise } = useAuth();
  useEffect(() => {
    const toLogin = () => {
      const target = `/shops/register?id=${searchParams.get("id")}`;
      const url = `/choose-school?to=${encodeURIComponent(target)}`;
      navigate(url);
    };

    const a = async () => {
      if (hasAttemptedRestore && !activeUser) {
        const result = await restorePromise;
        if (result.ok) return;
        // Failed to restore session
        showModal({
          title: "請先登入帳號",
          description: "必須登入帳號才可進行下一步操作。",
          buttons: [
            {
              label: "繼續",
              style: "btn-primary",
              role: "primary",
              onClick: toLogin,
            },
          ],
        });
      }
    };
    a();
  }, [activeUser, hasAttemptedRestore]);

  // edit lock token
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;

    const myGeneration = ++lockRef.current.generation;

    // 把 acquire 排進 queue,確保不會跟其他 acquire/release 平行執行
    withLock(async () => {
      // 執行到這裡時,如果已經有更新的 effect 覆蓋了我,直接放棄,連 API 都不用打
      if (lockRef.current.generation !== myGeneration) return;

      try {
        await acquireEditLock(id);
        // acquire 完成後再檢查一次,如果已經過期(被新的 effect 取代),立刻釋放
        if (lockRef.current.generation !== myGeneration) {
          await releaseEditLock(id);
        } else {
          lockRef.current.id = id;
        }
      } catch (error: any) {
        if (error.message === "NO_SESSION") {
          // authorization, let force-login handle
          return;
        }
        showModal({
          title: "該草稿正在被其他人編輯",
          description: "請稍後再試",
          buttons: [
            {
              label: "離開",
              role: "primary",
              style: "btn-primary",
            },
          ],
        });
      }
    });

    return () => {
      withLock(async () => {
        // 只有「這一世代確實持有鎖」時才釋放
        if (
          lockRef.current.id === id &&
          lockRef.current.generation === myGeneration
        ) {
          try {
            await releaseEditLock(id);
          } catch (error) {
            console.error("釋放編輯鎖失敗:", error);
          } finally {
            lockRef.current.id = null;
          }
        }
      });
    };
  }, [searchParams.get("id")]);

  // auto-save
  useEffect(() => {
    if (viewMode !== "edit") return;

    setSyncStatus("idle");
    const handler = setTimeout(() => {
      try {
        syncUpdatedDraft();
      } catch (e) {
        console.error(e);
      }
    }, 1500); // ← delay 1.5s

    return () => clearTimeout(handler); // ← Cancel the previous timer (to prevent duplicate storage).
  }, [
    title,
    subTitle,
    description,
    discount,
    contactInfo,
    workSchedules,
    images,
    address,
    selectedPoint,
    contract,
    activeUser?.schoolId,
    activeUser?.schoolAbbr,
  ]);

  async function authedFetchWithLockToken(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    const id = searchParams.get("id");
    if (!id) throw new Error("Missing draft ID");
    if (!editToken) throw new Error("Missing edit token");

    const buildOptions = (token: string): RequestInit => ({
      ...options,
      headers: {
        ...options?.headers,
        "X-Edit-Lock-Token": token,
      },
    });

    try {
      const response = await authedFetch(url, buildOptions(editToken));

      if (!response.success) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response;
    } catch (error) {
      // 第一次失敗，重新取得 Token 後重試一次
      const newToken = await withLock(() => acquireEditLock(id));
      const retryResponse = await authedFetch(url, buildOptions(newToken));

      if (!retryResponse.success) {
        throw new Error(
          `Retry request failed with status ${retryResponse.status}`
        );
      }

      return retryResponse;
    }
  }

  const syncUpdatedDraft = async () => {
    const id = searchParams.get("id");
    if (!id) return;
    if (!lastSavedDraft.current) return;
    if (!editToken) throw new Error("Missing edit token");

    const diff = getDraftDiff();
    if (!diff || Object.keys(diff).length === 0) return;
    setSyncStatus("syncing");

    try {
      await authedFetchWithLockToken(path("/api/shop-draft"), {
        method: "PATCH",
        body: JSON.stringify({
          id,
          ...diff,
        }),
      });

      setSyncStatus("success");
    } catch (e) {
      console.error(e);
      setSyncStatus("failed");
    }
  };

  const getDraft = async (id: string): Promise<ShopDraftDto | null> => {
    const apiUrl = new URL(path(`/api/shop-draft/${id}`));
    apiUrl.searchParams.append("versions", "true");
    apiUrl.searchParams.append("school", "true");
    apiUrl.searchParams.append("currentVersion", "true");

    const result = await authedFetch(apiUrl.toString(), { method: "GET" });
    const { success, data, error } = result;
    if (!success) {
      console.error(error);
      return null;
    }
    return plainToInstance(ShopDraftDto, data);
  };

  function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const p = lockRef.current.queue.then(fn, fn) as Promise<T>;
    lockRef.current.queue = p.then(
      () => undefined,
      () => undefined
    );
    return p;
  }

  const acquireEditLock = async (draftId: string): Promise<string> => {
    const url = path(`/api/shop-draft/acquire-lock/${draftId}`);
    const result = await authedFetch(url, { method: "POST", keepalive: true });
    const { success, data, error } = result;
    if (!success) {
      throw new Error(error.message);
    }
    setEditToken(data);
    return data;
  };

  const releaseEditLock = async (draftId: string) => {
    const url = path(`/api/shop-draft/release-lock/${draftId}`);
    setEditToken(null);
    await authedFetch(url, { method: "POST", keepalive: true });
  };

  const submit = async () => {
    if (!selectedPoint || !activeUser || !address) return;
    if (images.length === 0 || images.length > 10) return;

    const schedules = toBackendSchedules(workSchedules);
    if (schedules.length === 0) return;

    const id = searchParams.get("id");

    const dto = {
      draftId: id,
      overwrite: true,
    };

    const response = await authedFetchWithLockToken(
      path("/api/shop-draft/submit"),
      {
        method: "POST",
        body: JSON.stringify(dto),
        idempotent: true,
      }
    );

    const { success, error } = response;
    if (!success) {
      showModal({
        title: "提交失敗",
        description: error.message,
        showDismissButton: true,
      });
      return;
    }

    showModal({
      title: "提交成功",
      buttons: [
        {
          label: "關閉",
          role: "primary",
          style: "btn-primary",
          onClick: () => navigate("/shops/drafts"),
        },
      ],
    });
  };

  const toContactInfoDto = (c: ContactInfo): ContactInfoDto => {
    return {
      category: c.category,
      content: c.content,
      href: c.href || buildHref(c.category, c.content),
    };
  };

  const isDeepEqual = (a: any, b: any): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  const getDraftDiff = (
    updateLatest: boolean = true
  ): Partial<ShopDraftDto> | null => {
    if (!lastSavedDraft.current) return null;

    const currentDraft: ShopDraftDto = {
      ...lastSavedDraft.current,
      title: title.trim(),
      subtitle: subTitle.trim(),
      description: description.trim(),
      discount: discount.trim(),
      address: address.trim(),
      images,
      latitude: selectedPoint?.lat ?? null,
      longitude: selectedPoint?.lng ?? null,
      contactInfo: contactInfo.map(toContactInfoDto),
      contract,
      workSchedules: toBackendSchedules(workSchedules),
    };

    const lastSaved = lastSavedDraft.current;
    const diff: Partial<ShopDraftDto> = {};

    // 如果原本完全沒有草稿（第一次儲存），直接回傳全部變更
    if (!lastSaved) {
      lastSavedDraft.current = currentDraft;
      return currentDraft;
    }

    // 逐一檢查欄位是否有變更
    (Object.keys(currentDraft) as (keyof ShopDraftDto)[]).forEach((key) => {
      const currentValue = currentDraft[key];
      const lastValue = lastSaved[key];

      if (!isDeepEqual(currentValue, lastValue)) {
        // 這裡強制轉型確保類型符合 Partial<ShopDraftDto>
        diff[key] = currentValue as any;
      }
    });

    if (updateLatest) {
      lastSavedDraft.current = currentDraft;
    }

    return diff;
  };

  const handleSubmit = async () => {
    if (viewMode === "edit_after_submit") {
      await syncUpdatedDraft();
    }
    let isAvailable = true;
    const texts = [title, description, discount, address];
    if (texts.filter((t) => t !== "").length != texts.length) {
      isAvailable = false;
    }

    const arrays = [contactInfo, images, toBackendSchedules(workSchedules)];
    if (arrays.filter((t) => t.length >= 1).length != arrays.length) {
      isAvailable = false;
    }

    if (!contract) {
      isAvailable = false;
    }

    if (hasWorkScheduleOverlap(workSchedules)) {
      isAvailable = false;
    }

    setShowHint(true);
    if (!isAvailable) {
      showToast({
        title: "尚有未完成的欄位",
        placement: "top-right",
        replace: true,
        icon: <CircleAlert className="text-error" />,
        duration: 5_000, // 5s
      });
      return;
    }

    try {
      if (isUploading) {
        showToast({
          title: "上傳中請稍後",
          icon: <CloudUpload className="text-error" />,
        });
        return;
      }
      setIsUploading(true);
      await submit();
      setIsUploading(false);
    } catch (error) {
      showModal({
        title: "提交失敗",
        description: "",
        showDismissButton: true,
        buttons: [
          {
            label: "重試",
            style: "btn-primary",
            role: "primary",
            onClick: submit,
          },
          { label: "關閉" },
        ],
      });
    }
  };

  const showLeaveHint = (): boolean => {
    const diff = getDraftDiff(false);
    const hasChanged = Object.keys(diff ?? {}).length > 0;
    return viewMode === "edit_after_submit" && hasChanged;
  };

  return (
    <div className="select-none md:select-auto">
      <Navbar syncStatus={syncStatus} showLeaveHint={showLeaveHint()} />

      <main className="pt-18 min-h-screen bg-base-300 flex justify-center">
        <div className="max-w-xl w-full p-4 space-y-4">
          <FormHeader />

          {currentVersion?.rejectReason && (
            <RejectReasonBlock reason={currentVersion.rejectReason} />
          )}

          <ShopTitleBlock
            title={title}
            showHint={showHint}
            setTitle={setTitle}
          />

          <ShopSubtitleBlock subTitle={subTitle} setSubtitle={setSubTitle} />

          <ShopDescriptionBlock
            description={description}
            showHint={showHint}
            setDescription={setDescription}
          />

          <ShopDiscountBlock
            discount={discount}
            showHint={showHint}
            setDiscount={setDiscount}
          />

          <ShopSignedSchool
            schoolAbbreviation={activeUser?.schoolAbbr ?? "UNKNOWN"}
            showHint={showHint}
          />

          <ShopContactInfoBlock
            contactInfo={contactInfo}
            showHint={showHint}
            setContactInfo={setContactInfo}
          />

          <ShopImagesBlock
            images={images}
            showHint={showHint}
            setImages={setImages}
          />

          <ShopLocationBlock
            address={address}
            selectedPoint={selectedPoint}
            showHint={showHint}
            setAddress={setAddress}
            setSelectedPoint={setSelectedPoint}
          />

          <ShopContractBlock
            contract={contract}
            showHint={showHint}
            setContract={setContract}
          />

          <ShopWorkSchedulesBlock
            workSchedules={workSchedules}
            showHint={showHint}
            setWorkSchedules={setWorkSchedules}
          />

          <div className="flex space-x-4">
            <Link
              to={`/shops/preview?id=${searchParams.get("id")}`}
              className="btn flex-1 bg-base-100"
            >
              預覽
            </Link>
            <button onClick={handleSubmit} className="btn btn-primary flex-1">
              提交
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopRegisterForm;
