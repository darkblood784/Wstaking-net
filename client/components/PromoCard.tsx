import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import card1Gif from "@/assets/carousel/carousel1.gif";
import card2Png from "@/assets/carousel/carousel2.png";
import card3Png from "@/assets/carousel/carousel3.png";

type PromoSlide = {
  badge: string;
  category: string;
  title: string;
  description: string;
  cta: string;
  image: string;
  action?: "telegram" | "staking" | "external";
  externalUrl?: string;
  brandLogo?: string;
};

export function PromoCard() {
  const { t } = useTranslation();
  const TELEGRAM_URL = "https://t.me/+RhrIeg92drQ5YjM1";
  const TASKON_URL = "https://taskon.xyz/quest/184555294";
  const DEFAULT_SLIDE_MS = 5000;
  const FEATURED_SLIDE_MS = 9000;
  const TASKON_LOGO =
    "data:image/svg+xml,%3csvg%20width='28'%20height='28'%20viewBox='0%200%2028%2028'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M18.4215%200.706055C22.5012%202.07281%2025.7108%205.27781%2027.1049%209.32934C27.6635%2010.8004%2027.9692%2012.3953%2027.9692%2014.0613C27.9692%2018.6948%2025.6048%2022.7782%2022.0123%2025.1798C19.7331%2026.7993%2016.9435%2027.7521%2013.9305%2027.7521C13.0442%2027.7521%2012.0765%2027.5995%2011.2363%2027.4419L11.2394%2027.4365C11.2866%2027.3528%2011.8817%2026.298%2013.0246%2024.2722L18.1873%2015.089L18.8675%2013.9155L16.6286%2010.0529H13.0551C16.6327%203.82168%2018.4215%200.706055%2018.4215%200.706055Z'%20fill='%23CBFF01'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M13.9306%200C14.9611%200%2015.8796%200.07067%2016.8464%200.282127C16.8535%200.283679%2014.9249%203.72045%2011.0606%2010.5924L10.4115%2011.7287L9.78193%2012.8485L9.10176%2014.0219L11.3406%2017.8846H14.9257L9.79839%2026.7611C9.78841%2026.7764%209.77974%2026.7914%209.77141%2026.8058L9.73538%2026.8683C9.65292%2027.0112%209.6117%2027.0826%209.6117%2027.0826C3.99383%2025.2943%200%2020.0653%200%2013.8761C0%206.21254%206.23695%200%2013.9306%200Z'%20fill='%2300FFA3'/%3e%3c/svg%3e";
  const [currentIndex, setCurrentIndex] = useState(2);
  const [trackIndex, setTrackIndex] = useState(2);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const targetTime = useMemo(() => new Date("2026-05-04T00:00:00+08:00").getTime(), []);
  const [countdown, setCountdown] = useState("00D:00H:00M:00S");

  const slides: PromoSlide[] = [
    {
      badge: t("promoCarousel.slide1.badge"),
      category: t("promoCarousel.slide1.category"),
      title: t("promoCarousel.slide1.title"),
      description: t("promoCarousel.slide1.description"),
      cta: t("promoCarousel.slide1.cta"),
      image: card1Gif,
      action: "telegram",
    },
    {
      badge: t("promoCarousel.slide2.badge"),
      category: "",
      title: t("promoCarousel.slide2.title"),
      description: t("promoCarousel.slide2.description"),
      cta: t("promoCarousel.slide2.cta"),
      image: card2Png,
      action: "staking",
    },
    {
      badge: `ENDS IN ${countdown}`,
      category: t("promoCarousel.slide4.category", { defaultValue: "TaskOn Campaign" }),
      title: t("promoCarousel.slide4.title", { defaultValue: "1000 USDT Prize Pool" }),
      description: t("promoCarousel.slide4.description", {
        defaultValue: "Join the live TaskOn quest\n100 users will be selected\nRewards: 5 to 10 USDT",
      }),
      cta: t("promoCarousel.slide4.cta", { defaultValue: "Join on TaskOn" }),
      image: card3Png,
      action: "external",
      externalUrl: TASKON_URL,
      brandLogo: TASKON_LOGO,
    },
  ];

  useEffect(() => {
    const updateCountdown = () => {
      const diff = Math.max(0, targetTime - Date.now());
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (60 * 60 * 24));
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;
      const pad = (value: number) => value.toString().padStart(2, "0");
      setCountdown(`${days}D:${pad(hours)}H:${pad(minutes)}M:${pad(seconds)}S`);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  useEffect(() => {
    const isFeaturedSlide = currentIndex === 2;
    const delay = isFeaturedSlide ? FEATURED_SLIDE_MS : DEFAULT_SLIDE_MS;

    const id = window.setTimeout(() => {
      setTransitionEnabled(true);
      setTrackIndex((prev) => (prev >= slides.length ? prev : prev + 1));
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, delay);

    return () => window.clearTimeout(id);
  }, [currentIndex, slides.length]);

  const loopToStartWithoutReverse = () => {
    setTransitionEnabled(false);
    setTrackIndex(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });
  };

  const goToPrevious = () => {
    if (trackIndex === 0) {
      setTransitionEnabled(false);
      setTrackIndex(slides.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          setTrackIndex(slides.length - 1);
          setCurrentIndex(slides.length - 1);
        });
      });
      return;
    }

    setTransitionEnabled(true);
    setTrackIndex((prev) => prev - 1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setTransitionEnabled(true);
    setTrackIndex((prev) => (prev >= slides.length ? prev : prev + 1));
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = event.changedTouches[0]?.clientX ?? null;
    const start = touchStartX.current;
    const end = touchEndX.current;
    if (start === null || end === null) return;

    const deltaX = end - start;
    const swipeThreshold = 40;

    if (deltaX > swipeThreshold) {
      goToPrevious();
    } else if (deltaX < -swipeThreshold) {
      goToNext();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleCtaClick = (slide: PromoSlide) => {
    if (slide.action === "telegram") {
      window.open(TELEGRAM_URL, "_blank", "noopener,noreferrer");
      return;
    }

    if (slide.action === "external" && slide.externalUrl) {
      window.open(slide.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const stakingSection = document.getElementById("start-staking");
    if (!stakingSection) return;

    const yOffset = -88;
    const y = stakingSection.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const renderSlides = [...slides, slides[0]];

  return (
    <div className="w-full max-w-[820px] mx-auto px-3 sm:px-4 md:px-0 mb-6 md:mb-10">
      <div
        className="relative rounded-[13px] border-2 border-[#272828] overflow-hidden bg-black touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`flex min-h-[248px] h-auto sm:min-h-[276px] sm:h-[276px] md:h-[276px] ${
            transitionEnabled ? "transition-transform duration-500 ease-out" : ""
          }`}
          style={{ transform: `translateX(-${trackIndex * 100}%)` }}
          onTransitionEnd={() => {
            if (trackIndex === slides.length) {
              loopToStartWithoutReverse();
            }
          }}
        >
          {renderSlides.map((slide, index) => {
            const realIndex = index % slides.length;
            const realSlide = slides[realIndex];
            const isCardOne = realIndex === 0;
            const isCardTwo = realIndex === 1;
            const isCardFour = realIndex === 2;

            return (
              <div
                key={`${slide.title}-${index}`}
                className="relative w-full h-full shrink-0"
              >
                {isCardFour ? (
                  <div className="absolute top-2 left-3 sm:top-3 sm:left-4 md:top-3 md:left-5 z-10">
                    <div className="rounded-full border border-[#1f5a43] bg-[#0d2a1f]/95 px-3 py-1.5 sm:px-4 sm:py-2">
                      <span className="text-[#40D88D] text-[12px] sm:text-[13px] md:text-[14px] font-bold tracking-[1.1px]">
                        LIVE
                      </span>
                    </div>
                  </div>
                ) : null}

                <div
                  className={`absolute top-0 right-0 rounded-bl-[13px] bg-gradient-to-r from-[#12B980] to-[#22C45F] flex items-center justify-center z-10 ${
                    isCardFour
                      ? "min-h-[44px] sm:min-h-[48px] md:min-h-[47px] px-4 sm:px-5 md:px-6 min-w-[230px] sm:min-w-[280px] md:min-w-[320px]"
                      : "h-11 sm:h-12 md:h-[47px] px-4 sm:px-5 md:px-6"
                  }`}
                >
                  <span
                    className={`text-black font-bold text-right whitespace-nowrap ${
                      isCardFour
                        ? "text-[14px] sm:text-[18px] md:text-[19px] tracking-[0.15px]"
                        : "text-lg sm:text-xl md:text-[22px]"
                    }`}
                  >
                    {slide.badge}
                  </span>
                </div>

                <div
                  className={`grid h-full ${
                    isCardOne
                      ? "grid-cols-[minmax(0,1fr)_minmax(130px,44%)] sm:grid-cols-[minmax(0,1fr)_minmax(220px,46%)] md:grid-cols-[minmax(0,1fr)_minmax(205px,40%)]"
                      : "grid-cols-[minmax(0,1fr)_minmax(90px,31%)] sm:grid-cols-[minmax(0,1fr)_minmax(165px,40%)] md:grid-cols-[minmax(0,1fr)_minmax(205px,40%)]"
                  }`}
                >
                  <div
                    className={`px-4 sm:px-7 md:pl-[49px] md:pr-6 pb-3 sm:pb-3 md:pb-[28px] flex flex-col ${
                      isCardFour ? "pt-[64px] sm:pt-[68px] md:pt-[58px]" : "pt-[52px] sm:pt-[56px] md:pt-[46px]"
                    }`}
                  >
                    {slide.category ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white text-[12px] md:text-[13px] tracking-[1.1px] pr-2 sm:pr-4 md:pr-0">
                        {slide.brandLogo ? (
                          <img
                            src={slide.brandLogo}
                            alt={`${slide.category} logo`}
                            className="h-4 w-4 sm:h-[18px] sm:w-[18px] object-contain shrink-0"
                          />
                        ) : null}
                        <span className="leading-none">{slide.category}</span>
                      </div>
                    ) : null}
                    <div
                      className={`${
                        slide.category ? "mt-2.5 sm:mt-3" : "mt-0"
                      } flex flex-col ${
                        isCardFour ? "gap-2 sm:gap-2.5 md:gap-2.5" : "gap-2.5 sm:gap-3 md:gap-3"
                      }`}
                    >
                      <h2
                        className={`text-white font-bold leading-[109%] capitalize max-w-[360px] md:max-w-[420px] ${
                          isCardFour ? "text-[18px] sm:text-[24px] md:text-[32px]" : "text-[20px] sm:text-[28px] md:text-[32px]"
                        }`}
                      >
                        {slide.title}
                      </h2>
                      <p
                        className={`text-[#C2C2C2] tracking-[0.2px] max-w-[360px] whitespace-pre-line ${
                          isCardFour
                            ? "text-[12px] sm:text-[15px] md:text-[17px] leading-[118%] md:leading-[124%]"
                            : "text-[14px] sm:text-[18px] md:text-[20px] leading-[123%] md:leading-[130%]"
                        }`}
                      >
                        {slide.description}
                      </p>
                    </div>
                    <div
                      className={`${
                        isCardFour ? "mt-3 sm:mt-4 md:mt-5" : "mt-5 sm:mt-6 md:mt-8"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCtaClick(realSlide)}
                        className={`whitespace-nowrap leading-none font-bold bg-gradient-to-r from-[#40D88D] via-[#42D881] to-[#17BC81] bg-clip-text text-transparent hover:opacity-80 transition-opacity ${
                          isCardFour ? "text-[16px] sm:text-[22px] md:text-[30px]" : "text-[18px] sm:text-[24px] md:text-[30px]"
                        }`}
                      >
                        {slide.cta}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center md:justify-end pb-0 sm:pb-2 md:pb-0 pr-1 sm:pr-3 md:pr-8 pt-3 sm:pt-3 md:pt-9">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      style={
                        isCardOne
                          ? {
                              mixBlendMode: "screen",
                              opacity: 0.95,
                              WebkitMaskImage:
                                "radial-gradient(circle at center, black 72%, transparent 100%)",
                              maskImage:
                                "radial-gradient(circle at center, black 72%, transparent 100%)",
                            }
                          : undefined
                      }
                      className={
                        isCardOne
                          ? "w-[78%] sm:w-[90%] max-w-[170px] sm:max-w-[314px] h-auto object-contain"
                          : isCardFour
                            ? "w-[68%] sm:w-[82%] max-w-[140px] sm:max-w-[235px] md:max-w-[240px] h-auto object-contain"
                            : `w-[76%] sm:w-[88%] max-w-[165px] sm:max-w-[245px] md:max-w-[240px] h-auto object-contain ${
                                isCardTwo ? "-translate-x-4 translate-y-8 sm:translate-x-0 sm:translate-y-8" : ""
                              }`
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center mt-5">
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setTransitionEnabled(true);
                setCurrentIndex(index);
                setTrackIndex(index);
              }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-gradient-to-r from-[#40D88D] to-[#17BC81] w-8"
                  : "bg-[#272828] hover:bg-[#40D88D] w-2.5"
              }`}
              aria-label={`${t("promoCarousel.goToSlide")} ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
