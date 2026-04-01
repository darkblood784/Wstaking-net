import { useTranslation } from "react-i18next";

const V12: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 text-white">
      <h3 className="text-2xl font-bold">{t("version12.title")}</h3>

      <p>{t("version12.aprRanges")}</p>
      <p>{t("version12.oneMonth")}</p>
      <p>{t("version12.threeMonths")}</p>
      <p>{t("version12.sixMonths")}</p>
      <p>{t("version12.twelveMonths")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version12.originalTerms")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version12.integration")}</p>
    </div>
  );
};

export default V12;
