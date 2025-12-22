import { Bookmark, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import type { Shop } from "../../types/shop";
import { path } from "../../utils/path";
import { useEffect, useState } from "react";
import { useAuthFetch } from "../../auth/useAuthFetch";

const ShopCard = ({ shop, className }: { shop: Shop; className: string }) => {
  const [isSaved, setIsSaved] = useState(false);
  const { authedFetch } = useAuthFetch();

  const toggleSave = async () => {
    setIsSaved((prev) => !prev);
    const {
      success,
      data,
      error: _,
    } = await authedFetch(path(`/api/shops/${shop.id}/save`), {
      method: "POST",
    });
    if (!success) setIsSaved((prev) => !prev);
    setIsSaved(data.saved);
  };

  useEffect(() => {
    setIsSaved(shop.isSaved ?? false);
  }, [shop.isSaved]);

  const badgeStyle = shop.isOpen ? "badge-success" : "badge-error";
  return (
    <Link to={`/shops/${shop.id}`} className="flex-none">
      <article className="space-y-2 transition-transform ease-in-out duration-300 hover:scale-98">
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
              className="btn btn-square btn-sm"
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

          <div className="space-x-2">
            <span className={`badge ${badgeStyle} badge-soft uppercase mt-2`}>
              <Tag className="w-4 h-4" /> {shop.isOpen ? "open" : "closed"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ShopCard;
