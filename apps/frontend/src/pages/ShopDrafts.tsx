import { useEffect, useState } from "react";
import type { ShopDraft } from "../types/shop";
import { Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-none">
        {/* <button className="btn btn-square btn-ghost">
          <Menu />
        </button> */}
      </div>
      <div className="flex-1 text-center">
        <a className="text-base font-semibold">註冊 - 草稿</a>
      </div>
      <div className="flex-none">
        {/* <a className="btn btn-circle btn-ghost" href="/shops/drafts">
          <CircleDotDashed />
        </a> */}
      </div>
    </div>
  );
};

const AnimatedListItem = ({ children }: { children?: React.ReactNode }) => {
  return (
    <motion.li
      className="relative"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.li>
  );
};

const ShopDrafts = () => {
  const [drafts, setDrafts] = useState<ShopDraft[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let drafts: ShopDraft[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key?.startsWith("SHOP_DRAFT_")) {
        const value = localStorage.getItem(key);
        if (!value) continue;
        drafts.push(JSON.parse(value));
      }
    }

    console.log(drafts);
    setDrafts(sortDraftByDate(drafts));
  }, []);

  const getMonth = (dateISOString: string): string => {
    const date = new Date(dateISOString);
    const month = date.getMonth() + 1;

    const zhMonths = [
      "一月",
      "二月",
      "三月",
      "四月",
      "五月",
      "六月",
      "七月",
      "八月",
      "九月",
      "十月",
      "十一月",
      "十二月",
    ];

    return zhMonths[month - 1];
  };

  const getDay = (dateISOString: string): number => {
    const date = new Date(dateISOString);
    return date.getDate();
  };

  const getTime = (dateISOString: string): string => {
    const date = new Date(dateISOString);

    let hours = date.getHours();
    let minutes = date.getMinutes().toString().padStart(2, "0");

    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
  };

  const getDraftId = (key: string): string => {
    return key.replace("SHOP_DRAFT_", "");
  };

  const sortDraftByDate = (drafts: ShopDraft[]) => {
    return drafts.sort((a, b) => {
      const da = new Date(a.dateISOString).getTime();
      const db = new Date(b.dateISOString).getTime();
      return da - db; // oldest first
    });
  };

  const handleRemove = (key: string) => {
    localStorage.removeItem(key);
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  const closeDropdown = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.stopPropagation();
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const addDraft = () => {
    const newDraft: ShopDraft = {
      key: `SHOP_DRAFT_${crypto.randomUUID()}`,
      dateISOString: new Date().toISOString(),
      data: {
        title: "",
        description: "",
        images: [],
        contactInfo: [],
        workSchedules: [],
      },
    };
    setDrafts((prev) => [...prev, newDraft]);

    setTimeout(() => {
      navigate(`/shops/register?id=${getDraftId(newDraft.key)}`);
    }, 500);
  };

  return (
    <div className="min-h-screen flex justify-center">
      <Navbar />
      <main className="pt-18 min-h-screen max-w-xl w-full">
        <ul className="space-y-4 m-4">
          {drafts.length === 0 && (
            <AnimatedListItem>
              <div className="flex flex-col space-y-4 items-center">
                <h2 className="p-4 text-center">沒有草稿</h2>
                <button
                  onClick={addDraft}
                  className="btn btn-primary btn-wide rounded-full"
                >
                  前往註冊
                </button>
              </div>
            </AnimatedListItem>
          )}

          <AnimatePresence initial={false}>
            {[...drafts].reverse().map((draft) => (
              <AnimatedListItem key={draft.key}>
                <a
                  href={`/shops/register?id=${getDraftId(draft.key)}`}
                  className="w-full h-29 bg-base-300 rounded-box flex overflow-clip"
                >
                  <div className="h-full w-12 bg-neutral flex flex-col flex-none items-center justify-center text-base-100">
                    <p className="font-extrabold text-xl">
                      {getDay(draft.dateISOString)}
                    </p>
                    <p className="text-xs font-medium">
                      {getMonth(draft.dateISOString)}
                    </p>
                  </div>

                  <div className="p-2 ps-4 relative w-full h-full flex">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {draft.data.title || "未命名"}
                      </h3>
                      <p className="opacity-60 line-clamp-2">
                        {draft.data.description || "沒有內容"}
                      </p>
                    </div>

                    {draft.data.images.length >= 1 && (
                      <img
                        src={draft.data.images[0].previewUrl}
                        className="h-10/12 aspect-square rounded-field object-contain"
                      />
                    )}

                    <span className="absolute bottom-2 right-3 text-xs opacity-50">
                      {getTime(draft.dateISOString)}
                    </span>
                  </div>
                </a>

                <div className="absolute top-2 right-2 z-10">
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-circle btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Ellipsis className="w-4 h-4" />
                    </div>

                    <ul
                      tabIndex={-1}
                      className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-sm"
                    >
                      <li>
                        <a href={`/shops/register?id=${getDraftId(draft.key)}`}>
                          <Pencil className="w-5 h-5" />
                          編輯
                        </a>
                      </li>

                      <li>
                        <a
                          className="text-error"
                          onClick={(e) => {
                            closeDropdown(e);
                            handleRemove(draft.key);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                          刪除
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </ul>

        <button
          onClick={addDraft}
          className="fixed z-30 bottom-4 right-4 btn btn-primary btn-xl btn-circle"
        >
          <Plus size={40} strokeWidth={2.5} />
        </button>
      </main>
    </div>
  );
};

export default ShopDrafts;
