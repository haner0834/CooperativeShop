import { useEffect, useState, useRef, useCallback } from "react";
import {
  ChevronRight,
  Menu,
  Search,
  X,
  Filter,
  Clock,
  MapPin,
  Check,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../widgets/Sidebar";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import { transformDtoToShop, type Shop } from "../types/shop";
import { SidebarContent } from "../widgets/SidebarContent";
import ShopCard from "../widgets/Shop/ShopCard";
import axios from "axios";
import { path } from "../utils/path";
import { useAuthFetch } from "../auth/useAuthFetch";
import { useNavigate, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import ThemeToggle from "../widgets/ThemeToggle";
import { useDevice } from "../widgets/DeviceContext";
import { useToast } from "../widgets/Toast/ToastProvider";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage } from "../utils/errors";
import { useAuth } from "../auth/AuthContext";

// --- Helpers ---
const transitionProps = { type: "tween", duration: 0.2 } as const;

export const ShopSectionTitle = ({
  title,
  onClickArrow,
}: {
  title: string;
  onClickArrow?: () => void;
}) => (
  <div className="flex justify-between sm:justify-start items-center mb-4 mx-4">
    <h2 className="font-bold text-2xl">{title}</h2>
    {onClickArrow ? (
      <button
        onClick={onClickArrow}
        className="btn btn-ghost btn-sm btn-circle ml-1"
      >
        <ChevronRight />
      </button>
    ) : (
      <ChevronRight className="ml-1 opacity-20" />
    )}
  </div>
);

const SearchResultItem = ({
  shop,
  index,
  onClick,
}: {
  shop: Shop;
  index: number;
  onClick: () => void;
}) => (
  <li key={shop.id + index} onClick={onClick} className="w-full">
    <div className="flex w-full items-center gap-3 p-3 cursor-pointer hover:bg-neutral hover:text-base-100 rounded-field transition-colors">
      {/* Thumbnail */}
      <div className="avatar shrink-0">
        <div className="w-12 h-12 rounded-field bg-base-300">
          {shop.thumbnailLink && (
            <img src={shop.thumbnailLink} alt={shop.title} />
          )}
        </div>
      </div>

      {/* Title + Address */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-bold text-[15px] truncate">{shop.title}</span>
        <span className="text-xs opacity-50 flex items-center gap-1 min-w-0">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{shop.address || "無地址"}</span>
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 shrink-0">
        {shop.isOpen ? (
          <span className="text-[10px] font-bold text-success">營業中</span>
        ) : (
          <span className="text-[10px] font-bold opacity-30">休息中</span>
        )}
        <ChevronRight size={16} className="opacity-30" />
      </div>
    </div>
  </li>
);

type ViewType = "home" | "all" | "saved" | "popular" | "nearby" | "recent";

// --- Local Storage Helper for Recent Shops ---
const RECENT_SHOPS_KEY = "recent_shops_v1";
const getRecentShopsFromLS = (): Shop[] => {
  try {
    const item = localStorage.getItem(RECENT_SHOPS_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

const Shops = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentType = (searchParams.get("type") as ViewType) || "home";
  const searchQuery = searchParams.get("q") || "";
  const isOpenFilter = searchParams.get("isOpen") === "true";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [shops, setShops] = useState<Shop[]>([]);
  const [recentShops, setRecentShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [previewResults, setPreviewResults] = useState<Shop[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const LIMIT = 12;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const { authedFetch } = useAuthFetch();
  const { showToast } = useToast();
  const { showModal } = useModal();
  const { isMobile } = useDevice();
  const { activeUserRef, restorePromise } = useAuth();

  // --- Functions ---
  const updateQuery = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) =>
        v ? p.set(k, v) : p.delete(k)
      );
      return p;
    });
  };

  const fetchShops = useCallback(
    async (isLoadMore = false) => {
      if (isLoading) return;
      if (
        (currentType === "saved" || currentType === "nearby") &&
        !activeUserRef.current
      ) {
        try {
          if (restorePromise) {
            const result = await restorePromise;
            console.log(result, activeUserRef.current);
            if (!result.ok) throw new Error("");
          } else {
            throw new Error("");
          }
        } catch (err: any) {
          const target = "/shops";
          const url = `/choose-school?to=${encodeURI(target)}`;
          showModal({
            title: `請先登入帳號以查看${
              currentType === "nearby" ? "附近店家" : "收藏店家"
            }`,
            buttons: [
              {
                label: "繼續",
                onClick: () => navigate(url),
              },
            ],
          });
          return;
        }
      }
      setIsLoading(true);

      try {
        let endpoint = "/api/shops";
        let params: Record<string, any> = {
          limit: LIMIT,
          offset: isLoadMore ? offset : 0,
        };

        // 處理不同 Type 的 API 參數
        if (currentType === "saved") {
          endpoint = "/api/shops/saved";
          // Saved endpoint might not support pagination/filtering the same way,
          // assuming backend supports standard filtering for saved or returns all.
          // If backend saved endpoint doesn't support params, we filter client side.
        } else if (currentType === "popular") {
          params.sortBy = "hot";
        } else if (currentType === "nearby") {
          params.sortBy = "nearby";
          // Get location if possible
          if (navigator.geolocation) {
            await new Promise<void>((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  params.userLat = pos.coords.latitude;
                  params.userLng = pos.coords.longitude;
                  resolve();
                },
                () => resolve() // Error or blocked, proceed without loc
              );
            });
          }
        } else if (currentType === "home") {
          // Home fetches a specific default set
          params.sortBy = "home";
        } else {
          // Default (All)
          params.sortBy = "home";
        }

        // Apply Global Filters
        if (searchQuery) params.q = searchQuery;
        if (isOpenFilter) params.isOpen = "true";

        // const { data: resData } = await axios.get(path(endpoint), { params });
        let resData = undefined;
        if (activeUserRef.current) {
          console.log("authedFetch");
          const apiRoute = `${path(endpoint)}?${new URLSearchParams(params)}`;
          resData = await authedFetch(apiRoute);
        } else {
          console.log("axios.get");
          const { data } = await axios.get(path(endpoint), { params });
          resData = data;
        }
        const { success, data, error } = resData;

        if (!success && error) throw new Error(error.code);

        const fetchedShops = Array.isArray(data)
          ? data.map(transformDtoToShop)
          : [];

        // Update State
        if (isLoadMore) {
          // 載入更多：合併舊資料，並過濾掉可能重複的 ID
          setShops((prev) => {
            const newShops = fetchedShops.filter(
              (fs) => !prev.some((ps) => ps.id === fs.id)
            );
            return [...prev, ...newShops];
          });
        } else {
          // 全新搜尋：直接覆蓋
          setShops(fetchedShops);
        }

        // Check if we reached the end
        if (fetchedShops.length < LIMIT) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        // Update Offset for next call
        setOffset((prev) => (isLoadMore ? prev + LIMIT : LIMIT));

        return fetchedShops; // Return for chaining
      } catch (err: any) {
        showModal({
          title: "無法取得商家",
          description: getErrorMessage(err.message),
        });
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [currentType, searchQuery, isOpenFilter, offset, isLoading]
  );

  // --- Effects ---

  // 1. Reset fetch when filters/type change
  useEffect(() => {
    // 當 URL 參數改變導致邏輯改變時，重置並重新抓取
    setOffset(0);
    setHasMore(true);
    setShops([]); // Clear current list to show skeleton

    if (currentType === "recent") {
      // Handle Recent locally
      setRecentShops(getRecentShopsFromLS());
      setIsLoading(false);
    } else {
      fetchShops(false).then(() => {
        // After fetching shops, fetch saved status
        fetchSavedStatus();
      });
    }

    if (currentType === "home") {
      setRecentShops(getRecentShopsFromLS());
    }
  }, [currentType, searchQuery, isOpenFilter]);

  // 2. Fetch Saved IDs and merge
  const fetchSavedStatus = async () => {
    try {
      const res = await authedFetch(path("/api/shops/saved-ids"));
      if (res?.success && Array.isArray(res.data)) {
        setShops((prev) =>
          prev.map((s) => ({
            ...s,
            isSaved: res.data.includes(s.id),
          }))
        );
      }
    } catch {
      // Fail silently for saved status (user might be guest)
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (isLoggedIn) {
        const target = "/shops";
        const url = `/choose-school?to=${encodeURI(target)}`;
        showToast({
          title: "登入失敗，請重新登入",
          icon: <AlertCircle className="text-error" />,
          buttons: [
            {
              label: "繼續",
              onClick: () => navigate(url),
            },
          ],
        });
      }
    }
  };

  // 處理按下 Enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ q: searchInput });

    // 在 Mobile 上，我們希望 Enter 後鍵盤收起但搜尋欄不消失
    // 所以只做 blur，不要把 isSearchFocused 設為 false
    searchInputRef.current?.blur();
  };

  // 處理取消搜尋 (按下 X)
  const handleCancelSearch = () => {
    setSearchInput("");
    updateQuery({ q: null });
    setIsSearchFocused(false); // 回到有 Logo 的初始狀態
  };

  // Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchFocused(true);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading)
          fetchShops(true);
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, fetchShops]);

  useEffect(() => {
    const fetchPreview = async () => {
      // 只有在有輸入時才打 API
      if (!searchInput.trim()) {
        setPreviewResults([]);
        return;
      }

      setIsPreviewLoading(true);
      try {
        const { data: resData } = await axios.get(path("/api/shops"), {
          params: {
            q: searchInput,
            limit: 10, // 預覽顯示前 8 筆
          },
        });
        if (resData.success) {
          setPreviewResults(resData.data.map(transformDtoToShop));
        }
      } catch (e) {
        console.error("Search preview failed", e);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    // Debounce 處理，避免頻繁打 API
    const timeoutId = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setShops([]);
    setOffset(0);
    setHasMore(true);
    fetchShops(false);
  }, [currentType, searchQuery, isOpenFilter]);

  return (
    <div>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <SidebarContent />
      </Sidebar>

      <nav className="navbar bg-base-100 shadow-sm z-50 fixed">
        <AnimatePresence initial={false}>
          {!isSearchFocused || !isMobile ? (
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
                  width: "33.33%",
                }}
                transition={transitionProps}
              >
                <button
                  className="btn btn-ghost btn-square lg:hidden"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
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
                  left: "33.33%",
                  top: 0,
                  height: "100%",
                  width: "33.33%",
                }}
                transition={transitionProps}
              >
                <Logo className="h-10 w-auto lg:hidden" />

                <div className="hidden lg:block relative">
                  <label className="input w-[400px] flex items-center gap-2">
                    <Search className="opacity-50 w-5 h-5" />
                    <input
                      type="search"
                      value={searchInput}
                      onFocus={() => setIsSearchFocused(true)} // 1. 啟動選單
                      onBlur={() => {
                        // 延遲關閉，確保點擊搜尋結果的 onClick 能先執行
                        setTimeout(() => setIsSearchFocused(false), 300);
                      }}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && updateQuery({ q: searchInput })
                      }
                      placeholder="搜尋"
                    />
                    <kbd className="kbd kbd-sm rounded-sm opacity-50">⌘ K</kbd>
                  </label>

                  {/* 下拉選單顯示條件 */}
                  {isSearchFocused && searchInput && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-base-100 shadow-xl rounded-box overflow-hidden border border-base-200 z-[60]">
                      <ul className="flex flex-col divide-y p-2">
                        {isPreviewLoading ? (
                          <div className="p-4 flex justify-center">
                            <span className="loading loading-spinner loading-sm"></span>
                          </div>
                        ) : previewResults.length > 0 ? (
                          previewResults.map((shop, i) => (
                            <SearchResultItem
                              key={shop.id}
                              shop={shop}
                              index={i}
                              onClick={() => navigate(`/shops/${shop.id}`)}
                            />
                          ))
                        ) : (
                          <div className="p-4 text-center opacity-50 text-sm">
                            沒有結果
                          </div>
                        )}
                      </ul>
                    </div>
                  )}
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
                top: "18%",
                left: "2%",
                height: "100%",
                width: "100%",
              }}
              transition={transitionProps}
            >
              <form
                onSubmit={handleSearchSubmit}
                className="flex justify-center h-full pr-[10px]"
              >
                <label className={`input w-full flex items-center gap-2`}>
                  <Search className="opacity-50 w-5 h-5" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    autoFocus
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search"
                    className="grow text-[16px]"
                  />
                </label>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`space-x-2 ${
            isSearchFocused && isMobile
              ? "z-10 relative flex items-center"
              : "navbar-end z-10 relative flex items-center"
          }`}
        >
          {/* Filter Icon 整合 */}
          <div className="relative">
            <AnimatePresence>
              {(!isSearchFocused || !isMobile) && (
                <motion.button
                  key="filter-btn"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50, transition: { duration: 0.15 } }}
                  className="btn btn-ghost btn-circle"
                  popoverTarget="filter-popover"
                  style={
                    { anchorName: "--anchor-filter" } as React.CSSProperties
                  }
                >
                  <Filter
                    size={20}
                    className={isOpenFilter ? "fill-current" : ""}
                  />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Dropdown 永遠在 DOM，用 hidden 控制 */}
            <ul
              className={clsx(
                "dropdown dropdown-end menu w-52 rounded-box bg-base-100 shadow-sm",
                isSearchFocused && "hidden"
              )}
              popover="auto"
              id="filter-popover"
              style={
                { positionAnchor: "--anchor-filter" } as React.CSSProperties
              }
            >
              <li>
                <a
                  className="flex justify-between items-center"
                  onClick={
                    () =>
                      isOpenFilter
                        ? updateQuery({ isOpen: null }) // 取消 filter
                        : updateQuery({ isOpen: "true" }) // 開啟 filter
                  }
                >
                  <span className="flex items-center gap-1">
                    <Clock size={16} /> 營業中
                  </span>
                  {isOpenFilter && <Check size={16} strokeWidth={3} />}
                </a>
              </li>
            </ul>
          </div>

          {/* Search Toggle Button */}
          <button
            className="btn btn-ghost btn-circle lg:hidden"
            onClick={() =>
              setIsSearchFocused((prev) => {
                if (prev) {
                  handleCancelSearch();
                }
                return !prev;
              })
            }
          >
            <AnimatePresence mode="wait">
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
      </nav>

      <main className="bg-base-100 min-h-screen pt-20 lg:ps-64 pb-10">
        {currentType === "home" && recentShops.length >= 1 && !searchQuery && (
          <section className="mb-8">
            <ShopSectionTitle
              title="Recent Visited"
              onClickArrow={() => updateQuery({ type: "recent" })}
            />
            <div className="flex overflow-x-auto px-4 gap-4 no-scrollbar pb-2">
              {recentShops.map((s) => (
                <ShopCard
                  key={`rec-${s.id}`}
                  shop={s}
                  className="w-80 flex-shrink-0"
                />
              ))}
            </div>
          </section>
        )}

        {/* Mobile 實時搜尋列表：當 Focus 且有字時顯示 */}
        <AnimatePresence>
          {isMobile && isSearchFocused && searchInput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-base-100 pt-20 px-2 overflow-y-auto"
            >
              <ul className="menu w-full p-0">
                {isPreviewLoading ? (
                  <div className="flex justify-center p-10">
                    <span className="loading loading-dots"></span>
                  </div>
                ) : (
                  previewResults.map((shop, i) => (
                    <SearchResultItem
                      shop={shop}
                      index={i}
                      onClick={() => {
                        navigate(`/shops/${shop.id}`);
                        setIsSearchFocused(false);
                      }}
                    />
                  ))
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <section>
          <ShopSectionTitle
            title={
              searchQuery
                ? `搜尋結果：「${searchQuery}」`
                : currentType === "home"
                ? "所有商家"
                : "商家"
            }
            onClickArrow={
              currentType === "home"
                ? () => updateQuery({ type: "all" })
                : undefined
            }
          />
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4"
          >
            <AnimatePresence mode="popLayout">
              {shops.map((shop) => (
                <motion.div
                  key={shop.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ShopCard shop={shop} className="w-full" />
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading &&
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-4">
                  <div className="skeleton w-full aspect-[16/9]" />
                  <div className="skeleton h-6 w-3/4" />
                </div>
              ))}
          </motion.div>
          <div ref={observerTarget} className="h-10" />
        </section>
      </main>
    </div>
  );
};

export default Shops;
