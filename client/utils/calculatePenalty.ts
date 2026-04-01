import { ADMIN_PROMOTION_DURATION_CONFIGS } from "@/configs/durationConfigs";
import { convertToBlockchainNumber, convertToHumanReadNumber, limitDecimalPoint } from "./limitDecimalPoint";
import BigNumber from "bignumber.js";
import { FormattedStakeInfo, isWithinLockPeriod } from "./userStakesUtils";

const getDurationConfig = (stake: FormattedStakeInfo) => {
	return Object.values(ADMIN_PROMOTION_DURATION_CONFIGS).find(
		(config) => config.durationInMinutes === stake.durationInMinutes
	);
};

export const calculatePenalty = (unstakeAmount: string, stake: FormattedStakeInfo) => {
	const isRenewed = stake.stakingType > 1;
	const isLocked = isRenewed ? false : isWithinLockPeriod(stake.endDate);
	const durationConfig = getDurationConfig(stake);

	if (!durationConfig) {
		throw new Error("Stake duration invalid");
	}
	
	const durationPenalty = durationConfig.earlyUnstakePenalty;

	if (!isLocked) {
		return {
			penaltyPercentage: durationPenalty,
			unstakeAmount: limitDecimalPoint(unstakeAmount, 4),
			penaltyAmount: 0,
			finalReturnAmount: limitDecimalPoint(unstakeAmount, 4),
		};
	}

	if (durationConfig.durationInMinutes === 6) {
		const unstakeAmountValue = Number(unstakeAmount);
		const penaltyAmountValue = unstakeAmountValue * (durationPenalty / 100);
		const finalReturnAmountValue = unstakeAmountValue - penaltyAmountValue;

		return {
			penaltyPercentage: durationPenalty,
			unstakeAmount: limitDecimalPoint(unstakeAmountValue, 4),
			penaltyAmount: penaltyAmountValue,
			finalReturnAmount: limitDecimalPoint(finalReturnAmountValue, 4),
		};
	}

	const remainingMs = new Date(stake.endDate).getTime() - new Date().getTime();
	const durationMs = new Date(stake.endDate).getTime() - new Date(stake.startDate).getTime();
	const penaltyFraction = Math.min(remainingMs / durationMs, 1); // 確認若stake.endDate設定太晚，不會出無理的處罰率
	const penaltyPercentage = (durationPenalty - 10) * penaltyFraction + 10;

	// **使用原始 Wei 值，避免進位或四捨五入**
	const unstakeAmountWei = convertToBlockchainNumber(unstakeAmount);
	const penaltyAmountWei = new BigNumber(unstakeAmountWei).multipliedBy(penaltyPercentage).dividedBy(100).toFixed(0); // 保持 Wei 精度

	// **顯示時轉換成 Ether**
	const finalReturnAmountEther = convertToHumanReadNumber(
		new BigNumber(unstakeAmountWei).minus(penaltyAmountWei).toFixed(0)
	);

	const penaltyPercentageValue = limitDecimalPoint(penaltyPercentage, 4);
	const unstakeAmountValue = limitDecimalPoint(convertToHumanReadNumber(unstakeAmountWei.toString()).toNumber(), 4);
	const penaltyAmountValue = limitDecimalPoint(convertToHumanReadNumber(penaltyAmountWei.toString()).toNumber(), 4);
	const finalReturnAmountValue = limitDecimalPoint(finalReturnAmountEther.toNumber(), 4);

	return {
		penaltyPercentage: penaltyPercentageValue,
		unstakeAmount: unstakeAmountValue,
		penaltyAmount: penaltyAmountValue,
		finalReturnAmount: finalReturnAmountValue,
	};
};
