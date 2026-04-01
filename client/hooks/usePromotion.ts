import { customReadContract } from "@/utils/customReadContract";
import { useEffect, useState } from "react";

const usePromotion = () => {
    const [promotionActive, setPromotionActive] = useState<boolean>(false);
    const [currentPromoId, setCurrentPromoId] = useState<number | null>(null);

    useEffect(() => {
        const fetchPromotionActive = async () => {
            try {
                const response = await customReadContract('isPromotionActive', []) as boolean;
                setPromotionActive(response);
            } catch (error) {
                console.error("獲取促銷狀態失敗: ", error);
            }
        };

        const fetchCurrentPromoId = async () => {
            try {
                const response = await customReadContract('currentPromoId', []) as number;
                setCurrentPromoId(response);
            } catch (error) {
                console.error("獲取促銷狀態失敗: ", error);
            }
        };

        fetchPromotionActive();
        fetchCurrentPromoId();
    }, []);

    return {
        promotionActive,
        currentPromoId,
    };
};

export default usePromotion;
