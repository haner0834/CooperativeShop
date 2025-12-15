import { CircleAlert, CircleDotDashed, CloudUpload, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormHeader from "./FormHeader";
import ShopTitleBlock from "./ShopTitleBlock";
import ShopDescriptionBlock from "./ShopDescriptionBlock";
import ShopContactInfoBlock from "./ShopContactInfoBlock";
import ShopImagesBlock from "./ShopImagesBlock";
import ShopLocationBlock from "./ShopLocationBlock";
import ShopWorkSchedulesBlock from "./ShopWorkSchedulesBlock";
import { DEFAULT_WORKSCHEDULE } from "../../types/shop";
import type { ImageDto, SelectedImage } from "../../types/selectedImage";
import type {
  ContactInfo,
  CreateShopDto,
  PersistentShopDraft,
} from "../../types/shop";
import type { Point } from "./ShopLocationBlock";
import { getDraft } from "../../utils/draft";
import ShopDiscountBlock from "./ShopDiscountBlock";
import { useToast } from "../../widgets/Toast/ToastProvider";
import { useAuth } from "../../auth/AuthContext";
import { useModal } from "../../widgets/ModalContext";
import {
  toBackendSchedules,
  type WorkSchedule,
} from "../../types/workSchedule";
import ShopSignedSchool from "./ShopSignedSchool";
import ShopSubtitleBlock from "./ShopSubtitleBlock";
import { buildHref } from "../../utils/contactInfoMap";
import { useAuthFetch } from "../../auth/useAuthFetch";
import { path } from "../../utils/path";

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

const ShopRegisterForm = () => {
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [address, setAddress] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([
    DEFAULT_WORKSCHEDULE,
  ]);
  const [showHint, setShowHint] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { authedFetch } = useAuthFetch();

  const [images, setImages] = useState<SelectedImage[]>([]); // 用 base64 URL 預覽

  useEffect(() => {
    if (!searchParams.get("id")) {
      const id = crypto.randomUUID();
      searchParams.set("id", id);
      setSearchParams(searchParams, { replace: true });
    }

    const id = searchParams.get("id") ?? "FUCK";
    const draft = getDraft(id);
    if (draft) {
      setTitle(draft.data.title);
      setSubTitle(draft.data.subTitle ?? "");
      setDescription(draft.data.description);
      setDiscount(draft.data.discount);
      setImages(
        draft.data.images.map((image) => {
          const { status, isUploading, ...rest } = image;
          return {
            ...rest,
            status: status === "success" ? "success" : "error",
            isUploading: false,
          };
        })
      );
      setWorkSchedules(draft.data.workSchedules);
      setAddress(draft.data.address);
      setSelectedPoint(draft.data.selectedPoint);
      setContactInfo(draft.data.contactInfo);
    }
  }, []);

  // Force login
  const { activeUser, hasAttemptedRestore } = useAuth();
  useEffect(() => {
    const toLogin = () => {
      const target = `/shops/register?id=${searchParams.get("id")}`;
      const url = `/choose-school?to=${encodeURIComponent(target)}`;
      navigate(url);
    };
    if (hasAttemptedRestore && !activeUser) {
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
  }, [hasAttemptedRestore, activeUser]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const handler = setTimeout(() => {
      const key = "SHOP_DRAFT_" + id;
      const contactInfoToStore = contactInfo.map((info) => {
        const { icon, formatter, validator, ...infoToStore } = info;
        return infoToStore;
      });
      const shop: PersistentShopDraft = {
        key,
        dateISOString: new Date().toISOString(),
        data: {
          title,
          subTitle,
          description,
          discount,
          contactInfo: contactInfoToStore,
          workSchedules,
          images,
          selectedPoint,
          address,
          schoolId: activeUser?.schoolId ?? "UNKNOWN",
          schoolAbbr: activeUser?.schoolAbbr ?? "UNKNOWN",
        },
      };
      localStorage.setItem(key, JSON.stringify(shop));
    }, 500); // ← delay 0.5s

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
    activeUser?.schoolId,
    activeUser?.schoolAbbr,
  ]);

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
    if (!selectedPoint) return;
    if (!activeUser) return;
    if (images.length === 0 || images.length > 10) return;

    const contactInfoDto = contactInfo.map((c) => ({
      category: c.category,
      content: c.content,
      href: c.href || buildHref(c.category, c.content),
    }));
    const imageDtos: ImageDto[] = images
      .filter((image) => image.uploadInfo !== undefined)
      .map((image) => ({
        fileKey: image.uploadInfo!.fileKey,
        thumbnailKey: image.uploadInfo!.thumbnailKey,
      }));

    const thumbnailKey = images[0].uploadInfo?.thumbnailKey;
    if (!thumbnailKey) return;

    const shopDto: CreateShopDto = {
      title,
      subTitle: subTitle || null,
      description,
      contactInfo: contactInfoDto,
      schoolId: activeUser.schoolId,
      images: imageDtos,
      thumbnailKey,
      address: selectedPoint.title,
      longitude: selectedPoint.lng,
      latitude: selectedPoint.lat,
      schedules: toBackendSchedules(workSchedules),
      discount: discount || null,
    };

    const response = await authedFetch(path("/api/shops"), {
      method: "POST",
      body: JSON.stringify(shopDto),
    });

    const { success, error } = response;
    if (!success) {
      showModal({
        title: "上傳失敗",
        description: error.message,
        showDismissButton: true,
      });
      return;
    }

    deleteCurrentDraft();
    showModal({
      title: "上傳成功",
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

  const handleSubmit = async () => {
    let isAvailable = true;
    const texts = [title, description, discount, address];
    if (texts.filter((t) => t !== "").length != texts.length) {
      isAvailable = false;
    }

    const arrays = [contactInfo, images];
    if (arrays.filter((t) => t.length >= 1).length != arrays.length) {
      isAvailable = false;
    }

    if (workSchedules.flatMap((w) => w.weekdays).length === 0) {
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
