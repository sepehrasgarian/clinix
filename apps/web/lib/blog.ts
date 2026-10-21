export type BlogArt = "report" | "reviews" | "audit" | "geo" | "competitors" | "website" | "locations";

export type BlogPost = { slug: string; category: string; date: string; minutes: number; title: string; excerpt: string; art: BlogArt };

/** Newest first. The first post is shown as the featured one. */
export const blogPosts: readonly BlogPost[] = [
  { slug: "from-data-to-decisions-monthly-market-report", category: "Clinx services", date: "2026-10-25", minutes: 9, art: "report", title: "From data to decisions: what a monthly market report should tell your clinic", excerpt: "Most clinic reports are full of numbers and short on decisions. Here is what a useful monthly market report contains — and how Clinx’s plans deliver it at every stage of growth." },
  { slug: "the-review-gap", category: "Reputation", date: "2026-10-24", minutes: 8, art: "reviews", title: "The review gap: why reviews decide which clinic patients choose", excerpt: "Reviews shape local visibility and patient trust at the same time. Here is how to understand your review gap and close it ethically, within the rules of your profession." },
  { slug: "see-your-clinic-like-a-new-patient", category: "Practice growth", date: "2026-10-23", minutes: 9, art: "audit", title: "See your clinic the way a new patient does: a practical self-audit", excerpt: "You know your clinic from the inside. New patients only see it from the outside. This step-by-step audit shows you what they see — and what to fix first." },
  { slug: "geo-for-clinics", category: "GEO", date: "2026-10-21", minutes: 10, art: "geo", title: "GEO for clinics: how to be recommended when patients ask an answer engine", excerpt: "Patients increasingly ask conversational search tools which clinic to choose. Generative Engine Optimization (GEO) is how you make sure your clinic is part of the answer." },
  { slug: "who-are-your-real-competitors", category: "Competitive intelligence", date: "2026-10-20", minutes: 9, art: "competitors", title: "Who are your real competitors? Why local competitor mapping matters for clinics", excerpt: "The clinics you think you compete with are rarely the ones winning your patients. Here is how to identify your real local competitors and what to learn from them." },
  { slug: "from-search-to-booked-appointment", category: "Website", date: "2026-10-19", minutes: 7, art: "website", title: "From search to booked appointment: fixing the path patients actually take", excerpt: "Traffic only matters if visitors book. Walk through your clinic website the way a new patient does and fix the points where they give up." },
  { slug: "comparing-multiple-locations", category: "Multi-location", date: "2026-10-18", minutes: 7, art: "locations", title: "Running more than one location: how to compare your clinics fairly", excerpt: "Two locations of the same clinic can sit in very different markets. Here is how to compare them without being misled, and where to spend your effort first." },
];

export const findPost = (slug: string) => blogPosts.find((p) => p.slug === slug);

export const formatPostDate = (iso: string, locale = "en-CA") => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
