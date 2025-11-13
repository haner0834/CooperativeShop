import { Ellipsis, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FormHeader from "./FormHeader";
import ShopTitleBlock from "./ShopTitleBlock";
import ShopDescriptionBlock from "./ShopDescriptionBlock";
import ShopContactInfoBlock from "./ShopContactInfoBlock";
import ShopImagesBlock from "./ShopImagesBlock";
import ShopLocationBlock from "./ShopLocationBlock";
import ShopWorkSchedulesBlock, {
  type WorkSchedule,
  DEFAULT_WORKSCHEDULE,
} from "./ShopWorkSchedulesBlock";
import type { SelectedImage } from "../../types/selectedImage";
import type { ContactInfo } from "../../types/shop";
import { categoryMap } from "../../utils/contactInfoMap";

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-none">
        <button className="btn btn-square btn-ghost">
          <Menu />
        </button>
      </div>
      <div className="flex-1 text-center">
        <a className="text-base font-semibold">特約商家註冊</a>
      </div>
      <div className="flex-none">
        <button className="btn btn-square btn-ghost">
          <Ellipsis />
        </button>
      </div>
    </div>
  );
};

const ShopRegisterForm = () => {
  const [title, setTitle] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([
    DEFAULT_WORKSCHEDULE,
  ]);

  const [images, setImages] = useState<SelectedImage[]>([]); // 用 base64 URL 預覽

  useEffect(() => {
    if (!searchParams.get("id")) {
      const id = crypto.randomUUID();
      searchParams.set("id", id);
      setSearchParams(searchParams, { replace: true });
    }

    // read data if existed
    const draft = localStorage.getItem("SHOP_DRAFT_" + searchParams.get("id"));
    if (draft) {
      const shop = JSON.parse(draft);
      setTitle(shop.title);
      setDescription(shop.description);
      setWorkSchedules(shop.workSchedules);

      // update contact info
      const contactInfo: ContactInfo[] = shop.contactInfo.map(
        (props: Omit<ContactInfo, "validator" | "formatter">) => {
          const { icon, ...rest } = props;
          return {
            icon: categoryMap[props.category].icon,
            ...rest,
            validator: categoryMap[props.category].validator,
            formatter: categoryMap[props.category].formatter,
          };
        }
      );
      setContactInfo(contactInfo);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const handler = setTimeout(() => {
      const shop = { title, description, contactInfo, workSchedules, images };
      localStorage.setItem("SHOP_DRAFT_" + id, JSON.stringify(shop));
    }, 1000); // ← delay 1s

    return () => clearTimeout(handler); // ← Cancel the previous timer (to prevent duplicate storage).
  }, [title, description, contactInfo, workSchedules, images]);

  return (
    <div className="select-none md:select-auto">
      <Navbar />

      <main className="pt-18 min-h-screen bg-base-300 flex justify-center">
        <div className="max-w-xl w-full p-4 space-y-4">
          <FormHeader />

          <ShopTitleBlock title={title} setTitle={setTitle} />

          <ShopDescriptionBlock
            description={description}
            setDescription={setDescription}
          />

          <ShopContactInfoBlock
            contactInfo={contactInfo}
            setContactInfo={setContactInfo}
          />

          <ShopImagesBlock images={images} setImages={setImages} />

          <ShopLocationBlock />

          <ShopWorkSchedulesBlock
            workSchedules={workSchedules}
            setWorkSchedules={setWorkSchedules}
          />

          <div className="flex space-x-4">
            <button className="btn flex-1">預覽</button>
            <button className="btn btn-primary flex-1">提交</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopRegisterForm;
