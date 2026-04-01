// 定義質押期限配置的介面
export interface DurationConfig {
	value: DurationName; // 期限的識別值，如 "8 weeks"
	label: string; // 顯示給用戶的文字，如 "1 年"
	baseAPR: number; // 年化收益率，以百分比表示，如 15 表示 15%
	indicatorValue: number; // 時鐘進度指示值，範圍 0-100
	durationInMinutes: number; // 質押期限的月份數，用於合約計算
	durationFraction: number; // 年化收益計算的時間比例（佔一年的比例）
	earlyUnstakePenalty: number;
	isPromotion: boolean;
	getEndDate: (date: Date) => Date; // 計算解鎖時間的函數
}

// 定義配置對象的類型
export type DurationConfigsType = Partial<Record<DurationName, DurationConfig>>;

export type DurationName =
	| "5 Minutes"
	| "6 Minutes"
	| "1 Month"
	| "1 Month (promotion)"
	| "3 Months"
	| "3 Months (promotion)"
	| "6 Months"
	| "6 Months (promotion)"
	| "1 Year"
	| "1 Year (promotion)";

export const ALL_DURATIONS: DurationName[] = [
	"5 Minutes",
	"6 Minutes",
	"1 Month",
	"1 Month (promotion)",
	"3 Months",
	"3 Months (promotion)",
	"6 Months",
	"6 Months (promotion)",
	"1 Year",
	"1 Year (promotion)",
];

/**
 * 計算配置中的最大月份數
 * @param configs 期限配置對象
 * @returns 最大月份數
 */
const getMaxDurationMinutes = (configs: Record<string, any>): number => {
	return Math.max(...Object.values(configs).map((config) => config.durationInMinutes || 0));
};

/**
 * 創建配置並自動計算指示器值
 * @param configs 基礎配置對象
 * @returns 添加了 indicatorValue 的完整配置
 */
const createDurationConfigs = (configs: Partial<Record<DurationName, Omit<DurationConfig, "indicatorValue">>>) => {
	const maxMinutes = getMaxDurationMinutes(configs);

	return Object.fromEntries(
		Object.entries(configs).map(([key, config]) => {
			const indicatorValue = (config.durationInMinutes / maxMinutes) * 100; // 正常模式按比例計算

			return [
				key,
				{
					...config,
					indicatorValue,
				},
			];
		})
	);
};

// 測試模式基礎配置
const adminBaseConfigs: { [key in DurationName]?: Omit<DurationConfig, "indicatorValue"> } = {
	"5 Minutes": {
		value: "5 Minutes", // 識別值
		label: "5 分鐘", // 顯示標籤
		baseAPR: 10,
		durationInMinutes: 5, // 0 表示測試模式（分鐘級別）
		durationFraction: 5 / 525600, // 自動計算佔全年比例
		earlyUnstakePenalty: 36,
		isPromotion: false,
		getEndDate: (date: Date) => {
			// 解鎖時間為質押時間 + 1分鐘
			const newDate = new Date(date);
			newDate.setMinutes(newDate.getMinutes() + 5);
			return newDate;
		},
	},
};

// 正常模式基礎配置
const normalBaseConfigs: { [key in DurationName]?: Omit<DurationConfig, "indicatorValue"> } = {
	// 4個禮拜質押期限配置
	"1 Month": {
		value: "1 Month", // 識別值
		label: "1 月", // 顯示標籤
		baseAPR: 10,
		durationInMinutes: 43800, // 4個禮拜
		durationFraction: 43800 / 525600, // 自動計算佔全年比例
		earlyUnstakePenalty: 10,
		isPromotion: false,
		getEndDate: (date: Date) => {
			// 解鎖時間為質押時間 + 4個禮拜
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 30);
			return newDate;
		},
	},
	"3 Months": {
		value: "3 Months",
		label: "3 月",
		baseAPR: 15,
		durationInMinutes: 131400, // 3個月
		durationFraction: 131400 / 525600, // 自動計算佔全年比例
		earlyUnstakePenalty: 15,
		isPromotion: false,
		getEndDate: (date: Date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 90);
			return newDate;
		},
	},
	"6 Months": {
		value: "6 Months",
		label: "6 月",
		baseAPR: 24,
		durationInMinutes: 262800,
		durationFraction: 262800 / 525600, // 自動計算佔全年比例
		earlyUnstakePenalty: 24,
		isPromotion: false,
		getEndDate: (date: Date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 180);
			return newDate;
		},
	},
	"1 Year": {
		value: "1 Year",
		label: "1 年",
		baseAPR: 36,
		durationInMinutes: 525600,
		durationFraction: 525600 / 525600, // 佔全年比例 = 1
		earlyUnstakePenalty: 36,
		isPromotion: false,
		getEndDate: (date: Date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 365);
			return newDate;
		},
	},
};

const adminPromotionBaseConfigs: { [key in DurationName]?: Omit<DurationConfig, "indicatorValue"> } = {
	"6 Minutes": {
		value: "6 Minutes",
		label: "6 分鐘",
		baseAPR: 10,
		durationInMinutes: 6,
		durationFraction: 6 / 525600,
		earlyUnstakePenalty: 50,
		isPromotion: false,
		getEndDate: (date: Date) => {
			const newDate = new Date(date);
			newDate.setMinutes(newDate.getMinutes() + 6);
			return newDate;
		},
	},
};

const normalPromotionBaseConfigs: { [key in DurationName]?: Omit<DurationConfig, "indicatorValue"> } = {
	"1 Month (promotion)": {
		value: "1 Month (promotion)",
		label: "1 月 (促銷)",
		baseAPR: 15,
		durationInMinutes: 43801, // 為了表示是促銷時段，加一分鐘
		durationFraction: 43800 / 525600, // 顯示分鐘數量跟設定不一樣，應為要看起來像無促銷版
		earlyUnstakePenalty: 10,
		isPromotion: true,
		getEndDate: (date: Date) => {
			// 解鎖時間為質押時間 + 4個禮拜
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 30);
			return newDate;
		},
	},
	"3 Months (promotion)": {
		value: "3 Months (promotion)",
		label: "3 月 (促銷)",
		baseAPR: 15,
		durationInMinutes: 131401, // 為了表示是促銷時段，加一分鐘
		durationFraction: 131400 / 525600,
		earlyUnstakePenalty: 15,
		isPromotion: true,
		getEndDate: (date: Date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 90);
			return newDate;
		},
	},
	"6 Months (promotion)": {
		value: "6 Months (promotion)",
		label: "6 月 (促銷)",
		baseAPR: 24,
		durationInMinutes: 262801,
		durationFraction: 262800 / 525600,
		earlyUnstakePenalty: 24,
		isPromotion: true,
		getEndDate: (date: Date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 180);
			return newDate;
		},
	},
	"1 Year (promotion)": {
		value: "1 Year (promotion)",
		label: "1 年 (促銷)",
		baseAPR: 36,
		durationInMinutes: 525601,
		durationFraction: 525600 / 525600, // 佔全年比例 = 1
		earlyUnstakePenalty: 36,
		isPromotion: true,
		getEndDate: (date: Date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 365);
			return newDate;
		},
	},
};

// 生成最終配置
export const ADMIN_CONFIGS: DurationConfigsType = createDurationConfigs(adminBaseConfigs);
export const NORMAL_CONFIGS: DurationConfigsType = createDurationConfigs(normalBaseConfigs);
export const ADMIN_PROMOTION_CONFIGS: DurationConfigsType = createDurationConfigs(adminPromotionBaseConfigs);
export const NORMAL_PROMOTION_CONFIGS: DurationConfigsType = createDurationConfigs(normalPromotionBaseConfigs);

// 導出無促銷配置
export const USER_NORMAL_DURATION_CONFIGS = {
	...NORMAL_CONFIGS,
};

// 導出無促銷配置（包含正常模式和促銷模式）
export const USER_PROMOTION_DURATION_CONFIGS = {
	...NORMAL_CONFIGS,
	...NORMAL_PROMOTION_CONFIGS,
};

// 導出無促銷配置（包含測試模式和正常模式）
export const ADMIN_NORMAL_DURATION_CONFIGS = {
	...ADMIN_CONFIGS,
	...NORMAL_CONFIGS,
};

// 導出促銷配置（包含測試模式，正常模式和促銷模式）
export const ADMIN_PROMOTION_DURATION_CONFIGS = {
	...ADMIN_CONFIGS,
	...NORMAL_CONFIGS,
	...ADMIN_PROMOTION_CONFIGS,
	...NORMAL_PROMOTION_CONFIGS,
};
