import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ShopCard from "../widgets/Shop/ShopCard";
import { useEffect, useState } from "react";
import { useModal } from "../widgets/ModalContext";
import axios from "axios";
import { path } from "../utils/path";
import { getErrorMessage } from "../utils/errors";
import {
  transformDtoToShop,
  type PersistentShopDraft,
  type ResponseShopDto,
  type Shop,
} from "../types/shop";
import BackButton from "../widgets/BackButton";
import ThemeToggle from "../widgets/ThemeToggle";
import { Ellipsis, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import { useAuthFetch } from "../auth/useAuthFetch";
import type { SelectedImage } from "../types/selectedImage";
import { fromBackendSchedules } from "../types/workSchedule";

type ShopFilter =
  | "all"
  | "school"
  | "saved"
  | "hot"
  | "recent-visited"
  | "nearby";

const shopFilters: ShopFilter[] = [
  "all",
  "school",
  "saved",
  "hot",
  "recent-visited",
  "nearby",
];

const FilteredShops = () => {
  const { filter } = useParams();
  const [searchParams] = useSearchParams();
  const { showModal } = useModal();
  const [shops, setShops] = useState<Shop[]>([]);
  const [schoolAbbr] = useState(() => searchParams.get("schoolAbbr"));
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const { authedFetch } = useAuthFetch();
  const navigate = useNavigate();

  const a = async () => {
    if (!shopFilters.includes((filter ?? "") as any)) {
      showModal({
        title: "fuck u bot",
      });
      return;
    }

    switch (filter) {
      case "all":
        break;
      case "school":
        if (!schoolAbbr) {
          showModal({ title: "Missing school abbr" });
          return;
        }

        const { data: resData } = await axios.get(path("/api/shops"), {
          params: {
            schoolAbbr,
          },
        });
        const { success, data, error } = resData;
        if (!success) {
          showModal({
            title: "獲取商家失敗",
            description: getErrorMessage(error.code),
          });
          return;
        }

        setShops(data.map((d: any) => transformDtoToShop(d)));

        break;
      case "saved":
        break;
      case "hot":
        break;
      case "recent-visited":
        break;
      case "nearby":
        break;
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (isDeletingId === shopId) return;
    setIsDeletingId(shopId);
    const { success, error } = await authedFetch(path(`/api/shops/${shopId}`), {
      method: "DELETE",
    });
    if (success) {
      setShops([...shops].filter((s) => s.id != shopId));
      showModal({
        title: "商家已刪除",
        showDismissButton: true,
      });
    } else {
      showModal({
        title: "刪除失敗",
        description: getErrorMessage(error),
        showDismissButton: true,
        buttons: [{ label: "關閉" }],
      });
    }
    setIsDeletingId(null);
  };

  const showDeleteModal = (shopId: string) => {
    showModal({
      title: "確認刪除？",
      description: "此操作無法復原",
      buttons: [
        { label: "取消" },
        {
          label: "刪除",
          role: "error",
          style: "btn-error",
          onClick: () => handleDeleteShop(shopId),
        },
      ],
    });
  };

  const getFileKey = (fileUrl: string) => {
    const R2_PUBLIC_URL = "https://image.cooperativeshops.org";
    return fileUrl.replace(R2_PUBLIC_URL + "/", "");
  };

  const handleUpdate = async (shopId: string) => {
    const { data: resData } = await axios.get(path(`/api/shops/${shopId}`));
    const { success, data, error } = resData;
    if (!success) {
      showModal({
        title: "無法獲取商家資訊",
        description: getErrorMessage(error.code),
      });
      return;
    }
    const shop: ResponseShopDto = data;
    const key = `SHOP_DRAFT_${shopId}`;
    const { images: _, workSchedules: wb, ...rest } = transformDtoToShop(shop);
    const images: SelectedImage[] = shop.images.map((image) => ({
      localId: crypto.randomUUID() as string,
      isUploading: false,
      uploadProgress: 0,
      previewUrl: image.thumbnailUrl,
      status: "success",
      uploadInfo: {
        uploadUrl: "",
        thumbnailUploadUrl: "",
        fileKey: getFileKey(image.fileUrl),
        thumbnailKey: getFileKey(image.thumbnailUrl),
      },
    }));
    const selectedPoint = {
      id: crypto.randomUUID(),
      title: shop.address,
      lat: shop.latitude,
      lng: shop.longitude,
    };
    const shopDraft: PersistentShopDraft = {
      key,
      dateISOString: new Date().toISOString(),
      data: {
        ...rest,
        images,
        discount: shop.discount ?? "",
        selectedPoint,
        mode: "edit",
        workSchedules: fromBackendSchedules(shop.workSchedules),
      },
    };

    localStorage.setItem(key, JSON.stringify(shopDraft));

    navigate(`/shops/register?id=${shopId}`);
  };

  const closeDropdown = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.stopPropagation();
    (document.activeElement as HTMLElement | null)?.blur();
  };

  useEffect(() => {
    a();
  }, []);

  return (
    <div>
      <div className="navbar fixed bg-base-100 z-50 shadow-xs">
        <div className="navbar-start">
          <BackButton label="" />
        </div>

        <div className="navbar-center">
          <h1 className="font-semibold">已註冊店家 - {schoolAbbr}</h1>
        </div>

        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </div>
      <main className="pt-16">
        {shops.length === 0 && (
          <div className="min-h-screen relative flex flex-col justify-center items-center overflow-hidden space-y-4">
            <div className="flex space-x-2">
              <ShoppingCart />
              <h2>尚無商家</h2>
            </div>
            <Link
              to="/shops/drafts"
              className="btn btn-primary btn-wide rounded-full"
            >
              建立商家草稿
            </Link>
            <ShoppingCart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 rotate-36 -z-10 opacity-5" />
          </div>
        )}
        <section className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 space-y-2">
            {shops.map((shop) => (
              <div className="relative">
                <ShopCard key={shop.id} shop={shop} className="w-full" />

                <div className="absolute top-2 right-2 z-10">
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-circle btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Ellipsis className="w-4 h-4" />
                    </div>

                    <ul
                      tabIndex={-1}
                      className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-sm"
                    >
                      <li>
                        <button onClick={() => handleUpdate(shop.id)}>
                          <Pencil className="w-5 h-5" />
                          編輯
                        </button>
                      </li>

                      <li>
                        <a
                          className="text-error"
                          onClick={(e) => {
                            closeDropdown(e);
                            showDeleteModal(shop.id);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                          刪除
                        </a>
                      </li>
                    </ul>
                  </div>
                  {/* <button
                    className="btn btn-circle md:btn-sm bg-base-100"
                    disabled={isDeletingId === shop.id}
                    onClick={() => {
                      showModal({
                        title: "確認刪除？",
                        description: "此操作無法復原",
                        buttons: [
                          { label: "取消" },
                          {
                            label: "刪除",
                            role: "error",
                            style: "btn-error",
                            onClick: () => handleDeleteShop(shop.id),
                          },
                        ],
                      });
                    }}
                  >
                    <Trash2 className="w-5 h-5 text-error" />
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FilteredShops;
