import { useTranslation } from "react-i18next";

const V14: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 text-white">
      <h3 className="text-2xl font-bold">{t("v14.title")}</h3>

      <h4 className="text-lg italic font-semibold">{t("v14.multiChainExpansion")}</h4>
      <h4 className="text-lg italic font-semibold">{t("v14.availableNetworks")}</h4>
      <p>- {t("v14.xLayer")}</p>
      <p>- {t("v14.bsc")}</p>
      <p>- {t("v14.base")}</p>
      <p>{t("v14.chainDescription")}</p>

      <p>{t("v14.supportedAssets")}</p>
      <h4 className="text-lg italic font-semibold">{t("v14.xLayerAssets")}</h4>
      <p>- {t("v14.xlayerUsdt")}</p>
      <p>- {t("v14.usdt")}</p>
      <p>- {t("v14.usdc")}</p>

      <div className="h-4" />

      <h4 className="text-lg italic font-semibold">{t("v14.bscBaseAssets")}</h4>
      <p>- {t("v14.usdt")}</p>
      <p>- {t("v14.usdc")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v14.aprStakingRules")}</h4>
      <p>{t("v14.aprDescription")}</p>
      <p>- {t("v14.aprRangesUnchanged")}</p>
      <p>- {t("v14.timeBasedPenalty")}</p>
      <p>- {t("v14.partialUnstakeAllowed")}</p>
      <p>- {t("v14.noPenaltyAfterDuration")}</p>
      <p>- {t("v14.promoRules")}</p>
      <div className="ml-4 space-y-2">
        <p>- {t("v14.noPartialUnstake")}</p>
        <p>- {t("v14.addFundsPromoOnly")}</p>
        <p>- {t("v14.afterDurationFullUnstake")}</p>
      </div>

      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v14.existingStakes")}</h4>
      <p>- {t("v14.existingStakesKeepTerms")}</p>
      <p>- {t("v14.newStakesFollowV14")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v14.userExperienceSafety")}</h4>
      <p>- {t("v14.chainDisplay")}</p>
      <p>- {t("v14.unifiedLogic")}</p>
      <p>- {t("v14.auditedContracts")}</p>
    </div>
  );
};

export default V14;
