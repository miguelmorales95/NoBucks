import type { Cat, Listing } from "./types";

export const CATS: Record<Cat, { e: string; label: string; c: string; ci: string }> = {
  teach: { e: "📚", label: "Lessons", c: "#cfe3f5", ci: "#2f5f87" },
  food: { e: "🍞", label: "Food", c: "#fbe2c4", ci: "#9a6417" },
  care: { e: "🧸", label: "Care & kids", c: "#f6d7df", ci: "#9a3f58" },
  repair: { e: "🔧", label: "Fix-it", c: "#dfdcef", ci: "#51498a" },
  music: { e: "🎧", label: "Music", c: "#e7d6f0", ci: "#6c3f87" },
  art: { e: "🎨", label: "Art", c: "#fcdcd0", ci: "#9a4a30" },
  wellbeing: { e: "🌿", label: "Wellbeing", c: "#cfe9df", ci: "#2f7a6a" },
  garden: { e: "🌱", label: "Garden", c: "#dde7c4", ci: "#5a7322" },
  tech: { e: "💻", label: "Tech help", c: "#d2e4ec", ci: "#2f6473" },
};

export const CAT_KEYS = Object.keys(CATS) as Cat[];

// ---- character palettes ----
export const SPECIES = [
  { k: "person", e: "🧑" }, { k: "cat", e: "🐱" }, { k: "dog", e: "🐶" },
  { k: "bear", e: "🐻" }, { k: "rabbit", e: "🐰" }, { k: "fox", e: "🦊" },
  { k: "frog", e: "🐸" }, { k: "bird", e: "🐤" },
];
export const SKINS = ["#f6d7b0", "#f2c79a", "#e5ac7d", "#cf9262", "#a9704a", "#875233"];
export const FURS = ["#e8c99a", "#c9956a", "#8a6240", "#6b4a33", "#d9d2c6", "#f5efe6", "#e8923e", "#cf6a45", "#9aa7ad", "#8fbf6a"];
export const HAIRCOLORS = ["#2d2018", "#6b4a2b", "#b9742e", "#d9b34a", "#9a9a9a", "#d94f4f", "#4a6fb0", "#8a4fb0"];
export const HAIRS = ["short", "long", "bun", "curly", "buzz"];
export const SHIRTS = ["#f08a63", "#2ca397", "#f0b23e", "#6fae4e", "#8a6fd0", "#d9608a", "#4a9fd0"];
export const ACCS = ["none", "glasses", "flower", "freckles"];

export const REPLIES = [
  "So glad you reached out! Yes, let's make it happen. 🌱",
  "Perfect timing — I was hoping someone would ask. When suits you?",
  "Love it. I'm pretty flexible this week, tell me a day.",
  "Yes! Let's sort the details here and lock it in.",
  "Happy to! Thanks for being a good neighbor. 😊",
];

export const DIST = { min: 0.5, max: 12, step: 0.5, default: 1.5 };

// Real LA neighborhoods, with adjacency used for the "Nearby" scope.
export const HOME_HOOD = "Echo Park";
export const NEIGHBORHOODS: Record<string, string[]> = {
  "Echo Park": ["Silver Lake", "Historic Filipinotown", "Elysian Valley", "Chinatown", "Downtown LA"],
  "Silver Lake": ["Echo Park", "Los Feliz", "Atwater Village", "Historic Filipinotown"],
  "Historic Filipinotown": ["Echo Park", "Silver Lake", "Downtown LA"],
  "Elysian Valley": ["Echo Park", "Atwater Village"],
  "Chinatown": ["Echo Park", "Downtown LA"],
  "Los Feliz": ["Silver Lake", "Atwater Village"],
  "Atwater Village": ["Silver Lake", "Elysian Valley", "Los Feliz"],
  "Downtown LA": ["Chinatown", "Historic Filipinotown"],
  "Highland Park": ["Atwater Village"],
  "Koreatown": ["Historic Filipinotown"],
};
/** The set of neighborhoods counted as "nearby" to a home neighborhood (itself + adjacent). */
export function nearbyHoods(home: string): string[] {
  return [home, ...(NEIGHBORHOODS[home] ?? [])];
}

// Numeric ids here are mapped to strings below, so demo ids match the server's string ids.
const RAW_ITEMS: any[] = [
  { id: 1, type: "offer", cat: "food", name: "Maya", dist: 0.4, mx: 20, my: 24, rating: 4.9, reviews: 37, title: "Fresh sourdough loaf + a jar of starter", blurb: "Baked this morning. I'll hand over a live starter and teach you to keep it bubbling so you never buy bread again.", review: "The starter is thriving and so am I. Maya even texts to check on it.", revBy: "Theo", cost: 3, unit: "loaf" },
  { id: 2, type: "offer", cat: "teach", name: "Dev", dist: 0.8, mx: 73, my: 19, rating: 4.8, reviews: 21, title: "Beginner guitar lessons", blurb: "We'll get you playing your first three chords and an easy song by the end. Borrow one of mine to start.", review: "Patient and fun — I played a whole song by the second week.", revBy: "Priya", cost: 4, unit: "hour" },
  { id: 3, type: "offer", cat: "repair", name: "Theo", dist: 0.3, mx: 30, my: 63, rating: 5.0, reviews: 48, title: "Bike tune-up & flat repair", blurb: "Brakes, gears, chains, flats. I'll bring the tools to your porch and show you the easy stuff yourself.", review: "Fixed my squeaky brakes in ten minutes and refused extra sprouts. A legend.", revBy: "Grace", cost: 3, unit: "bike" },
  { id: 4, type: "offer", cat: "wellbeing", name: "Priya", dist: 0.6, mx: 82, my: 54, rating: 4.9, reviews: 19, title: "A listening ear over tea", blurb: "Sometimes you just need to be heard. No advice unless you ask for it, no judgment. Tea and a quiet hour.", review: "I left feeling lighter than I had in weeks. Thank you, Priya.", revBy: "Sam", cost: 1, unit: "hour" },
  { id: 5, type: "offer", cat: "music", name: "Sam", dist: 1.4, mx: 15, my: 73, rating: 4.7, reviews: 12, title: "DJ your backyard party", blurb: "Two-hour set, I bring the speakers and lights. Tell me the vibe and I'll build the playlist.", review: "The block party was unreal. Everyone danced, even my dad.", revBy: "Ivy", cost: 6, unit: "set" },
  { id: 6, type: "offer", cat: "art", name: "Lena", dist: 0.9, mx: 86, my: 31, rating: 5.0, reviews: 15, title: "Watercolor portrait of your pet", blurb: "Send me a good photo of your buddy and I'll paint a little A5 portrait. You keep the original.", review: "She captured my cat's grumpy soul perfectly. Framed it immediately.", revBy: "Jun", cost: 5, unit: "piece" },
  { id: 7, type: "offer", cat: "care", name: "Omar", dist: 0.5, mx: 62, my: 71, rating: 4.9, reviews: 33, title: "After-school care & homework help", blurb: "Weekdays 3–6pm. Homework, a snack, and backyard games. References from three families on the block.", review: "My kids ask when Omar is coming back. Reliable and kind.", revBy: "Dana", cost: 3, unit: "hour" },
  { id: 8, type: "offer", cat: "garden", name: "Grace", dist: 0.7, mx: 26, my: 44, rating: 4.8, reviews: 27, title: "Help starting a veggie bed", blurb: "I'll bring seedlings and compost and get your first raised bed planted. We can plan any time.", review: "We have actual tomatoes now. I had never grown anything alive.", revBy: "Beck", cost: 3, unit: "visit" },
  { id: 9, type: "offer", cat: "tech", name: "Jun", dist: 1.0, mx: 79, my: 79, rating: 4.9, reviews: 22, title: "Phone & laptop help", blurb: "Backups, updates, 'why is it slow', new-device setup, scam-proofing for grandparents. Plain-English.", review: "Saved my mom from a phishing text and set up her backups. Priceless.", revBy: "Maya", cost: 2, unit: "hour" },
  { id: 10, type: "offer", cat: "food", name: "Pilar", dist: 0.6, mx: 49, my: 14, rating: 4.8, reviews: 9, title: "Weeknight meal prep", blurb: "Two big trays of something hearty to freeze and reheat. Tell me allergies; containers returned next week.", review: "Three dinners sorted and the lasagna beat any restaurant.", revBy: "Omar", cost: 4, unit: "batch" },
  { id: 11, type: "offer", cat: "repair", name: "Hana", dist: 1.1, mx: 88, my: 67, rating: 5.0, reviews: 14, title: "Clothing mending & alterations", blurb: "Hems, zippers, patches, taking things in. Bring a pile and I'll have it back in a few days.", review: "Rescued my favorite jacket I was about to toss. Invisible stitching.", revBy: "Lena", cost: 2, unit: "garment" },
  { id: 17, type: "offer", cat: "repair", name: "Marco", dist: 4.2, mx: 94, my: 91, rating: 4.9, reviews: 31, title: "Car diagnostics & brake work", blurb: "Worth the trip across town. I read check-engine lights, do brakes and oil, the stuff shops overcharge for. Trade me tutoring for my kids!", review: "Saved me $400 on brakes. We trade his car know-how for math help now.", revBy: "Beck", cost: 5, unit: "job" },
  { id: 18, type: "offer", cat: "teach", name: "Tessa", dist: 2.8, mx: 7, my: 90, rating: 4.9, reviews: 18, title: "SAT & high-school math tutoring", blurb: "Algebra through calculus, plus SAT strategy. A bit of a walk, but I'll meet at the library halfway.", review: "My daughter's score jumped 120 points. Magic with anxious kids.", revBy: "Omar", cost: 4, unit: "hour" },
  { id: 12, type: "request", cat: "care", name: "Nico", dist: 0.4, mx: 40, my: 81, rating: 4.8, reviews: 16, title: "Need a hand moving a couch Saturday", blurb: "Quick 20-minute job, two flights of stairs. Pizza and cold drinks for whoever lends an arm.", cost: 2, unit: "job" },
  { id: 13, type: "request", cat: "food", name: "Ivy", dist: 0.8, mx: 60, my: 37, rating: 4.9, reviews: 11, title: "Have lemons 🍋 → want homemade jam", blurb: "My tree is overflowing. Take as many as you want; I'd love a few jars of jam or marmalade in return.", cost: "barter", unit: "" },
  { id: 14, type: "request", cat: "tech", name: "Beck", dist: 0.6, mx: 47, my: 60, rating: 4.7, reviews: 8, title: "Help building a simple one-page website", blurb: "For our block's little free pantry: hours, a map, a donation list. I can teach sourdough or babysit in trade.", cost: 3, unit: "project" },
  { id: 15, type: "pact", cat: "garden", name: "Grace & Nina", dist: 0.5, mx: 35, my: 31, rating: 4.9, reviews: 14, title: "Plant-watering ↔ dog-walking", blurb: "A standing weekly swap: Nina waters Grace's garden when she travels, Grace walks Biscuit on Nina's long shifts. Open to a third for weekends.", review: "These two have kept my street's gardens and dogs happy for a year.", revBy: "Maya", cost: "pact", unit: "" },
  { id: 16, type: "pact", cat: "teach", name: "Luz", dist: 0.9, mx: 70, my: 47, rating: 5.0, reviews: 20, title: "Spanish ↔ English practice circle", blurb: "Tuesdays & Thursdays, 7pm at the Echo Park library. Half Spanish, half English, all patient. Room for one or two more.", review: "My Spanish went from zero to ordering tacos confidently. Warm group.", revBy: "Dev", cost: "pact", unit: "" },
];

const HOOD_BY_ID: Record<string, string> = {
  "1": "Echo Park", "2": "Silver Lake", "3": "Echo Park", "4": "Historic Filipinotown", "5": "Silver Lake",
  "6": "Echo Park", "7": "Echo Park", "8": "Elysian Valley", "9": "Chinatown", "10": "Echo Park", "11": "Silver Lake",
  "17": "Highland Park", "18": "Koreatown", "12": "Echo Park", "13": "Historic Filipinotown", "14": "Echo Park",
  "15": "Elysian Valley", "16": "Chinatown",
};

export const SEED_ITEMS: Listing[] = RAW_ITEMS.map((r) => ({
  ...r, id: String(r.id), neighborhood: HOOD_BY_ID[String(r.id)] ?? HOME_HOOD,
})) as Listing[];
