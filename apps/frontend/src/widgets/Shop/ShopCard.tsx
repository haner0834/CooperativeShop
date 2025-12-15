import { Tag } from "lucide-react";
import { Link } from "react-router-dom";
import type { Shop } from "../../types/shop";
import { path } from "../../utils/path";

const ShopCard = ({ shop, className }: { shop: Shop; className: string }) => {
  const badgeStyle = shop.isOpen ? "badge-success" : "badge-error";
  return (
    <Link
      to={`/shops/${shop.id}`}
      className="flex-none"
      onClick={() =>
        fetch(path(`/api/shops/${shop.id}/view`), { method: "POST" })
      }
    >
      <article className="space-y-2 transition-transform ease-in-out duration-300 hover:scale-98">
        <img
          src={shop.thumbnailLink}
          className={`${className} aspect-[5/3] object-cover rounded-box`}
        />

        <div className="">
          <h3 className="text-lg font-bold">{shop.title}</h3>

          <p className="opacity-60 text-sm">{shop.address}</p>

          <div className="space-x-2">
            <span className={`badge ${badgeStyle} badge-soft uppercase mt-2`}>
              <Tag className="w-4 h-4" /> {shop.isOpen ? "open" : "closed"}
            </span>
            {/* <span className={`badge badge-info badge-soft uppercase mt-2`}>
              <Phone className="w-4 h-4" /> {shop?.contactInfo[0].content ?? "UNKNOWN"}
            </span> */}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ShopCard;
