import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/components/i18n/LangProvider";
import { LanguageSwitcher, saveLanguage } from "@/components/i18n/LanguageSwitcher";
import { Hero } from "@/components/landing/Hero";
import { copy } from "@/lib/copy";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { landingFor } from "@/lib/i18n/landing";
import { LANGS, LANG_COOKIE, LANG_EVENT, LANG_INFO, LANG_STORAGE_KEY, toLang, type Lang } from "@/lib/i18n/languages";
import { fill, tightenChinese, translateString, translateTree } from "@/lib/i18n/translate";
import { money, whole } from "@/lib/pricing";

const nonEnglish = LANGS.filter((l): l is Exclude<Lang, "en"> => l !== "en");
const strings = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
};
const placeholders = (s: string) => (s.match(/\{[a-zA-Z0-9]+\}/g) ?? []).sort();

describe("languages", () => {
  it("supports exactly the five languages, each named in its own language", () => {
    expect(LANGS).toEqual(["en", "fr", "es", "ru", "zh"]);
    expect(LANGS.map((l) => LANG_INFO[l].name)).toEqual(["English", "Français", "Español", "Русский", "中文"]);
    expect(LANGS.map((l) => LANG_INFO[l].short)).toEqual(["EN", "FR", "ES", "RU", "中文"]);
    expect(LANGS.map((l) => LANG_INFO[l].locale)).toEqual(["en-CA", "fr-CA", "es", "ru", "zh-CN"]);
  });
  it("treats anything unknown as English, including right-to-left languages that are not supported", () => {
    for (const v of [undefined, null, "", "xx", "fa", "ar", "he", "FR", 5]) expect(toLang(v)).toBe("en");
    expect(toLang("zh")).toBe("zh");
  });
});

describe("translating", () => {
  it("falls back to English for a string that has no translation, never to a raw key", () => {
    expect(translateString("Brand new sentence", { Other: "x" }, "fr")).toBe("Brand new sentence");
    expect(translateString("Get started", { "Get started": "" }, "fr")).toBe("Get started");
    expect(translateString("Get started", { "Get started": "Commencer" }, "fr")).toBe("Commencer");
  });
  it("keeps the shape of the copy and never touches non-text values", () => {
    const out = translateTree({ a: ["Get started", 3, null], b: { c: "Back" } }, { "Get started": "Commencer", Back: "Retour" }, "fr");
    expect(out).toEqual({ a: ["Commencer", 3, null], b: { c: "Retour" } });
  });
  it("removes the space between Chinese characters but keeps it next to Latin letters", () => {
    expect(tightenChinese("预约 演示")).toBe("预约演示");
    expect(tightenChinese("用 Clinx 发展")).toBe("用 Clinx 发展");
    expect(tightenChinese("Google 评价")).toBe("Google 评价");
  });
  it("fills positional placeholders", () => {
    expect(fill("{0} competitors, {1}", 6, "ok")).toBe("6 competitors, ok");
    expect(fill("{0} and {2}", "a")).toBe("a and {2}");
  });
});

describe("dictionaries", () => {
  const english = strings(copy.landing);
  it.each(nonEnglish)("%s: every entry matches a real English string, so a copy edit cannot silently orphan it", (lang) => {
    const known = new Set(english);
    const orphans = Object.keys(dictionaries[lang] ?? {}).filter((k) => !known.has(k));
    expect(orphans).toEqual([]);
  });
  it.each(nonEnglish)("%s: keeps every placeholder and leaves nothing empty", (lang) => {
    for (const [en, tr] of Object.entries(dictionaries[lang] ?? {})) {
      expect(tr.trim(), en).not.toBe("");
      expect(placeholders(tr), en).toEqual(placeholders(en));
    }
  });
  it.each(nonEnglish)("%s: covers the landing page except names that stay as they are", (lang) => {
    const stays = new Set(["Montréal, QC", "Toronto, ON", "Vancouver, BC", "Essential", "Growth", "Scale", "Google Analytics + Search Console", "Jane App URL", "yourclinic.janeapp.com", "Alex Dupont", "alex@clinic.ca", "you@clinic.com", "LinkedIn", "Instagram", "Facebook", "Toronto, ON, Canada"]);
    const keys = new Set(["features", "how-it-works", "numbers", "pricing", "blog", "success", "primary", "info", "neutral", "alert", "warning", "locations", "disciplines", "seo", "strategy", "EN"]);
    const missing = english.filter((s) => /[A-Za-z]{2,}/.test(s) && !/^(https?:|mailto:|tel:|\/|#[a-z]|info@|\+1)/.test(s) && !stays.has(s) && !keys.has(s) && !dictionaries[lang]?.[s]);
    expect(missing).toEqual([]);
  });
  it("never translates the internal keys the components rely on", () => {
    for (const lang of nonEnglish) {
      const t = landingFor(lang);
      expect(t.nav.links.map((l) => l.id)).toEqual(["features", "how-it-works", "numbers", "pricing", "blog"]);
      expect(t.features.card.tiles.map((x) => x.tone)).toEqual(["success", "primary", "info", "neutral"]);
      expect(t.pricingPage.finder.questions.map((q) => q.key)).toEqual(["locations", "disciplines", "seo", "strategy"]);
    }
  });
  it("gives the hero a real translation in each language and leaves English untouched", () => {
    expect(landingFor("en")).toBe(copy.landing);
    expect(landingFor("fr").hero.cta).toBe("Commencer");
    expect(landingFor("es").hero.cta).toBe("Empezar");
    expect(landingFor("ru").hero.cta).toBe("Начать");
    expect(landingFor("zh").hero.cta).toBe("立即开始");
    expect(landingFor("zh").hero.headline2).toBe("诊所增长。");
  });
});

describe("numbers and dates follow the language", () => {
  const plain = (s: string) => s.replace(/\s/g, " ");
  it("formats Canadian dollars the way each language writes them", () => {
    expect(money(124.1666)).toBe("$124.17");
    expect(whole(3490)).toBe("$3,490");
    expect(plain(whole(1490, "fr-CA"))).toBe("1 490 $");
    expect(plain(money(290.83, "fr-CA"))).toBe("290,83 $");
  });
});

describe("language switcher", () => {
  beforeEach(() => {
    document.cookie = `${LANG_COOKIE}=; max-age=0; path=/`;
    window.localStorage.clear();
    vi.mocked(useRouter().refresh).mockClear();
  });
  const open = () => fireEvent.click(screen.getByRole("button", { expanded: false }));

  it("shows the current language as a short label and opens a list of all five, each in its own language", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("EN");
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
    open();
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["EnglishEN", "FrançaisFR", "EspañolES", "РусскийRU", "中文中文"]);
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent("English");
    expect(screen.getByRole("option", { name: /^Français/ })).toHaveAttribute("lang", "fr");
  });
  it("applies a choice at once: cookie, backup in localStorage, a global event, and a refresh", () => {
    const heard = vi.fn();
    window.addEventListener(LANG_EVENT, heard as EventListener);
    render(<LanguageSwitcher />);
    open();
    fireEvent.click(screen.getByRole("option", { name: /^Español/ }));
    expect(document.cookie).toContain(`${LANG_COOKIE}=es`);
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("es");
    expect(heard).toHaveBeenCalledTimes(1);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toBe("es");
    expect(useRouter().refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("listbox")).toBeNull();
    window.removeEventListener(LANG_EVENT, heard as EventListener);
  });
  it("does nothing when the current language is chosen again", () => {
    render(<LanguageSwitcher />);
    open();
    fireEvent.click(screen.getByRole("option", { name: /^English/ }));
    expect(useRouter().refresh).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain(LANG_COOKIE + "=en");
  });
  it("closes on Escape and on a click outside", () => {
    render(<><LanguageSwitcher /><p>elsewhere</p></>);
    open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    open();
    fireEvent.mouseDown(screen.getByText("elsewhere"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("restores a saved language from localStorage when the cookie is missing", () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, "ru");
    render(<LanguageSwitcher />);
    expect(document.cookie).toContain(`${LANG_COOKIE}=ru`);
    expect(useRouter().refresh).toHaveBeenCalledTimes(1);
  });
  it("keeps the cookie for a year on every path", () => {
    const spy = vi.spyOn(document, "cookie", "set");
    act(() => saveLanguage("zh"));
    expect(spy.mock.calls[0][0]).toMatch(/clinx_lang=zh; max-age=31536000; path=\/; samesite=lax/);
    spy.mockRestore();
  });
});

describe("a page in another language", () => {
  it("renders the hero in French and in Chinese from the provider", () => {
    const { unmount } = render(<LangProvider lang="fr" landing={landingFor("fr")}><Hero /></LangProvider>);
    expect(screen.getByRole("link", { name: /commencer/i })).toHaveAttribute("href", "/start");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Une voie plus claire pour");
    unmount();
    render(<LangProvider lang="zh" landing={landingFor("zh")}><Hero /></LangProvider>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("诊所增长。");
  });
});
