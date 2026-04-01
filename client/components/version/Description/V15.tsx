import { useTranslation } from "react-i18next";

const V15: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 text-white">
      <h3 className="text-2xl font-bold">{t("v15.title")}</h3>

      <h4 className="text-lg italic font-semibold">{t("v15.securityReliabilityUpgrade")}</h4>
      <p>{t("v15.intro")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v15.whatsNew")}</h4>
      <p>- {t("v15.new1")}</p>
      <p>- {t("v15.new2")}</p>
      <p>- {t("v15.new3")}</p>
      <p>- {t("v15.new4")}</p>
      <p>- {t("v15.new5")}</p>
      <p>- {t("v15.new6")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v15.aprStakingRules")}</h4>
      <p>- {t("v15.apr1")}</p>
      <p>- {t("v15.apr2")}</p>
      <p>- {t("v15.apr3")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v15.existingStakes")}</h4>
      <p>- {t("v15.existing1")}</p>
      <p>- {t("v15.existing2")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <h4 className="text-lg italic font-semibold">{t("v15.userExperienceSafety")}</h4>
      <p>- {t("v15.user1")}</p>
      <p>- {t("v15.user2")}</p>
    </div>
  );
};

export default V15;
