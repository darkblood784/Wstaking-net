import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { useTranslation } from "react-i18next";
import {
  whitepaperVersionContent,
  whitepaperVersionLabels,
  WhitepaperLocaleKey,
  WhitepaperVersionKey,
} from "@/components/whitepaper/content";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Calculator,
  ChevronDown,
  Database,
  DollarSign,
  Gift,
  GitBranch,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  Building2,
  HandCoins,
} from "lucide-react";

const tableBaseClass =
  "w-full border-collapse overflow-hidden rounded-xl border border-white/10 text-sm md:text-base";

const FLOW_ICONS = [
  Wallet,
  Shield,
  GitBranch,
  Building2,
  Users,
  Bot,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Database,
  Calculator,
  Gift,
  HandCoins,
];

type FlowCard = {
  stepNo: number;
  step: string;
};

const chunk = <T,>(items: T[], size: number): T[][] => {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
};

const buildFlowCards = (steps: string[], cols: number): Array<FlowCard | null> => {
  const mapped = steps.map((step, index) => ({ stepNo: index + 1, step }));
  if (cols <= 1) return mapped;

  return chunk(mapped, cols).flatMap((row, rowIndex) => {
    const serpentine = rowIndex % 2 === 1 ? [...row].reverse() : row;
    if (serpentine.length === cols) return serpentine;

    const placeholders = Array.from({ length: cols - serpentine.length }, () => null);
    return rowIndex % 2 === 1
      ? [...placeholders, ...serpentine]
      : [...serpentine, ...placeholders];
  });
};

const WhitePaper = () => {
  const { i18n } = useTranslation();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [flowColumns, setFlowColumns] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState<WhitepaperVersionKey>("v1.1");
  const [showVersionMenu, setShowVersionMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 320);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-whitepaper-version-menu]")) {
        setShowVersionMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updateFlowColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setFlowColumns(4);
      } else if (width >= 900) {
        setFlowColumns(3);
      } else if (width >= 560) {
        setFlowColumns(2);
      } else {
        setFlowColumns(1);
      }
    };

    updateFlowColumns();
    window.addEventListener("resize", updateFlowColumns);
    return () => window.removeEventListener("resize", updateFlowColumns);
  }, []);

  const locale: WhitepaperLocaleKey = useMemo(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase();
    if (lang.startsWith("zh")) return "zhTW";
    if (lang.startsWith("id")) return "id";
    if (lang.startsWith("hi")) return "hi";
    return "en";
  }, [i18n.resolvedLanguage, i18n.language]);

  const content = whitepaperVersionContent[selectedVersion][locale];

  const tocItems = useMemo(
    () =>
      content.sections.map((section) => ({
        id: section.id,
        label: `${section.number}. ${section.title}`,
      })),
    [content.sections],
  );

  return (
    <div className="min-h-screen bg-[#030605] text-white">
      <Seo
        title="WStaking White Paper - Platform Overview and Risk Disclosure"
        description="Read the WStaking white paper covering platform design, user responsibilities, risk disclosures, and policy terms."
        path="/white-paper"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(18,185,128,0.16),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.08),transparent_45%),linear-gradient(180deg,#040706_0%,#020303_100%)]"
      />

      <Header />

      <main className="pt-28 md:pt-36 pb-24" aria-label="Whitepaper Content">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="relative overflow-visible rounded-3xl border border-white/10 bg-black/45 p-6 md:p-10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(22,201,122,0.14),transparent_45%)]" />

            <div className="relative">
              <div className="flex flex-col gap-5 md:pr-[320px]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#93a59f]">
                      {content.heroProtocolLabel}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-5xl">
                      {content.heroTitle}
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm text-[#b8c4bf] md:text-lg">
                      {content.heroSubtitle}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#7f928b]">
                      {content.heroVersionLine}
                    </p>
                  </div>
                  <div
                    className="w-full max-w-[280px] md:absolute md:right-0 md:top-0 md:w-[280px]"
                    data-whitepaper-version-menu
                  >
                    <label
                      htmlFor="whitepaper-version"
                      className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9ab0a7]"
                    >
                      Version
                    </label>
                    <div className="relative">
                      <button
                        id="whitepaper-version"
                        type="button"
                        onClick={() => setShowVersionMenu((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-full border border-[#19d28f]/50 bg-black/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#19d28f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19d28f]/40"
                        aria-haspopup="listbox"
                        aria-expanded={showVersionMenu}
                      >
                        <span>{whitepaperVersionLabels[locale][selectedVersion]}</span>
                        <ChevronDown
                          size={16}
                          className={`ml-3 shrink-0 text-[#1fe49a] transition-transform ${
                            showVersionMenu ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {showVersionMenu && (
                        <div
                          className="absolute right-0 z-[60] mt-2 w-full overflow-hidden rounded-xl border border-[#19d28f]/40 bg-[#05130d] shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
                          role="listbox"
                          aria-labelledby="whitepaper-version"
                        >
                          {(["v1.0", "v1.1"] as WhitepaperVersionKey[]).map((versionKey) => {
                            const selected = selectedVersion === versionKey;
                            return (
                              <button
                                key={versionKey}
                                type="button"
                                className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition ${
                                  selected
                                    ? "bg-[#0f3b2c] text-[#34e7a5]"
                                    : "text-white hover:bg-[#0b2a1f]"
                                }`}
                                onClick={() => {
                                  setSelectedVersion(versionKey);
                                  setShowVersionMenu(false);
                                }}
                              >
                                {whitepaperVersionLabels[locale][versionKey]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-28 lg:self-start" aria-label={content.tocLabel}>
              <details className="group rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm lg:hidden">
                <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                  {content.showSectionsLabel}
                </summary>
                <nav className="mt-4">
                  <ul className="space-y-2">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="block rounded-lg px-3 py-2 text-sm text-[#b6c3be] hover:bg-white/5 hover:text-white"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>

              <div className="hidden rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm lg:block">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8ca098]">
                  {content.tocLabel}
                </h2>
                <nav>
                  <ul className="space-y-1.5">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="block rounded-lg px-3 py-2 text-sm text-[#b6c3be] transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17b97d]"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>

            <div className="space-y-6">
              {content.sections.map((section) => (
                <section
                  id={section.id}
                  key={section.id}
                  className="scroll-mt-28 rounded-2xl border border-white/10 bg-black/45 p-5 md:p-7 backdrop-blur-sm"
                  aria-labelledby={`${section.id}-title`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#123327] px-2 text-xs font-semibold text-[#3be59f]">
                      {section.number}
                    </span>
                    <h2 id={`${section.id}-title`} className="text-xl font-semibold md:text-2xl">
                      {section.title}
                    </h2>
                  </div>
                  {section.subtitle && (
                    <p className="mb-4 text-sm text-[#9fb1aa] md:text-base">{section.subtitle}</p>
                  )}

                  {section.paragraphs && (
                    <div className="space-y-3 text-sm leading-relaxed text-[#bcc8c3] md:text-base">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  )}

                  {section.bullets && (
                    <ul className="mt-4 space-y-2 text-sm text-[#bcc8c3] md:text-base">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#25d58f]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.table && (
                    <div className="mt-6 space-y-6">
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-white">
                          {section.table.title}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className={tableBaseClass}>
                            <thead className="bg-white/5">
                              <tr>
                                {section.table.headers.map((header) => (
                                  <th key={header} className="px-4 py-3 text-left font-semibold text-[#d7e0dc]">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {section.table.rows.map((row) => (
                                <tr key={row.join("-")} className="border-t border-white/10">
                                  {row.map((cell) => (
                                    <td key={cell} className="px-4 py-3 text-[#b9c6c1]">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {section.secondaryTable && (
                        <div>
                          <h3 className="mb-3 text-lg font-semibold text-white">
                            {section.secondaryTable.title}
                          </h3>
                          <div className="overflow-x-auto">
                            <table className={tableBaseClass}>
                              <thead className="bg-white/5">
                                <tr>
                                  {section.secondaryTable.headers.map((header) => (
                                    <th
                                      key={header}
                                      className="px-4 py-3 text-left font-semibold text-[#d7e0dc]"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {section.secondaryTable.rows.map((row) => (
                                  <tr key={row.join("-")} className="border-t border-white/10">
                                    {row.map((cell) => (
                                      <td key={cell} className="px-4 py-3 text-[#b9c6c1]">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {section.flowSteps && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1712]/80 via-[#08110d]/90 to-[#050807]/95 p-3 sm:p-4 md:p-5">
                      {(() => {
                        const cards = buildFlowCards(section.flowSteps, flowColumns);
                        const positionByStep = new Map<number, { row: number; col: number }>();
                        cards.forEach((card, index) => {
                          if (!card) return;
                          positionByStep.set(card.stepNo, {
                            row: Math.floor(index / flowColumns),
                            col: index % flowColumns,
                          });
                        });

                        return (
                          <ol
                            className="grid gap-3 sm:gap-4"
                            style={{ gridTemplateColumns: `repeat(${flowColumns}, minmax(0, 1fr))` }}
                          >
                            {cards.map((card, index) => {
                              if (!card) {
                                return (
                                  <li
                                    key={`empty-${index}`}
                                    aria-hidden="true"
                                    className="h-[164px] sm:h-[180px] md:h-[196px] lg:h-[208px] xl:h-[220px]"
                                  />
                                );
                              }

                              const Icon = FLOW_ICONS[(card.stepNo - 1) % FLOW_ICONS.length];
                              const current = positionByStep.get(card.stepNo);
                              const next = positionByStep.get(card.stepNo + 1);
                              let connector: "right" | "left" | "down" | null = null;
                              if (current && next) {
                                if (current.row === next.row && current.col + 1 === next.col) connector = "right";
                                if (current.row === next.row && current.col - 1 === next.col) connector = "left";
                                if (current.col === next.col && current.row + 1 === next.row) connector = "down";
                              }

                              return (
                                <li
                                  key={`${card.stepNo}-${card.step}`}
                                  className="relative h-[164px] rounded-xl border border-[#2f6f58]/50 bg-[radial-gradient(circle_at_0%_0%,rgba(50,116,89,0.45),rgba(19,43,34,0.8)_42%,rgba(9,19,15,0.95)_100%)] px-3 py-3 shadow-[0_10px_30px_rgba(2,8,6,0.45)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#50b58a]/70 sm:h-[180px] sm:px-4 sm:py-4 md:h-[196px] lg:h-[208px] xl:h-[220px]"
                                >
                                  <div className="flex h-full flex-col items-center text-center">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#4da17d]/65 bg-[#2e6a55]/55 text-[#5be6a8] sm:h-11 sm:w-11 md:h-12 md:w-12 xl:h-[52px] xl:w-[52px]">
                                      <Icon size={22} strokeWidth={2.1} className="sm:h-6 sm:w-6 xl:h-7 xl:w-7" />
                                    </span>
                                    <span className="mt-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-[#4da17d]/60 bg-[#1d4d3c]/75 px-2 text-xs font-semibold text-[#6cf0b4] sm:mt-2.5 sm:h-[30px] sm:min-w-[30px] sm:text-sm">
                                      {card.stepNo}
                                    </span>
                                    <p className="mt-2 flex flex-1 items-center text-center text-sm font-semibold leading-snug text-[#ecf4f1] sm:text-base md:text-lg xl:text-xl">
                                      {card.step}
                                    </p>
                                  </div>

                                  {connector === "right" && (
                                    <span className="pointer-events-none absolute -right-3 top-1/2 -translate-y-1/2 text-[#4fb98a]">
                                      <ArrowRight size={30} strokeWidth={2.6} />
                                    </span>
                                  )}
                                  {connector === "left" && (
                                    <span className="pointer-events-none absolute -left-3 top-1/2 -translate-y-1/2 text-[#4fb98a]">
                                      <ArrowRight size={30} strokeWidth={2.6} className="rotate-180" />
                                    </span>
                                  )}
                                  {connector === "down" && (
                                    <span className="pointer-events-none absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[#4fb98a]">
                                      <ArrowDown size={26} strokeWidth={2.5} />
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        );
                      })()}
                      {section.flowFooter && (
                        <p className="mt-6 text-center text-sm text-[#8ea8a0] md:text-base">
                          {section.flowFooter}
                        </p>
                      )}
                      {section.flowNote && (
                        <p className="mt-1 text-center text-xs text-[#7f958e] md:text-sm">
                          {section.flowNote}
                        </p>
                      )}
                    </div>
                  )}

                  {section.riskCategories && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {section.riskCategories.map((category) => (
                        <div
                          key={category.label}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                        >
                          <h3 className="text-sm font-semibold text-white md:text-base">
                            {category.label}
                          </h3>
                          <ul className="mt-2 space-y-2 text-sm text-[#b9c6c1]">
                            {category.items.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#25d58f]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}

              <section
                id="disclaimer"
                className="scroll-mt-28 rounded-2xl border border-[#1f5f47] bg-[#0a1712]/70 p-5 md:p-7"
                aria-labelledby="disclaimer-title"
              >
                <h2 id="disclaimer-title" className="text-xl font-semibold md:text-2xl">
                  {content.disclaimerTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#c7d2ce] md:text-base">
                  {content.disclaimerBody}
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:border-[#22C55F] hover:text-[#22C55F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55F]"
        >
          {content.backToTopLabel}
        </button>
      )}

      <Footer />
    </div>
  );
};

export default WhitePaper;
