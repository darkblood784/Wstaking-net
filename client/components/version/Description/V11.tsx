import { useTranslation } from "react-i18next";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";

const V11: React.FC = () => {
  const { t } = useTranslation();
  const { selectedToken } = useSelectedToken();

  return (
    <div className="space-y-3 text-white">
      <h3 className="text-2xl font-bold">{t("version11.title")}</h3>

      <p>{t("version11.aprRanges")}</p>
      <p>{t("version11.oneMonthStaking")}</p>
      <p>{t("version11.sixMonthsStaking")}</p>
      <p>{t("version11.oneYearStaking")}</p>
      <p>{t("version11.aprAdjustment")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version11.autoScalingAPR")}</p>
      <p>{t("version11.oldFormulaRemoved")}</p>
      <p>{t("version11.stakeQualification")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version11.mergingStakes")}</p>
      <p>{t("version11.additionalStaking")}</p>
      <p>{t("version11.existingStake")}</p>
      <p>{t("version11.promotionEnd")}</p>
      <p>{t("version11.example")}</p>
      <p>{t("version11.benStakeExample", { tokenSymbol: selectedToken.symbol })}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version11.supportMultipleStakes")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version11.minMaxStakingLogic")}</p>
      <p>{t("version11.minimumStake")}</p>
      <p>{t("version11.maximumStake")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version11.displayCompanyName")}</p>
      <p>{t("version11.exploringDisplay")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version11.automaticPlanRenewal")}</p>
      <p>{t("version11.renewalDetails")}</p>
      <p>{t("version11.unstakeAnytime")}</p>
      <p>{t("version11.promotionNotApply")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version11.unstake")}</p>
      <p>{t("version11.holdingLosses")}</p>
    </div>
  );
};

export default V11;
