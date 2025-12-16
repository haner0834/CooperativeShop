import { useParams, useSearchParams } from "react-router-dom";
import ShopCard from "../widgets/Shop/ShopCard";
import { useEffect, useState } from "react";
import { useModal } from "../widgets/ModalContext";
import axios from "axios";
import { path } from "../utils/path";
import { getErrorMessage } from "../utils/errors";
import { transformDtoToShop, type Shop } from "../types/shop";
import BackButton from "../widgets/BackButton";
import ThemeToggle from "../widgets/ThemeToggle";
import { Trash2 } from "lucide-react";
import { useAuthFetch } from "../auth/useAuthFetch";

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
            school: schoolAbbr,
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
    setIsDeletingId(shopId);
    const { success, error } = await authedFetch(path(`/api/shops/${shopId}`));
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
        <section className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 space-y-2">
            {shops.map((shop) => (
              <div className="relative">
                <ShopCard key={shop.id} shop={shop} className="w-full" />

                <div className="absolute top-2 right-2 z-10">
                  <button
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
                  </button>
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
