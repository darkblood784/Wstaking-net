import { useTranslation } from "react-i18next";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";

const V13: React.FC = () => {
  const { t } = useTranslation();
  const { selectedToken } = useSelectedToken();

  return (
    <div className="space-y-3 text-white">
      <h3 className="text-2xl font-bold">{t("v13.title")}</h3>

      <h4 className="text-lg italic font-semibold">{t("v13.updateTitle")}</h4>
      <h4 className="text-lg italic font-semibold">{t("v13.timeBased")}</h4>
      <div className="h-4" />
      <p>{t("v13.rewardsMatter")}</p>
      <div className="h-4" />
      <p>{t("v13.stability")}</p>
      <p>{t("v13.longerStay")}</p>
      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v13.durationTitle")}</h4>
      <p>{t("v13.oneMonth")}</p>
      <p>{t("v13.threeMonths")}</p>
      <p>{t("v13.sixMonths")}</p>
      <p>{t("v13.twelveMonths")}</p>
      <p>{t("v13.promoNote")}</p>
      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v13.partialUnstakeTitle")}</h4>
      <p>{t("v13.partialUnstakeDesc")}</p>
      <p>{t("v13.penaltyApplies")}</p>
      <p>{t("v13.rewardsStop")}</p>
      <p>{t("v13.remainingAmount")}</p>
      <p>{t("v13.minimumStake", { tokenSymbol: selectedToken.symbol })}</p>
      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v13.afterDurationTitle")}</h4>
      <p>{t("v13.afterDurationDesc")}</p>
      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v13.promoRulesTitle")}</h4>
      <p>{t("v13.promoPartialUnstake")}</p>
      <p>{t("v13.promoAddFunds")}</p>
      <p>{t("v13.promoAfterDuration")}</p>
      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v13.fixedProblemsTitle")}</h4>
      <p>{t("v13.problem1")}</p>
      <p>{t("v13.problem2")}</p>
      <p>{t("v13.problem3")}</p>
    </div>
  );
};

export default V13;
