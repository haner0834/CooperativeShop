import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useDevice } from "./DeviceContext";

type ModalButtonRole = "primary" | "error" | "info" | "default";
const getStyle = (role: ModalButtonRole) => {
  if (role === "default") return "";
  return "btn-" + role;
};

type ModalButton = {
  label: string;
  role?: ModalButtonRole;
  style?: string; // Only works on desktop
  onClick?: () => void;
};

type ModalOptions = {
  title?: string;
  description?: string;
  showDismissButton?: boolean;
  buttons?: ModalButton[];
  icon?: ReactNode;
  content?: ReactNode;
};

type ModalContextType = {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
};

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({});
  const modalRef = useRef<HTMLDialogElement>(null);
  const { isMobile } = useDevice();

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [isOpen]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handleClose = () => setIsOpen(false);
    modal.addEventListener("close", handleClose);
    return () => modal.removeEventListener("close", handleClose);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      <dialog ref={modalRef} className="modal">
        <div
          className={`bg-base-100 m-8 p-6 ${
            isMobile ? "text-center min-w-xs" : "min-w-lg"
          } rounded-2xl max-w-120 shadow-lg transition-all duration-300 origin-center ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Dismiss Button 保持在最外層，對兩種模式都有效 */}
          <form method="dialog">
            {modalOptions.showDismissButton && (
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={hideModal}
              >
                ✕
              </button>
            )}
          </form>

          {modalOptions.content ? (
            modalOptions.content
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                {modalOptions.icon}
              </div>

              {modalOptions.title && (
                <h3 className={`font-bold ${!isMobile ? "text-lg" : ""}`}>
                  {modalOptions.title}
                </h3>
              )}

              {modalOptions.description && (
                <p className={`py-4 w-full ${isMobile ? "opacity-50" : ""}`}>
                  {modalOptions.description}
                </p>
              )}

              <div className={`${isMobile ? "space-y-4" : "modal-action"}`}>
                {modalOptions.buttons?.map((btn, idx) => (
                  <button
                    key={idx}
                    className={
                      isMobile
                        ? `btn ${
                            btn.role != "default"
                              ? getStyle(btn.role ?? "default")
                              : "bg-base-300"
                          } rounded-4xl w-full`
                        : `btn ${btn.style ?? ""}`
                    }
                    onClick={() => {
                      btn.onClick?.();
                      hideModal();
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </dialog>
    </ModalContext.Provider>
  );
};
