import { useParams, useSearchParams } from "react-router-dom";
import ShopCard from "../widgets/Shop/ShopCard";
import { useEffect, useState } from "react";
import { useModal } from "../widgets/ModalContext";
import axios from "axios";
import { path } from "../utils/path";
import { getErrorMessage } from "../utils/errors";
import { transformDtoToShop, type Shop } from "../types/shop";
import BackButton from "../widgets/BackButton";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import ThemeToggle from "../widgets/ThemeToggle";

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
        const schoolAbbr = searchParams.get("schoolAbbr");
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

  useEffect(() => {
    a();
  }, []);

  return (
    <div>
      <div className="navbar">
        <div className="navbar-start">
          <BackButton label="" />
        </div>

        <div className="navbar-center">
          <Logo className="h-8 w-auto" />
        </div>

        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </div>
      <main>
        <section className="">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 space-y-2">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} className="w-full" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FilteredShops;
