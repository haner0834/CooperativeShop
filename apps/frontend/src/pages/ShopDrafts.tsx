import { useEffect, useState } from "react";
import { ShopDraftDto } from "../types/shop";
import {
  ArrowRight,
  CircleAlert,
  Ellipsis,
  Pencil,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useModal } from "../widgets/ModalContext";
import { useDevice } from "../widgets/DeviceContext";
import { path } from "../utils/path";
import { useAuthFetch } from "../auth/useAuthFetch";
import { plainToInstance } from "class-transformer";
import { useToast } from "../widgets/Toast/ToastProvider";
import {
  getStatusColor,
  getStatusText,
} from "./ShopRegisterForm/ShopRegisterForm";

const Navbar = ({
  setShowSearch,
}: {
  setShowSearch: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-none">
        {/* <button className="btn btn-square btn-ghost">
          <Menu />
        </button> */}
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold">註冊 - 草稿</h1>
      </div>
      <div className="flex-none">
        <button
          className="btn btn-circle btn-ghost"
          onClick={() => setShowSearch((prev) => !prev)}
        >
          <Search />
        </button>
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

const SearchModal = () => {
  const { authedFetch } = useAuthFetch();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { hideModal } = useModal();

  const search = async () => {
    const response = await authedFetch(path(`/api/shop-draft`), {
      method: "POST",
      body: JSON.stringify({
        title,
        subtitle: subtitle || undefined,
      }),
    });

    const { success, data, error } = response;
    if (success) {
      hideModal();
      navigate(`/shops/register?id=${data.id}`);
    } else {
      const { code } = error;
      if (code === "DRAFT_NORMALIZED_KEY_CONFLICT") {
        setErrorMessage("該店家已被預約或登記");
      } else {
        setErrorMessage("發生未知錯誤，請稍後再試");
      }
    }
  };

  return (
    <div className="flex flex-col w-full">
      <h3 className="text-center w-full text-lg font-semibold">登記預約</h3>
      <fieldset className="fieldset">
        <label className="label" htmlFor="shop-title">
          店名
        </label>
        <input
          type="text"
          id="shop-title"
          className="input w-full"
          placeholder="店名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </fieldset>
      <div className="w-full flex flex-col items-start">
        <fieldset className="fieldset w-full">
          <label className="label" htmlFor="shop-subtitle">
            分店名
          </label>
          <input
            type="text"
            id="shop-subtitle"
            className="input w-full"
            placeholder="分店名"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </fieldset>
        <p className="text-xs opacity-50">如果沒有分店名，本欄位請留空</p>
      </div>

      <button
        className="btn w-full btn-primary mt-4"
        onClick={() => search()}
        disabled={title === ""}
      >
        登記預約
      </button>
      <p className="text-xs opacity-50">一旦送出，店名、分店名便不可修改</p>

      {errorMessage && (
        <p className="text-error text-xs font-medium">{errorMessage}</p>
      )}
    </div>
  );
};

const ShopDrafts = () => {
  const [drafts, setDrafts] = useState<ShopDraftDto[]>([]);
  const { activeUser, activeUserRef, restorePromise, hasAttemptedRestore } =
    useAuth();
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { isMobile } = useDevice();
  const [_, setShowSearchbar] = useState(false);
  const { authedFetch } = useAuthFetch();
  const { showToast } = useToast();

  // Force login
  useEffect(() => {
    const toLogin = () => {
      const target = `/shops/drafts`;
      const url = `/choose-school?to=${encodeURIComponent(target)}`;
      navigate(url);
    };
    if (hasAttemptedRestore && !activeUser) {
      // Failed to restore session
      showModal({
        title: "請先登入帳號",
        description: "必須登入帳號才可進行下一步操作。",
        buttons: [
          {
            label: "繼續",
            style: "btn-primary",
            role: "primary",
            onClick: toLogin,
          },
        ],
      });
    }
  }, [hasAttemptedRestore, activeUser]);

  useEffect(() => {
    getDrafts();
  }, []);

  const getDrafts = async () => {
    if (restorePromise) await restorePromise;
    if (!activeUserRef.current) return;

    const result = await authedFetch(
      path(
        `/api/shop-draft?schoolAbbr=${activeUserRef.current?.schoolAbbr}&versions=true&currentVersion=true`
      )
    );

    const { success, error } = result;

    if (!success) {
      console.error(error);
      return;
    }

    const { data }: { data: any[] } = result;
    const drafts = plainToInstance(ShopDraftDto, data);
    setDrafts(drafts);
  };

  const getFormattedDate = (date: Date): string => {
    const year = date.getFullYear() - 2000;
    const month = date.getMonth();
    const day = date.getDay();

    return `${year}/${month}/${day}`;
  };

  const getDraftId = (key: string): string => {
    if (!key) return "";
    return key.replace("SHOP_DRAFT_", "");
  };

  const handleRemove = async (id: string) => {
    const result = await authedFetch(path(`/api/shop-draft/${id}`), {
      method: "DELETE",
    });

    const { success, error } = result;

    if (!success) {
      console.error(error);
      showToast({
        title: "刪除失敗",
        icon: <CircleAlert className="text-error" />,
      });
      return;
    }

    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const closeDropdown = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.stopPropagation();
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const addDraft = () => {
    showModal({
      showDismissButton: true,
      content: <SearchModal />,
    });
  };

  return (
    <div className="min-h-screen flex justify-center bg-base-300">
      <Navbar setShowSearch={setShowSearchbar} />
      <main className="pt-18 min-h-screen max-w-xl w-full">
        <ul className="space-y-4 m-4">
          {drafts.length === 0 && (
            <AnimatedListItem>
              <div className="flex flex-col  justify-center items-center">
                <div className="flex items-center">
                  <PencilLine />
                  <h2 className="p-4 text-center">沒有草稿</h2>
                </div>
                <button
                  onClick={addDraft}
                  className={`btn btn-primary ${
                    isMobile ? "w-full" : "btn-wide"
                  } rounded-full`}
                >
                  新建草稿
                </button>
              </div>
            </AnimatedListItem>
          )}

          {activeUser && (
            <div className="flex flex-col items-center">
              <Link
                className={`btn btn-neutral btn-soft ${
                  isMobile ? "w-full" : "btn-wide"
                } rounded-full`}
                to={`/shops/filtered/school?schoolAbbr=${activeUser.schoolAbbr}`}
              >
                查看已提交店家（本校）
                <ArrowRight className="ms-2" />
              </Link>
            </div>
          )}

          <AnimatePresence initial={false}>
            {[...drafts].map((draft) => (
              <AnimatedListItem key={draft.id}>
                <Link
                  to={`/shops/register?id=${getDraftId(draft.id)}`}
                  className="overflow-clip"
                >
                  <div className="w-full bg-base-100 rounded-box p-4 shadow">
                    <div className="flex gap-4">
                      {draft.images[0].previewUrl && (
                        <img
                          src={draft.images[0].previewUrl}
                          className="w-30 h-30 aspect-square rounded-field"
                        />
                      )}

                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-baseline gap-1 font-semibold">
                          <h3 className="text-lg line-clamp-1">
                            {draft.title || "未命名"}
                          </h3>
                          <h4 className="text-sm opacity-60">
                            {draft.subtitle}
                          </h4>
                        </div>

                        <p className="flex-1 line-clamp-3">
                          {draft.description}
                        </p>

                        {draft.currentVersion ? (
                          <div className="flex flex-col sm:items-center space-x-2 sm:flex-row items-start">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-3 h-3 rounded-full ${getStatusColor(
                                  draft.currentVersion.reviewStatus
                                )}`}
                              />
                              <p className="text-xs opacity-40">
                                {getStatusText(
                                  draft.currentVersion.reviewStatus
                                )}
                              </p>
                            </div>

                            <p className="text-xs opacity-40">
                              {getFormattedDate(
                                draft.currentVersion.submittedAt
                              )}{" "}
                              提交
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs opacity-40">
                            {getFormattedDate(draft.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="absolute top-2 right-2 z-10">
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-circle btn-ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Ellipsis className="w-5 h-5" />
                    </div>

                    <ul
                      tabIndex={-1}
                      className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-sm"
                    >
                      <li>
                        <Link to={`/shops/register?id=${draft.id}`}>
                          <Pencil className="w-5 h-5" />
                          編輯
                        </Link>
                      </li>

                      <li>
                        <a
                          className="text-error"
                          onClick={(e) => {
                            closeDropdown(e);
                            handleRemove(draft.id);
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
