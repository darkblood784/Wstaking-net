import StakingModal from "@/components/StakingModal";
import { createContext, useContext, useState } from "react";

interface ModalContextType {
    openModal: (
        state: 'confirm' | 'loading' | 'success' | 'error' | 'newstake' | 'newAddFunds',
        config: { message: string; details?: string[] }
    ) => void;
    closeModal: () => void;
    openModalWithPromise: (
        state: 'confirm' | 'loading' | 'success' | 'error' | 'newstake' | 'newAddFunds',
        config: { message: string; details?: string[] }
    ) => Promise<boolean>;
}

export const ModalContext = createContext<ModalContextType>({
    openModal: () => {},
    closeModal: () => {},
    openModalWithPromise: () => new Promise((resolve) => resolve(false))
})

export const ModalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false); // 控制模態框的開關
    const [modalState, setModalState] = useState<'confirm' | 'loading' | 'success' | 'error' | 'newstake' | 'newAddFunds' | 'newAddFunds'>('confirm');
    const [modalMessage, setModalMessage] = useState('');
    const [modalDetails, setModalDetails] = useState<string[]>([]);
    const [onConfirmHandler, setOnConfirmHandler] = useState<(() => void) | null>(null);

    const openModal = (
        state: 'confirm' | 'loading' | 'success' | 'error' | 'newstake' | 'newAddFunds',
        config: { message: string; details?: string[] }
    ) => {
        setIsModalOpen(true);
        setModalState(state);
        setModalMessage(config.message); // 保留 message 作為主要訊息
        setModalDetails(config.details || []); // 傳遞補充細節
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalState('confirm');
        setModalMessage('');
    };

    const openModalWithPromise = (
        state: 'confirm' | 'loading' | 'success' | 'error' | 'newstake' | 'newAddFunds',
        config: { message: string; details?: string[] }
    ): Promise<boolean> => {
        return new Promise((resolve) => {
            setIsModalOpen(true);
            setModalState(state);
            setModalMessage(config.message);
            setModalDetails(config.details || []);

            // 設置 onConfirm 處理函數，當用戶點擊確認時解析 Promise
            const confirmHandler = () => {
                setIsModalOpen(false); // 關閉模態框
                resolve(true); // 返回 true 表示用戶確認
            };

            // 傳遞 onConfirm 處理函數到模態框
            setOnConfirmHandler(() => confirmHandler);
        });
    };

    return (
        <ModalContext.Provider
            value={{
                openModal,
                closeModal,
                openModalWithPromise
            }}
        >
            {children}
            <StakingModal
                open={isModalOpen}
                onClose={() => closeModal()}
                state={modalState}
                message={modalMessage}
                details={modalDetails}
                onConfirm={() => {
                    if (onConfirmHandler) {
                        onConfirmHandler(); // 觸發 Promise 解析
                        setOnConfirmHandler(null); // 清除 Handler，避免重複執行
                    }
                }}
            />
        </ModalContext.Provider>
    )
}

export const useModal = () => useContext(ModalContext);