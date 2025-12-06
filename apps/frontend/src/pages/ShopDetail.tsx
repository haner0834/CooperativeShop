import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Shop } from "../types/shop";
import { testShops } from "./Shops";
import {
  BadgeDollarSign,
  Bookmark,
  ChevronLeft,
  ImageOff,
  Map,
  MapPin,
  Phone,
  School,
  Tag,
} from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ImageGalleryModal from "../widgets/ImageGalleryModal";
// import { path } from "../utils/path";
// import { getErrorMessage } from "../utils/errors";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import Sidebar from "../widgets/Sidebar";
import { SidebarContent } from "../widgets/SidebarContent";
import { useDevice } from "../widgets/DeviceContext";
import BackButton from "../widgets/BackButton";
import { useToast } from "../widgets/Toast/ToastProvider";

const SaveButton = ({
  style = "circle",
  enable = true,
}: {
  style?: "circle" | "square";
  enable?: boolean;
}) => {
  // btn-circle btn-square
  const [isSaved, setIsSaved] = useState(false);
  const { showToast } = useToast();
  const hintUserTheyreInPreviewMode = () => {
    showToast({
      title: "預覽中無法使用",
      placement: "top-left",
    });
  };
  //   const { id } = useParams();

  useEffect(() => {
    // check();
  }, []);

  const save = async () => {
    if (!enable) {
      hintUserTheyreInPreviewMode();
      return;
    }
    setIsSaved((prev) => !prev);
    // const res = await fetch(path(`/api/shops/${id}/save`), { method: "POST" });
    // const { success, error } = await res.json();
    // if (!success) {
    //   setIsSaved((prev) => !prev);
    //   console.log(error);
    //   showModal({
    //     title: "保存錯誤",
    //     description: getErrorMessage(error.code),
    //     showDismissButton: true,
    //   });
    // }
  };

  //   const check = async () => {
  //     const res = await fetch(path(`/api/shops/${id}/save`));
  //     const { success, body, error } = await res.json();
  //     if (success) {
  //       setIsSaved(body);
  //     } else {
  //       console.log(error);
  //     }
  //   };

  return (
    <button onClick={save} className={`btn btn-${style} select-none`}>
      <Bookmark
        className={`duration-200 ease-in-out transition-color
          ${isSaved ? "fill-neutral" : "fill-transparent"}`}
      />
    </button>
  );
};

export const ShopDetailContent = ({
  shop,
  isPreview = false,
}: {
  shop: Shop | null;
  isPreview?: boolean;
}) => {
  const { isMobile } = useDevice();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // 可以監聽 hash 變化，更新 activeIndex
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      const index = parseInt(hash);
      if (!isNaN(index)) setActiveIndex(index);
    }

    window.addEventListener("hashchange", onHashChange);

    // 初始化
    onHashChange();

    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openModal = (index: number) => {
    setInitialImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToItem = (hash: string) => {
    window.location.replace(window.location.pathname + hash);
  };

  return (
    <article>
      <div className="navbar bg-base-100 shadow-sm z-50 h-18 fixed overflow-hidden">
        <div className="navbar-start">
          <Logo className="h-10 w-auto hidden sm:block" />

          <div className="sm:hidden">
            <BackButton />
          </div>
        </div>

        <div className="navbar-center"></div>

        <div className="navbar-end">
          <div className="md:hidden">
            <SaveButton enable={!isPreview} />
          </div>
        </div>
      </div>

      <Sidebar isOpen={false}>
        <SidebarContent disabled={isPreview} />
      </Sidebar>

      <div className={"pt-18 min-h-screen w-full lg:ps-64"}>
        <div className="hidden sm:block">
          <a
            // href="/shops"
            className="btn btn-ghost btn-xs ms-4 mt-4 opacity-70"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </a>
        </div>
        <div
          className={
            isMobile ? "" : " flex flex-wrap justify-center lg:justify-start"
          }
        >
          {isMobile ? (
            <>
              {/* TODO: Replace this with custom carousel,
                    for better customization and fix hashtag sync issue */}
              <div className="carousel w-full aspect-[4/3]">
                {shop?.imageLinks.length === 0 ? (
                  <div
                    className={`w-full h-full bg-base-300 flex flex-col justify-center items-center ${
                      isPreview ? "text-error" : ""
                    }`}
                  >
                    <ImageOff className="w-12 h-12" />
                    <p className="opacity-60 text-sm">沒有圖片</p>
                  </div>
                ) : (
                  shop?.imageLinks.map((link, i) => (
                    <div
                      key={i}
                      id={String(i)}
                      className="carousel-item w-full overflow-clip"
                    >
                      <LazyLoadImage
                        src={link}
                        onClick={() => openModal(i)}
                        className="carousel-item w-full object-cover cursor-pointer"
                        placeholder={<div className="w-full skeleton" />}
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="flex w-full justify-center gap-2 py-2">
                {shop?.imageLinks.map((_, i) => (
                  <a
                    key={i}
                    onClick={() => goToItem(`#${i}`)}
                    className={`btn btn-xs btn-soft ${
                      activeIndex === i ? "btn-primary" : ""
                    }`}
                  >
                    {i + 1}
                  </a>
                ))}
              </div>
            </>
          ) : shop?.imageLinks.length === 0 ? (
            <div
              className={`w-120 h-120 mt-4 ms-4 bg-base-300 rounded-field flex flex-col justify-center items-center text-accent ${
                isPreview ? "text-error" : ""
              }`}
            >
              <ImageOff className={`w-12 h-12`} />
              <p className="opacity-60 text-sm">沒有圖片</p>
            </div>
          ) : (
            <div className="ms-4 mt-4 flex">
              <div>
                {(shop?.imageLinks.length ?? 0) > 0 && (
                  <img
                    src={shop?.imageLinks[activeIndex]}
                    onClick={() => openModal(activeIndex)}
                    className="w-120 rounded-field"
                  />
                )}
                <div className="flex overflow-x-scroll mt-2 space-x-2">
                  {shop?.imageLinks.map((link, i) => (
                    <a
                      key={i}
                      onClick={() => goToItem(`#${i}`)}
                      className="relative w-20 h-20"
                    >
                      <img
                        src={link}
                        className="w-full h-full absolute rounded-field object-cover"
                      />
                      <div className="w-full h-full rounded-field transition-colors duration-200 ease-in-out absolute hover:bg-neutral/30" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col ms-4">
                <SaveButton style="square" enable={!isPreview} />
              </div>
            </div>
          )}
          {/* Image Gallery Modal */}
          {shop?.imageLinks && (
            <ImageGalleryModal
              imageLinks={shop.imageLinks}
              initialIndex={initialImageIndex}
              isOpen={isModalOpen}
              onClose={closeModal}
            />
          )}

          <div
            className={
              "mx-4 mt-4 space-y-4 flex flex-col " +
              (isMobile ? "" : "min-w-130 lg:w-100")
            }
          >
            <h1 className="font-bold text-2xl">{shop?.title || "空的 :("}</h1>
            {isPreview && !shop?.title && (
              <span className="text-error -mt-4 text-sm">缺少商家名稱</span>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-soft badge-success uppercase">
                <Tag className="w-4 h-4" /> open
              </span>
              {shop?.phoneNumbers.map((phoneNumber, i) => (
                <a key={"phone num" + i} href={`tel:+0974169549`}>
                  <span className="badge badge-info badge-soft">
                    <Phone className="w-4 h-4" /> {phoneNumber}
                  </span>
                </a>
              ))}
              <a href="">
                <span className="badge badge-soft badge-warning uppercase">
                  <School className="w-4 h-4" />
                  KMSH
                </span>
              </a>
            </div>

            <fieldset className="fieldset bg-base-300 border-base-300 rounded-box w-full border p-4 pt-2">
              <legend className="fieldset-legend uppercase">折扣</legend>

              <div className="flex items-center space-x-2">
                <BadgeDollarSign className={`text-blue-400`} />

                <p className="text-base">{shop?.discount ?? "沒有折扣"}</p>
              </div>
            </fieldset>

            <div
              className={`flex space-x-2 ${
                isPreview && !shop?.address ? "text-error" : ""
              }`}
            >
              <MapPin /> <p>{shop?.address || (isPreview ? "缺少地址" : "")}</p>
            </div>

            <a className="btn btn-primary rounded-full w-full md:hidden">
              <Map /> 在地圖中打開
            </a>

            <div className="divider divider-start text-neutral/50 text-xs">
              商家介紹
            </div>

            <p>{shop?.description}</p>
            {isPreview && !shop?.description && (
              <span className="text-error text-sm">缺少商家介紹</span>
            )}

            <div className="divider m-0" />
          </div>
        </div>
      </div>
    </article>
  );
};

const ShopDetail = () => {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    const shop = testShops.find((s) => s.id === id);
    if (shop) setShop(shop);
  }, []);

  return <ShopDetailContent shop={shop} />;
};

export default ShopDetail;
