import { useEffect, useState } from "react";
import { ChevronRight, Menu, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../widgets/Sidebar";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import ThemeToggle from "../widgets/ThemeToggle";
import { transformDtoToShop, type Shop } from "../types/shop";
import { SidebarContent } from "../widgets/SidebarContent";
import ShopCard from "../widgets/Shop/ShopCard";
import axios from "axios";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage } from "../utils/errors";
import { path } from "../utils/path";

export const ShopSectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="flex justify-between sm:justify-start items-center mb-4 mx-4">
      <h2 className="font-bold text-2xl">{title}</h2>

      <ChevronRight />
    </div>
  );
};

const transitionProps = {
  type: "tween",
  duration: 0.2,
} as const;

const Shops = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showModal } = useModal();

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const getShops = async () => {
    setIsLoading(true);
    try {
      const { data: resData } = await axios.get(
        path("/api/shops/rankings?type=home")
      );
      const { success, data, error } = resData;
      if (!success && error) {
        throw new Error(error.code);
      }
      setShops(
        Array.isArray(data.shops) ? data.shops.map(transformDtoToShop) : []
      );
    } catch (err: any) {
      showModal({
        title: "無法取得商家",
        description: getErrorMessage(err.message),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getShops();
  }, []);

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
                <Logo className="h-10 w-auto lg:hidden" />

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
        {/* <section className="">
          <ShopSectionTitle title="Recent Visited" />
          <div
            className="overflow-x-scroll px-4"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="inline-flex space-x-4">
              {[...shops].map((shop) => (
                <ShopCard
                  key={"recent-" + shop.id}
                  shop={shop}
                  className="w-85"
                />
              ))}
            </div>
          </div>
        </section> */}
        <section className="">
          <ShopSectionTitle title="All Shops" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 space-y-2">
            {isLoading &&
              [...Array(12)].map((i) => (
                <div key={`FCUK_${i}`} className="flex flex-col space-y-4">
                  <div
                    key={`FUCK_YOU_${i}`}
                    className="skeleton w-full aspect-[5/3]"
                  />
                  <div className="flex flex-col space-y-2">
                    <div className="skeleton h-10 rounded-field w-4/5"></div>

                    <div className="flex space-x-4">
                      <div className="skeleton h-5 w-12"></div>
                      <div className="skeleton h-5 w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} className="w-full" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Shops;
