import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { transformSchedules, type Shop } from "../../types/shop";
import { useModal } from "../../widgets/ModalContext";
import { getDraft } from "../../utils/draft";
import { ShopDetailContent } from "../ShopDetail";

const R2_PUBLIC_URL = "https://image.cooperativeshops.org";

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
      images: data.images.map((l) => ({
        fileUrl: R2_PUBLIC_URL + "/" + l.uploadInfo?.fileKey,
        thumbnailUrl: R2_PUBLIC_URL + "/" + l.uploadInfo?.thumbnailKey,
      })),
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
