import { CircleAlert, CircleDotDashed, CloudUpload, Plus } from "lucide-react";
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
  type ContactInfoDto,
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

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-none">
        <Link to="/shops/register" className="btn btn-circle btn-ghost">
          <Plus />
        </Link>
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold">特約商家註冊</h1>
      </div>
      <div className="flex-none">
        <Link className="btn btn-circle btn-ghost" to="/shops/drafts">
          <CircleDotDashed />
        </Link>
      </div>
    </div>
  );
};

interface EditLockRef {
  id: string | null;
  generation: number;
  queue: Promise<void>;
}

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

  const [images, setImages] = useState<SelectedImage[]>([]); // 用 base64 URL 預覽

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
                label: "關閉並刪除草稿",
                style: "btn-error",
                role: "primary",
                onClick: () => {
                  deleteCurrentDraft();
                  navigate("/shops/drafts", { replace: true });
                },
              },
            ],
          });
          return;
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
        setAddress(draft.address);
        setSelectedPoint(selectedPoint);
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
  }, [activeUser]);

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
      } catch (error) {
        console.error("取得編輯鎖失敗:", error);
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
    const handler = setTimeout(syncUpdatedDraft, 1500); // ← delay 1.5s

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

  const syncUpdatedDraft = () => {
    const id = searchParams.get("id");
    if (!id) return;
    if (!lastSavedDraft.current) return;
    if (!editToken) throw new Error("Missing edit token");

    const diff = getDraftDiff();
    if (!diff || Object.keys(diff).length === 0) return;
    authedFetch(path(`/api/shop-draft`), {
      method: "PATCH",
      headers: {
        "X-Edit-Lock-Token": editToken,
      },
      body: JSON.stringify({
        id,
        ...diff,
      }),
    }).catch(async () => {
      try {
        const newToken = await withLock(() => acquireEditLock(id));
        await authedFetch(path(`/api/shop-draft`), {
          method: "PATCH",
          headers: {
            "X-Edit-Lock-Token": newToken,
          },
          body: JSON.stringify({
            id,
            ...diff,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    });
  };

  const getDraft = async (id: string): Promise<ShopDraftDto | null> => {
    const apiUrl = path(`/api/shop-draft/${id}`);
    const result = await authedFetch(apiUrl, { method: "GET" });
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

  const deleteCurrentDraft = () => {
    const draftId = searchParams.get("id");
    if (!draftId) {
      showToast({ title: "缺少 Draft ID" });
      throw new Error("Fuck you");
    }

    const key = `SHOP_DRAFT_${draftId}`;

    localStorage.removeItem(key);
  };

  const submit = async () => {
    if (!selectedPoint || !activeUser || !address) return;
    if (images.length === 0 || images.length > 10) return;

    const schedules = toBackendSchedules(workSchedules);
    if (schedules.length === 0) return;

    const id = searchParams.get("id");

    const dto = {
      draftId: id,
    };

    const response = await authedFetch(path("/api/shop-draft/submit"), {
      method: "POST",
      body: JSON.stringify(dto),
    });

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

  const getDraftDiff = (): Partial<ShopDraftDto> | null => {
    if (!lastSavedDraft.current) return null;

    const currentDraft: ShopDraftDto = {
      ...lastSavedDraft.current,
      title,
      subtitle: subTitle,
      description,
      discount,
      address,
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
        console.log(key, currentValue, lastValue);
        // 這裡強制轉型確保類型符合 Partial<ShopDraftDto>
        diff[key] = currentValue as any;
      }
    });

    // 比對完成後，更新 lastSavedDraft 為最新的 state
    lastSavedDraft.current = currentDraft;

    return diff;
  };

  const handleSubmit = async () => {
    let isAvailable = true;
    const texts = [title, description, discount, address];
    if (texts.filter((t) => t !== "").length != texts.length) {
      isAvailable = false;
    }

    const arrays = [contactInfo, images, toBackendSchedules(workSchedules)];
    if (arrays.filter((t) => t.length >= 1).length != arrays.length) {
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

  return (
    <div className="select-none md:select-auto">
      <Navbar />

      <main className="pt-18 min-h-screen bg-base-300 flex justify-center">
        <div className="max-w-xl w-full p-4 space-y-4">
          <FormHeader />

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
