import BigNumber from 'bignumber.js';
import { getNetworkConfig } from './networkUtils';

/**
 * 限制數字的小數點位數
 * @param value 需要處理的數值
 * @param decimalPlaces 保留的小數點位數（默認 3 位）
 * @returns 格式化後的數字字串
 */
export const limitDecimalPoint = (value: number | string | undefined | null, decimalPlaces: number = 3): string => {
  if (!value) return '0';

  try {
    const numericValue = new BigNumber(value);
    if (numericValue.isNaN()) return '0';

    const flooredValue = numericValue.decimalPlaces(decimalPlaces, BigNumber.ROUND_DOWN);

    return flooredValue.toFixed(decimalPlaces).replace(/\.0+$/, '');
  } catch (error) {
    console.error('小數點格式化錯誤:', error);
    return '0';
  }
};

export const convertToHumanReadNumber = (value: string, chainId: number | null = null): BigNumber => {
  const networkConfig = chainId ? getNetworkConfig(chainId) : getNetworkConfig();
  const networkPrecision = networkConfig.precision;
  
  return new BigNumber(value).div(Math.pow(10, networkPrecision));
};

export const convertToBlockchainNumber = (value: string, chainId: number | null = null): BigNumber => {
  const networkConfig = chainId ? getNetworkConfig(chainId) : getNetworkConfig();
  const networkPrecision = networkConfig.precision;

  return new BigNumber(value).multipliedBy(Math.pow(10, networkPrecision));
};