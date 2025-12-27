import { Bookmark } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Shop } from "../../types/shop";
import { path } from "../../utils/path";
import { useEffect, useState } from "react";
import { useAuthFetch } from "../../auth/useAuthFetch";
import { useToast } from "../Toast/ToastProvider";

const ShopCard = ({ shop, className }: { shop: Shop; className: string }) => {
  const [isSaved, setIsSaved] = useState(false);
  const { authedFetch } = useAuthFetch();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const toggleSave = async () => {
    setIsSaved((prev) => !prev);
    try {
      const {
        success,
        data,
        error: _,
      } = await authedFetch(path(`/api/shops/${shop.id}/save`), {
        method: "POST",
      });
      if (!success) setIsSaved((prev) => !prev);
      setIsSaved(data.saved);
    } catch (err: any) {
      setIsSaved((prev) => !prev);
      const target = "/shops";
      showToast({
        title: "請先登入帳號",
        replace: true,
        buttons: [
          {
            label: "繼續",
            variant: "btn-primary",
            onClick: () => navigate(`/choose-school?to=${target})}`),
          },
        ],
      });
    }
  };

  useEffect(() => {
    setIsSaved(shop.isSaved ?? false);
  }, [shop.isSaved]);

  return (
    <Link to={`/shops/${shop.id}`} className="flex-none">
      <article className="relative space-y-2 transition-transform ease-in-out duration-300 hover:scale-98">
        <img
          src={shop.thumbnailLink}
          className={`${className} aspect-[5/3] object-cover rounded-box`}
        />

        <div className="">
          <div className="flex space-x-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold">{shop.title}</h3>

              <p className="opacity-60 text-sm">{shop.address}</p>
            </div>

            <button
              className="btn btn-square btn-ghost btn-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSave();
              }}
            >
              <Bookmark
                className={`${isSaved ? "fill-current" : ""}`}
                size={20}
              />
            </button>
          </div>

          <div className="space-x-2"></div>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-100 border border-base-300 w-fit">
          <span
            className={`status w-2.5 h-2.5 ${
              shop.isOpen ? "status-success" : "status-error"
            }`}
          ></span>
          <span
            className={`text-xs font-semibold tracking-wide ${
              shop.isOpen ? "text-success" : "text-error"
            }`}
          >
            {shop.isOpen ? "營業中" : "休息中"}
          </span>
        </div>
      </article>
    </Link>
  );
};

export default ShopCard;
