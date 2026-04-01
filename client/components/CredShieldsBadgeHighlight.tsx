import auditedBadgeDark from "@/assets/images/CredShields-Audited-Badge-Dark.svg";

export function CredShieldsBadgeHighlight() {
  return (
    <div className="mx-auto mt-8 flex w-full max-w-[360px] justify-center md:mt-10 md:max-w-[420px]">
      <div className="relative">
        <div className="absolute inset-x-6 inset-y-8 rounded-[36px] bg-[radial-gradient(circle,rgba(88,255,147,0.22)_0%,rgba(88,255,147,0.08)_46%,rgba(88,255,147,0)_76%)] blur-2xl" />
        <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(8,16,13,0.92),rgba(11,25,19,0.94))] px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm md:px-4 md:py-4">
          <img
            src={auditedBadgeDark}
            alt="Official CredShields audited badge"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default CredShieldsBadgeHighlight;
