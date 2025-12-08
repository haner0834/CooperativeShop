import { CircleAlert, CircleDotDashed, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormHeader from "./FormHeader";
import ShopTitleBlock from "./ShopTitleBlock";
import ShopDescriptionBlock from "./ShopDescriptionBlock";
import ShopContactInfoBlock from "./ShopContactInfoBlock";
import ShopImagesBlock from "./ShopImagesBlock";
import ShopLocationBlock from "./ShopLocationBlock";
import ShopWorkSchedulesBlock from "./ShopWorkSchedulesBlock";
import { DEFAULT_WORKSCHEDULE } from "../../types/shop";
import type { SelectedImage } from "../../types/selectedImage";
import type { ContactInfo, PersistentShopDraft } from "../../types/shop";
import type { Point } from "./ShopLocationBlock";
import { getDraft } from "../../utils/draft";
import ShopDiscountBlock from "./ShopDiscountBlock";
import { useToast } from "../../widgets/Toast/ToastProvider";
import { useAutoLogin } from "../../utils/useAuthLogin";
import { useAuth } from "../../auth/AuthContext";
import { useModal } from "../../widgets/ModalContext";
import type { WorkSchedule } from "../../types/workSchedule";
import ShopSignedSchool from "./ShopSignedSchool";

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-none">
        <a href="/shops/register" className="btn btn-circle btn-ghost">
          <Plus />
        </a>
      </div>
      <div className="flex-1 text-center">
        <a className="text-base font-semibold">特約商家註冊</a>
      </div>
      <div className="flex-none">
        <a className="btn btn-circle btn-ghost" href="/shops/drafts">
          <CircleDotDashed />
        </a>
      </div>
    </div>
  );
};

const ShopRegisterForm = () => {
  const [title, setTitle] = useState("");
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
  const { showToast } = useToast();
  const { showModal } = useModal();
  const navigate = useNavigate();

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
      setDescription(draft.data.description);
      setDiscount(draft.data.discount);
      setImages(draft.data.images);
      setWorkSchedules(draft.data.workSchedules);
      setAddress(draft.data.address);
      setSelectedPoint(draft.data.selectedPoint);
      setContactInfo(draft.data.contactInfo);
    }
  }, []);

  // Force login
  const hasAttemptedRestore = useAutoLogin();
  const { activeUser } = useAuth();
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

  const handleSubmit = () => {
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
            <a
              href={`/shops/preview?id=${searchParams.get("id")}`}
              className="btn flex-1"
            >
              預覽
            </a>
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
