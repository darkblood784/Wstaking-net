import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ExternalLink, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Seo } from "@/components/Seo";
import { FAQ_CATEGORIES as FAQ_EN } from "@/data/FAQ_DATA.en";
import { FAQ_CATEGORIES as FAQ_ID } from "@/data/FAQ_DATA.id";
import { FAQ_CATEGORIES as FAQ_HI } from "@/data/FAQ_DATA.hi";
import { FAQ_CATEGORIES as FAQ_ZH } from "@/data/FAQ_DATA.zh";


type FAQItem = {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
};

type SearchFAQItem = FAQItem & {
  categoryId: string;
  categoryLabel: string;
  score: number;
};

export default function FAQ() {
  const { i18n, t } = useTranslation();
  const languageCode = i18n.language.split("-")[0];
  const localizedCategories = useMemo(() => {
    switch (languageCode) {
      case "id":
        return FAQ_ID;
      case "hi":
        return FAQ_HI;
      case "zh":
        return FAQ_ZH;
      case "en":
      default:
        return FAQ_EN;
    }
  }, [languageCode]);

  const [activeCategoryId, setActiveCategoryId] = useState(
    localizedCategories[0]?.id ?? "general",
  );
  const [searchValue, setSearchValue] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState<string | undefined>(
    localizedCategories[0]?.items[0]?.id,
  );

  const activeCategory = useMemo(() => {
    return (
      localizedCategories.find((category) => category.id === activeCategoryId) || localizedCategories[0]
    );
  }, [activeCategoryId, localizedCategories]);

  const filteredItems = useMemo<FAQItem[]>(() => {
    const value = searchValue.trim().toLowerCase();
    if (!value) return activeCategory?.items ?? [];

    return (activeCategory?.items ?? []).filter((item) => {
      const inQuestion = item.question.toLowerCase().includes(value);
      const inAnswer = item.answer.toLowerCase().includes(value);
      const inTags = item.tags?.some((tag) => tag.toLowerCase().includes(value));
      return inQuestion || inAnswer || inTags;
    });
  }, [activeCategory, searchValue]);

  const searchResults = useMemo<{
    items: SearchFAQItem[];
    bestCategoryId: string;
    counts: Map<string, number>;
  }>(() => {
    const value = searchValue.trim().toLowerCase();
    if (!value) {
      return {
        items: [],
        bestCategoryId: activeCategoryId,
        counts: new Map<string, number>(),
      };
    }

    const results: SearchFAQItem[] = [];
    const counts = new Map<string, number>();

    localizedCategories.forEach((category) => {
      category.items.forEach((item) => {
        const q = item.question.toLowerCase();
        const a = item.answer.toLowerCase();
        const tags = item.tags ?? [];
        const inQuestion = q.includes(value);
        const inAnswer = a.includes(value);
        const inTags = tags.some((tag) => tag.toLowerCase().includes(value));
        if (!inQuestion && !inAnswer && !inTags) return;

        const score = (inQuestion ? 3 : 0) + (inTags ? 2 : 0) + (inAnswer ? 1 : 0);
        results.push({
          ...item,
          categoryId: category.id,
          categoryLabel: category.label,
          score,
        });
        counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
      });
    });

    results.sort((a, b) => b.score - a.score);
    const bestCategoryId = results[0]?.categoryId ?? activeCategoryId;
    return { items: results, bestCategoryId, counts };
  }, [activeCategoryId, localizedCategories, searchValue]);

  useEffect(() => {
    if (searchValue.trim()) return;
    if (!localizedCategories.length) return;
    const hasCategory = localizedCategories.some((category) => category.id === activeCategoryId);
    if (!hasCategory) {
      setActiveCategoryId(localizedCategories[0]?.id ?? "general");
      setActiveQuestionId(localizedCategories[0]?.items[0]?.id);
      return;
    }
    const currentCategory =
      localizedCategories.find((category) => category.id === activeCategoryId) || localizedCategories[0];
    const hasQuestion = currentCategory?.items.some((item) => item.id === activeQuestionId);
    if (!hasQuestion) {
      setActiveQuestionId(currentCategory?.items[0]?.id);
    }
  }, [activeCategoryId, activeQuestionId, localizedCategories, searchValue]);

  useEffect(() => {
    if (searchValue.trim()) {
      const hasActive = searchResults.items.some((item) => item.id === activeQuestionId);
      if (!hasActive) {
        setActiveQuestionId(searchResults.items[0]?.id);
      }
      return;
    }
    if (searchResults.bestCategoryId && searchResults.bestCategoryId !== activeCategoryId) {
      setActiveCategoryId(searchResults.bestCategoryId);
    }
    const hasActive = filteredItems.some((item) => item.id === activeQuestionId);
    if (!hasActive) {
      setActiveQuestionId(filteredItems[0]?.id);
    }
  }, [filteredItems, activeCategoryId, activeQuestionId, searchResults, searchValue]);

  const displayItems: Array<FAQItem | SearchFAQItem> = searchValue.trim()
    ? searchResults.items
    : filteredItems;
  const activeQuestion = displayItems.find((item) => item.id === activeQuestionId) || displayItems[0];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Seo
        title="WStaking FAQ - Staking Rules, Rewards, and Withdrawals"
        description="Find answers about staking durations, rewards, penalties, wallets, and withdrawal behavior on WStaking."
        path="/faq"
      />
      <Header />
      <main className="pt-28 md:pt-40 pb-20">
        <section className="container">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-ws-green font-grotesk text-lg md:text-xl">{t("faq.label")}</p>
              <h1 className="mt-2 text-3xl md:text-5xl font-grotesk font-semibold">
                {t("faq.title")}
              </h1>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10" />

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {localizedCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={cn(
                  "flex items-center gap-2 text-sm md:text-base font-grotesk transition-colors",
                  activeCategoryId === category.id ? "text-ws-green" : "text-white/70 hover:text-white",
                )}
              >
                <span>{category.label}</span>
                <span
                  className={cn(
                    "flex items-center justify-center text-xs rounded-full px-2 py-0.5 border",
                    activeCategoryId === category.id
                      ? "border-ws-green/60 text-ws-green"
                      : "border-white/15 text-white/60",
                  )}
                >
                  {searchValue.trim()
                    ? searchResults.counts.get(category.id) ?? 0
                    : category.items.length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 border-t border-white/10" />

          <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={t("faq.search")}
                  className="h-11 rounded-full bg-white/5 border-white/10 pl-10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5">
                <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/40">
                  {activeCategory?.label}
                </div>
                <div className="divide-y divide-white/10">
                  {displayItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveQuestionId(item.id);
                        if ("categoryId" in item) {
                          setActiveCategoryId(item.categoryId);
                        }
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 text-sm md:text-base transition-colors",
                        activeQuestionId === item.id
                          ? "bg-ws-green/10 text-ws-green"
                          : "text-white/80 hover:text-white",
                      )}
                    >
                      <span className="text-ws-green">›</span>
                      <span>
                        {item.question}
                        {"categoryLabel" in item && searchValue.trim() ? (
                          <span className="ml-2 text-xs text-white/50">({item.categoryLabel})</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="rounded-2xl border border-white/10 bg-white/5">
              <div className="px-6 pb-6 pt-6">
                <Accordion
                  type="single"
                  collapsible
                  value={activeQuestionId}
                  onValueChange={(value) => setActiveQuestionId(value || undefined)}
                  className="mt-4"
                >
                  {displayItems.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="border-white/10">
                      <AccordionTrigger className="text-left text-base md:text-lg text-white/90 hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm md:text-base text-white/70 whitespace-pre-line">
                        {item.answer}
                        {(item.tags ?? []).length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {item.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-ws-green/40 bg-ws-green/10 px-3 py-1 text-xs text-ws-green"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-6 border-t border-white/10 pt-4 text-sm text-white/60">
                  <span className="mr-2">{t("faq.needHelp")}</span>
                  <a
                    href="mailto:service@wstaking.net"
                    className="inline-flex items-center gap-2 text-ws-green hover:text-ws-green-light"
                  >
                    {t("faq.contactSupport")}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
