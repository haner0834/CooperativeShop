import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { transformSchedules, type Shop } from "../../types/shop";
import { useModal } from "../../widgets/ModalContext";
import { getDraft } from "../../utils/draft";
import { ShopDetailContent } from "../ShopDetail";

const ShopPreview = () => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [searchParams] = useSearchParams();
  const { showModal } = useModal();

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      showModal({
        title: "Missing ID in search params.",
        description: "Contact damn developer",
        showDismissButton: true,
      });

      return;
    }

    const draft = getDraft(id);
    if (!draft) {
      showModal({
        title: "找不到草稿",
        description: "",
        showDismissButton: true,
        buttons: [
          {
            label: "關閉",
          },
        ],
      });
      return;
    }
    const { workSchedules: storedWorkSchedules, ...data } = draft.data;
    const shop: Shop = {
      ...data,
      id: crypto.randomUUID(),
      imageLinks: data.images.map((l) => l.previewUrl),
      thumbnailLink:
        data.images.length > 0 ? data.images.map((l) => l.previewUrl)[0] : "",
      isOpen: false,
      longitude: data.selectedPoint?.lng ?? 0,
      latitude: data.selectedPoint?.lat ?? 0,
      workSchedules: transformSchedules(storedWorkSchedules),
    };
    setShop(shop);
  }, []);

  return <ShopDetailContent shop={shop} isPreview={true} />;
};

export default ShopPreview;
