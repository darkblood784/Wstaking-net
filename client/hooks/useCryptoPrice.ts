// src/hooks/useCryptoPrice.ts

import { useState, useEffect } from "react";
import { getTokenConfig, SupportedToken, TokenConfig, TokenNoaddressConfig } from "@/configs/tokenConfigs";
import { getNetworkName } from "@/utils/networkUtils";
import BigNumber from "bignumber.js";

/**
 * 定義緩存價格的介面
 * 包含價格和時間戳記
 */
interface CachedPrice {
	price: number; // 資產價格
	timestamp: number; // 獲取價格的時間戳記（毫秒）
}

const API_CONFIG = {
	COINGECKO_BASE_URL: "https://api.coingecko.com/api/v3",
	PRICE_REFRESH_INTERVAL: 60000,
	REQUEST_TIMEOUT: 5000,
	RETRY_ATTEMPTS: 3,
	RETRY_DELAY: 1000,
};

const inflightPriceRequests = new Map<string, Promise<BigNumber>>();

export const getTokenUsdPrice = async (
	tokenOrConfig: SupportedToken | TokenConfig | TokenNoaddressConfig,
	opts: { useCache?: boolean; timeoutMs?: number } = {}
): Promise<BigNumber> => {
	const { useCache = true, timeoutMs = API_CONFIG.REQUEST_TIMEOUT } = opts;

	const cfg: TokenConfig | TokenNoaddressConfig =
		typeof tokenOrConfig === "string" ? getTokenConfig(tokenOrConfig, getNetworkName()) : tokenOrConfig;

	const cacheKey = cfg.coingeckoId;

	if (useCache) {
		const cached = getCachedPrice(cacheKey);
		if (cached !== null) return new BigNumber(cached);
	}

	if (inflightPriceRequests.has(cacheKey)) {
		return inflightPriceRequests.get(cacheKey) as Promise<BigNumber>;
	}

	const requestPromise = (async () => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const res = await fetch(`/api/price?id=${encodeURIComponent(cfg.coingeckoId)}`, {
				signal: controller.signal,
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const data = await res.json();
			const usd = data[cfg.coingeckoId]?.usd;
			if (typeof usd !== "number" || usd <= 0) throw new Error("Invalid price data");

			if (useCache) setCachedPrice(cacheKey, usd);
			return new BigNumber(usd);
		} finally {
			clearTimeout(timeoutId);
			inflightPriceRequests.delete(cacheKey);
		}
	})();

	inflightPriceRequests.set(cacheKey, requestPromise);
	return requestPromise;
};

/**
 * 從 sessionStorage 獲取緩存的資產價格
 * @param asset - 資產名稱（例如 'bitcoin'）
 * @returns 資產價格或 null 如果沒有緩存或緩存已過期
 */
const getCachedPrice = (asset: string): number | null => {
	try {
		// 從 sessionStorage 中獲取對應資產的價格數據
		const cachedData = sessionStorage.getItem(`cryptoPrice_${asset}`);
		if (!cachedData) return null; // 如果沒有緩存，返回 null

		// 解析緩存的 JSON 數據
		const parsedData: CachedPrice = JSON.parse(cachedData);
		const currentTime = Date.now(); // 獲取當前時間戳記

		// 檢查緩存是否已超過5分鐘（300,000毫秒）
		if (currentTime - parsedData.timestamp > 5 * 60 * 1000) {
			sessionStorage.removeItem(`cryptoPrice_${asset}`); // 移除過期的緩存
			return null; // 返回 null 表示緩存已過期
		}

		return parsedData.price; // 返回緩存的價格
	} catch (error) {
		console.error("獲取緩存價格失敗:", error);
		return null; // 發生錯誤時返回 null
	}
};

/**
 * 將資產價格存入 sessionStorage 進行緩存
 * @param asset - 資產名稱（例如 'bitcoin'）
 * @param price - 資產價格
 */
const setCachedPrice = (asset: string, price: number) => {
	try {
		// 創建包含價格和當前時間戳記的緩存數據
		const cachedData: CachedPrice = {
			price,
			timestamp: Date.now(),
		};
		// 將緩存數據轉換為 JSON 字串並存入 sessionStorage
		sessionStorage.setItem(`cryptoPrice_${asset}`, JSON.stringify(cachedData));
	} catch (error) {
		console.error("設置緩存價格失敗:", error);
	}
};

/**
 * 自訂 Hook，用於獲取和管理加密貨幣價格
 * @param isConnected - 用戶錢包是否已連接
 * @param selectedToken - 用戶選擇的資產名稱（例如 'bitcoin'）
 * @returns 包含資產價格和加載狀態的物件
 */
const useCryptoPrice = (isConnected: boolean, selectedToken: SupportedToken) => {
	const [cryptoPrice, setCryptoPrice] = useState<number | null>(null); // 存儲資產價格
	const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false); // 存儲價格加載狀態

	useEffect(() => {
		/**
		 * 獲取資產價格的非同步函數
		 */
		const fetchPrice = async () => {
			if (!isConnected) return; // 如果錢包未連接，則不執行任何操作

			setIsLoadingPrice(true); // 設置加載狀態為 true
			try {
				const tokenConfig = getTokenConfig(selectedToken, getNetworkName()); // 獲取資產配置

				// 嘗試從緩存中獲取價格
				const cachedPrice = getCachedPrice(tokenConfig.coingeckoId);
				if (cachedPrice !== null) {
					setCryptoPrice(cachedPrice); // 使用緩存的價格
					console.log(`使用緩存價格: ${selectedToken}, 價格: ${cachedPrice}`);
					setIsLoadingPrice(false); // 設置加載狀態為 false
					return; // 結束函數，避免發起新的 API 請求
				}

				// 如果緩存不存在或已過期，則發起新的 API 請求
				const controller = new AbortController(); // 創建 AbortController 用於取消請求
				const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT); // 設置請求超時

				// 發起 fetch 請求獲取價格數據
				const response = await fetch(`/api/price?id=${encodeURIComponent(tokenConfig.coingeckoId)}`, {
					signal: controller.signal, // 添加 signal 以便在超時時取消請求
				});
				clearTimeout(timeoutId); // 清除超時計時器

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`); // 如果響應不正常，拋出錯誤
				}

				const data = await response.json(); // 解析 JSON 數據
				const price = data[tokenConfig.coingeckoId]?.usd; // 獲取特定資產的價格

				if (typeof price !== "number" || price <= 0) {
					throw new Error("無效的價格數據"); // 如果價格數據無效，拋出錯誤
				}

				setCryptoPrice(price); // 更新資產價格狀態
				setCachedPrice(tokenConfig.coingeckoId, price); // 將獲取到的價格存入緩存
				console.log(`初始價格載入成功: ${selectedToken}, 價格: ${price}`);
			} catch (error) {
				console.error("初始價格載入失敗:", error);
				setCryptoPrice(null); // 發生錯誤時設置價格為 null
			} finally {
				setIsLoadingPrice(false); // 最後設置加載狀態為 false
			}
		};

		fetchPrice(); // 呼叫獲取價格的函數
	}, [isConnected, selectedToken]); // 當 isConnected 或 selectedToken 改變時，重新執行 useEffect

	return { cryptoPrice, isLoadingPrice }; // 返回資產價格和加載狀態
};

export default useCryptoPrice;

