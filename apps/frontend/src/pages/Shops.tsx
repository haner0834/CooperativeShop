import { useState } from "react";
import { ChevronRight, Menu, Search, Tag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../widgets/Sidebar";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import ThemeToggle from "../widgets/ThemeToggle";
import type { Shop } from "../types/shop";
import { SidebarContent } from "../widgets/SidebarContent";
import { Link } from "react-router-dom";
import { path } from "../utils/path";

export const testShops: Shop[] = [
  {
    id: "1",
    title: "Brew & Bloom Café",
    description:
      "A warm café known for its floral-themed interior and artisan coffee.",
    contactInfo: [],
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
    schoolId: "",
    schoolAbbr: "",
    workSchedules: [],
    subTitle: "",
  },
  {
    id: "2",
    title: "Midnight Noodles",
    description:
      "Popular late-night eatery serving traditional Taiwanese noodles and snacks.",
    contactInfo: [],
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
    schoolId: "",
    schoolAbbr: "",
    workSchedules: [],
    subTitle: "",
  },
  {
    id: "3",
    title: "Leafy Market",
    description:
      "Fresh produce and organic groceries with a focus on local farmers.",
    contactInfo: [],
    googleMapsLink:
      "https://www.google.com/maps/place/Apple+Park/@37.3349,-122.0090,17z",
    imageLinks: ["https://picsum.photos/800/600?random=8"],
    thumbnailLink: "https://picsum.photos/400/300?random=9",
    discount: "Spend NT$500, get NT$50 off",
    address: "No. 88, Section 2, Minquan E. Rd., Taipei City",
    longitude: 121.5402,
    latitude: 25.0633,
    isOpen: true,
    schoolId: "",
    schoolAbbr: "",
    workSchedules: [],
    subTitle: "",
  },
  {
    id: "4",
    title: "Pixel Studio",
    description:
      "Creative space offering photography, design, and branding services.",
    contactInfo: [],
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
    schoolId: "",
    schoolAbbr: "",
    workSchedules: [],
    subTitle: "",
  },
  {
    id: "5",
    title: "Sunrise Books",
    description:
      "Independent bookstore featuring local authors and cozy reading spaces.",
    contactInfo: [],
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
    schoolId: "",
    schoolAbbr: "",
    workSchedules: [],
    subTitle: "",
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

const transitionProps = {
  type: "tween",
  duration: 0.2,
} as const;

const Shops = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar}>
        <SidebarContent />
      </Sidebar>

      <div className="navbar bg-base-100 shadow-sm z-50 fixed overflow-hidden">
        <AnimatePresence initial={false}>
          {!isSearchFocused ? (
            <>
              <motion.div
                className="navbar-start"
                key="navbar-start"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  position: "absolute",
                  left: "2%",
                  top: 0,
                  height: "100%",
                  width: "33.33%", // daisyUI navbar-start 默認是 flex: 1
                }}
                transition={transitionProps}
              >
                <button
                  className="btn btn-ghost btn-square lg:hidden"
                  onClick={toggleSidebar}
                >
                  <Menu />
                </button>
                <Logo className="h-10 w-auto hidden lg:block" />
              </motion.div>

              <motion.div
                className="navbar-center"
                key="navbar-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  position: "absolute",
                  left: "33.33%", // 讓它從中間開始 fade out
                  top: 0,
                  height: "100%",
                  width: "33.33%", // daisyUI navbar-center 默認是 flex: 1
                }}
                transition={transitionProps}
              >
                <Logo className="h-10 w-auto" />

                <div className="hidden lg:block">
                  <label className="input w-[400px] flex items-center gap-2">
                    <Search className="opacity-50 w-5 h-5" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      required
                      placeholder="Search"
                    />
                    <kbd className="kbd kbd-sm rounded-sm opacity-50">⌘ K</kbd>
                  </label>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              className="flex-1"
              key="search-bar"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.95,
                position: "absolute",
                top: "18%", // These two magic numbers for fight against the offset after end animation triggered
                left: "2%",
                height: "100%",
                width: "100%", // 讓它在離開時佔據整個寬度
              }}
              transition={transitionProps}
            >
              {/* 10 px for avoiding X icon */}
              <div className="flex h-full pr-[10px]">
                <label className="input w-full flex items-center gap-2">
                  <Search className="opacity-50 w-5 h-5" />
                  <input
                    type="search"
                    required
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className="grow text-[16px]"
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={
            isSearchFocused ? "z-10 relative" : "navbar-end z-10 relative"
          }
        >
          <button
            className="btn btn-ghost btn-circle lg:hidden"
            onClick={() => setIsSearchFocused((prev) => !prev)}
          >
            <AnimatePresence>
              {isSearchFocused ? (
                <motion.div
                  key="close-icon"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, position: "absolute" }}
                  transition={transitionProps}
                >
                  <X />
                </motion.div>
              ) : (
                <motion.div
                  key="search-icon"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, position: "absolute" }}
                  transition={transitionProps}
                >
                  <Search />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main className="bg-base-100 min-h-screen pt-18 space-y-8 lg:ps-64">
        <section className="">
          <SectionTitle title="Recent Visited" />
          <div
            className="overflow-x-scroll px-4"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="inline-flex space-x-4">
              {[...testShops].map((shop) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 space-y-2">
            {testShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} className="w-full" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Shops;
