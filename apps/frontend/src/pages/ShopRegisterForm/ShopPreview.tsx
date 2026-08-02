import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fromContactInfoDto, ShopDraftDto, type Shop } from "../../types/shop";
import { useModal } from "../../widgets/ModalContext";
import { ShopDetailContent } from "../ShopDetail";
import { plainToInstance } from "class-transformer";
import { path } from "../../utils/path";
import { useAuthFetch } from "../../auth/useAuthFetch";

const R2_PUBLIC_URL = "https://image.cooperativeshops.org";

const ShopPreview = () => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [searchParams] = useSearchParams();
  const { showModal } = useModal();
  const { authedFetch } = useAuthFetch();

  useEffect(() => {
    const a = async () => {
      const id = searchParams.get("id");
      if (!id) {
        showModal({
          title: "Missing ID in search params.",
          description: "Contact damn developer",
          showDismissButton: true,
        });

        return;
      }

      const draft = await getDraft(id);
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
      const { workSchedules, school, ...data } = draft;
      const shop: Shop = {
        ...data,
        id: crypto.randomUUID(),
        images: data.images.map((l) => ({
          fileUrl: R2_PUBLIC_URL + "/" + l.uploadInfo?.fileKey,
          thumbnailUrl: R2_PUBLIC_URL + "/" + l.uploadInfo?.thumbnailKey,
        })),
        thumbnailLink:
          data.images.length > 0
            ? data.images.map((l) => l.previewUrl)[0] ?? ""
            : "",
        isOpen: false,
        longitude: data.longitude ?? 0,
        latitude: data.latitude ?? 0,
        workSchedules,
        contactInfo: data.contactInfo.map(fromContactInfoDto),
        schoolAbbr: school.abbr ?? "UNKNOWN",
        schoolId: school.id,
      };
      setShop(shop);
    };
    a();
  }, []);

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

  return <ShopDetailContent shop={shop} isPreview={true} />;
};

export default ShopPreview;
