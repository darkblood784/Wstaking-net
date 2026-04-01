import BigNumber from 'bignumber.js';

const useConvertFromBigNumber = () => {
  /**
   * 轉換 BigNumber 值，將 1e18 轉換為正常數字
   * @param value 需要轉換的數值（通常來自智能合約）
   * @param decimalPlaces 保留的小數點位數（默認 18 位）
   * @returns 轉換後的數字字串
   */
  const convertFromBigNumber = (value: string, decimalPlaces: number = 18): string => {
    try {
      return new BigNumber(value).multipliedBy(100).dividedBy(1e18).toFixed(decimalPlaces);
    } catch (error) {
      console.error('BigNumber 轉換錯誤:', error);
      return '0';
    }
  };

  return convertFromBigNumber;
};

export default useConvertFromBigNumber;