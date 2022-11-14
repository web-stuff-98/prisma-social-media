import {
  useState,
  useContext,
  createContext,
  ReactNode,
  CSSProperties,
} from "react";

import { ImSpinner8 } from "react-icons/im";
import { BiError } from "react-icons/bi";

interface IModalData {
  pen: boolean;
  err: boolean;
  msg: string;
  confirmationCallback?: Function;
  cancellationCallback?: Function;
}

const ModalContext = createContext<{
  openModal: (modalType: "Message" | "Confirm", modalData: IModalData) => void;
  closeModal: () => void;
  setData: (data: Partial<IModalData>) => void;
}>({
  openModal: () => {},
  closeModal: () => {},
  setData: () => {},
});

/**
 *
 * modalType can be either "Confirm", "Message"
 *
 * modalData :
 *  pen = something is pending / loading
 *  err = message is an error
 *  msg = message content
 *  confirmationCallback = the function that you want invoked after the user confirms the confirmation message
 *  cancellationCallback = the function that you want invoked after the user cancels the confirmation message
 *
 * "Message" modal type have an error, a loading spinner
 * or just a message on its own.
 *
 */

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalType, setModalType] = useState<"Message" | "Confirm">("Message");
  const [modalData, setModalData] = useState<IModalData>(defaultModalData);
  const [showModal, setShowModal] = useState(false);

  const openModal = (
    modalType: "Message" | "Confirm",
    modalData: Partial<IModalData>
  ) => {
    setModalData((old) => ({ ...old, ...modalData }));
    setModalType(modalType);
  };
  const closeModal = () => {
    setShowModal(false);
  };
  const setData = (data: Partial<IModalData>) =>
    setModalData((old) => ({ ...old, ...data }));

  return (
    <ModalContext.Provider value={{ openModal, closeModal, setData }}>
      <>
        {showModal && (
          <>
            <div style={modalBackdropStyle} />
            <div
              onClick={() => {
                if (!modalData.pen) closeModal();
              }}
              style={modalContainerStyle}
            >
              <div
                style={modalStyle}
                className="rounded-sm p-3 drop-shadow bg-gray-100 flex flex-col"
              >
                {/* Confirmation modal */}
                {showModal && modalType === "Confirm" && (
                  <>
                    <b className="text-center">{modalData.msg}</b>
                    <div className="w-full flex items-center justify-center">
                      <button
                        aria-label="Cancel"
                        className="bg-rose-600"
                        onClick={() => {
                          if (modalData.cancellationCallback)
                            modalData.cancellationCallback();
                          closeModal();
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        aria-label="Confirm"
                        onClick={() => {
                          if (modalData.confirmationCallback)
                            modalData.confirmationCallback();
                          closeModal();
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </>
                )}
                {/* Message modal */}
                {showModal && modalType === "Message" && (
                  <>
                    {modalData.pen && (
                      <ImSpinner8 className="mx-auto text-3xl mb-2 drop-shadow animate-spin " />
                    )}
                    {modalData.err && (
                      <BiError className="mx-auto text-3xl mb-2 drop-shadow" />
                    )}
                    <b className="text-center">{modalData.msg}</b>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);

const defaultModalData = {
  msg: "Hello",
  err: false,
  pen: false,
  confirmationCallback: () => {},
  cancellationCallback: () => {},
};

const modalBackdropStyle: CSSProperties = {
  width: "100vw",
  height: "100vh",
  position: "fixed",
  left: "0",
  top: "0",
  background:
    "radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.166) 100%)",
  backdropFilter: "blur(1.5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "min(20pc, 95vw)",
};

const modalContainerStyle: CSSProperties = {
  position: "fixed",
  left: "0",
  top: "0",
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
