import { useEffect, useState } from "react";
import {
  Bookmark,
  ChevronRight,
  IdCard,
  Map,
  Menu,
  Phone,
  School,
  Search,
} from "lucide-react";
import Sidebar from "../widgets/Sidebar";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import ThemeToggle from "../widgets/ThemeToggle";
import type { Shop } from "../types/shop";

export const testShops: Shop[] = [
  {
    id: "1",
    title: "Brew & Bloom Café",
    description:
      "A warm café known for its floral-themed interior and artisan coffee.",
    phoneNumbers: ["+886912345678"],
    googleMapsLink:
      "https://www.google.com/maps/place/Apple+Park/@37.3349,-122.0090,17z",
    imageLinks: [
      "https://picsum.photos/800/600?random=1",
      "https://picsum.photos/800/600?random=2",
    ],
    thumbnailLink: "https://picsum.photos/400/300?random=3",
    discount: "10% off for students",
    address: "No. 25, Lane 12, Yongkang St., Taipei City",
    longitude: 121.5291,
    latitude: 25.0335,
    isOpen: true,
  },
  {
    id: "2",
    title: "Midnight Noodles",
    description:
      "Popular late-night eatery serving traditional Taiwanese noodles and snacks.",
    phoneNumbers: ["+886988776655", "+886222334455"],
    googleMapsLink:
      "https://www.google.com/maps/place/Apple+Park/@37.3349,-122.0090,17z",
    imageLinks: [
      "https://picsum.photos/800/600?random=4",
      "https://picsum.photos/800/600?random=5",
      "https://picsum.photos/800/600?random=6",
    ],
    thumbnailLink: "https://picsum.photos/400/300?random=7",
    discount: null,
    address: "No. 128, Roosevelt Rd., Taipei City",
    longitude: 121.5357,
    latitude: 25.0205,
    isOpen: false,
  },
  {
    id: "3",
    title: "Leafy Market",
    description:
      "Fresh produce and organic groceries with a focus on local farmers.",
    phoneNumbers: ["+886977001122"],
    googleMapsLink:
      "https://www.google.com/maps/place/Apple+Park/@37.3349,-122.0090,17z",
    imageLinks: ["https://picsum.photos/800/600?random=8"],
    thumbnailLink: "https://picsum.photos/400/300?random=9",
    discount: "Spend NT$500, get NT$50 off",
    address: "No. 88, Section 2, Minquan E. Rd., Taipei City",
    longitude: 121.5402,
    latitude: 25.0633,
    isOpen: true,
  },
  {
    id: "4",
    title: "Pixel Studio",
    description:
      "Creative space offering photography, design, and branding services.",
    phoneNumbers: ["+886901112233"],
    googleMapsLink:
      "https://www.google.com/maps/place/Apple+Park/@37.3349,-122.0090,17z",
    imageLinks: [
      "https://picsum.photos/800/600?random=10",
      "https://picsum.photos/800/600?random=11",
    ],
    thumbnailLink: "https://picsum.photos/400/300?random=12",
    discount: "Free consultation for first-time clients",
    address: "No. 9, Alley 5, Xinyi Rd., Taipei City",
    longitude: 121.5651,
    latitude: 25.0329,
    isOpen: true,
  },
  {
    id: "5",
    title: "Sunrise Books",
    description:
      "Independent bookstore featuring local authors and cozy reading spaces.",
    phoneNumbers: ["+886934556677"],
    googleMapsLink:
      "https://www.google.com/maps/place/Apple+Park/@37.3349,-122.0090,17z",
    imageLinks: [
      "https://picsum.photos/800/600?random=13",
      "https://picsum.photos/800/600?random=14",
    ],
    thumbnailLink: "https://picsum.photos/400/300?random=15",
    discount: "Buy 2 get 1 free on weekends",
    address: "No. 33, Ren'ai Rd., Taipei City",
    longitude: 121.5456,
    latitude: 25.0365,
    isOpen: true,
  },
];

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="flex justify-between sm:justify-start items-center mb-4 mx-4">
      <h2 className="font-bold text-2xl">{title}</h2>

      <ChevronRight />
    </div>
  );
};

const ShopCard = ({ shop, className }: { shop: Shop; className: string }) => {
  const badgeStyle = shop.isOpen ? "badge-success" : "badge-error";
  return (
    <article className="space-y-2 flex-none">
      <img
        src={shop.thumbnailLink}
        className={`${className} aspect-[5/3] object-cover rounded-box`}
        // loading="lazy"
      />

      <div className="">
        <h3 className="text-lg font-bold">{shop.title}</h3>

        <p className="opacity-60 text-sm">{shop.address}</p>

        <div className="space-x-2">
          <span className={`badge ${badgeStyle} badge-soft uppercase mt-2`}>
            {shop.isOpen ? "open" : "closed"}
          </span>
          <span className={`badge badge-info badge-soft uppercase mt-2`}>
            <Phone className="w-4 h-4" /> {shop?.phoneNumbers[0] ?? "UNKNOWN"}
          </span>
        </div>
      </div>
    </article>
  );
};

const Shops = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar}>
        <div className="pt-18">
          <p className="uppercase font-semibold text-sm opacity-60 px-4 pt-2">
            service
          </p>
          <ul className="menu bg-base-100 min-h-full w-64 px-4 space-y-2">
            <li>
              <a>
                <Bookmark className="w-5 h-5" /> Saved
              </a>
            </li>
            <li>
              <a>
                <Map className="w-5 h-5" />
                Map
              </a>
            </li>
            <li>
              <a>
                <IdCard className="w-5 h-5" />
                Personal QR Code
              </a>
            </li>
            <li>
              <a>
                <School className="w-5 h-5" />
                All Schools
              </a>
            </li>
          </ul>
        </div>
      </Sidebar>

      <div className="navbar bg-base-100 shadow-sm z-50 fixed">
        <div className="navbar-start">
          <button
            className="btn btn-ghost btn-square lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu />
          </button>
          <Logo className="h-10 w-auto hidden lg:block" />
        </div>

        <div className="navbar-center">
          <Logo className="h-10 w-auto lg:hidden" />

          <div className="hidden lg:block">
            {/* IDK why but it works */}
            <label className="input w-[400px]">
              <Search className="opacity-50 w-5 h-5" />
              <input type="search" required placeholder="Search" />
              <kbd className="kbd kbd-sm rounded-sm opacity-50">⌘ K</kbd>
            </label>
          </div>
        </div>

        <div className="navbar-end">
          <button className="btn btn-ghost btn-circle lg:hidden">
            <Search />
          </button>

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main className="bg-base-100 min-h-screen pt-18 space-y-8 lg:ps-64">
        <section className="">
          <SectionTitle title="Recent Visited" />
          <div className="overflow-x-scroll whitespace-normal px-4">
            <div className="inline-flex space-x-4">
              {[...testShops, ...testShops].map((shop) => (
                <ShopCard
                  key={"recent-" + shop.id}
                  shop={shop}
                  className="w-85"
                />
              ))}
            </div>
          </div>
        </section>
        <section className="">
          <SectionTitle title="All Shops" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4 space-y-2">
            {testShops.map((shop) => (
              <ShopCard shop={shop} className="w-full" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Shops;
