import { useTranslation } from "react-i18next";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";

const V10: React.FC = () => {
  const { t } = useTranslation();
  const { selectedToken } = useSelectedToken();

  return (
    <div className="space-y-3 text-white">
      <h3 className="text-2xl font-bold">{t("version10.title")}</h3>

      <p>{t("version10.oneMonth")}</p>
      <p>{t("version10.sixMonths")}</p>
      <p>{t("version10.twelveMonths")}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version10.aprExplanation", { tokenSymbol: selectedToken.symbol })}</p>

      <div className="h-px w-full bg-white/20 my-6" />

      <p>{t("version10.unstakeBeforeDuration")}</p>
      <p>{t("version10.penalty")}</p>
    </div>
  );
};

export default V10;
