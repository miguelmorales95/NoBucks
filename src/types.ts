export type Cat =
  | "teach" | "food" | "care" | "repair" | "music"
  | "art" | "wellbeing" | "garden" | "tech";

export type PostType = "offer" | "request" | "pact";

/** A listing's price: a number of sprouts, an open barter, or a no-sprout pact. */
export type Cost = number | "barter" | "pact";

export interface Listing {
  id: string;
  authorId?: string; // server user id of the author (API mode)
  type: PostType;
  cat: Cat;
  name: string;
  dist: number;         // miles
  mx?: number;          // map x position (percent)
  my?: number;          // map y position (percent)
  rating: number;
  reviews: number;
  title: string;
  blurb: string;
  review?: string;
  revBy?: string;
  cost: Cost;
  unit: string;
  neighborhood?: string; // the LA neighborhood this listing belongs to
  photo?: string; // optional image: a data URL (uploaded) or asset URL
  // pact-only: multi-person pacts
  members?: string[];
  open?: boolean; // accepting join requests
  locations?: { label: string; mx: number; my: number }[];
  willTravel?: boolean; // poster will come to you
  trust?: TrustLevel;   // author trust
}

export interface Notif {
  id: string;
  icon: string;
  title: string;
  body: string;
  read: boolean;
}

export interface Gratitude {
  id: string;
  fromName: string;
  toName: string;
  cat: Cat;
  text: string;
  when: string;
}

export interface EventItem {
  id: string;
  host: string;
  cat: Cat;
  neighborhood?: string;
  title: string;
  blurb: string;
  when: string;   // human text, e.g. "Sat 10am"
  place: string;
  capacity: number;
  going: number;
  rsvped: boolean;
  photo?: string;
}

export type TrustLevel = "green" | "yellow" | "red";

export interface CharacterLook {
  species: number;   // index into SPECIES
  skin: number;      // index into SKINS (person) or FURS (animal)
  haircolor: number; // index into HAIRCOLORS (also used as animal markings)
  hair: number;      // index into HAIRS (person only)
  shirt: number;     // index into SHIRTS
  acc: number;       // index into ACCS
  outfit: number;    // index into OUTFITS (clothing style)
  hat: number;       // index into HATS (0 = none)
}

export interface Villager {
  name: string;
  cat: Cat;
  char: CharacterLook;
  kind: "app" | "off"; // on Clover, or a private off-app keepsake
  note: string;
  trust?: TrustLevel;
}

export interface Msg {
  from: "me" | "them" | "sys";
  text: string;
}

export type ThreadRole = "client" | "provider" | "joiner";
export type ThreadStatus = "arranging" | "reserved" | "done";

export interface Thread {
  id: string;
  name: string;
  cat: Cat;
  itemId: string;
  role: ThreadRole;
  status: ThreadStatus;
  msgs: Msg[];
}
// note: itemId references a Listing id (string)

export interface Activity {
  ic: string;
  cat: Cat;
  t: string;
  s: string;
  amt: number;
}

export interface AdminReport {
  id: string;
  reporterName: string;
  targetName: string;
  reason: string;
  details?: string;
  status: string;
}

export interface AdminOverview {
  neighborhood?: string;
  members: number;
  listings: number;
  events: number;
  openReports: number;
  pot: number;
}

export interface Goal { id: string; label: string; icon: string; target: number; progress: number; }
export interface Circle { id: string; name: string; emoji: string; members: string[]; }
export type CardTheme = "stadium" | "cafe" | "arcade" | "beach" | "garden" | "cosmic";
export interface VillageCard { id: string; name: string; char: CharacterLook; villageName: string; villagers: number; neighborhood?: string; flavor: string; theme?: CardTheme; }
export interface Sticker { id: string; emoji: string; from: string; }
export interface Weather {
  season: "spring" | "summer" | "fall" | "winter";
  condition: "clear" | "clouds" | "rain" | "snow";
  label: string;
}
export type VillageView = "home" | "visit" | "peek" | "stickers" | "cards" | "circles";

export type Stage = "auth" | "verify" | "create" | "app";
export type Tab = "village" | "explore" | "post" | "pacts" | "chats";
export type ExView = "list" | "map" | "thanks";

export type Sheet =
  | { kind: "item"; id: string }
  | { kind: "confirm"; id: string }
  | { kind: "villager"; index: number }
  | { kind: "addVillager" }
  | { kind: "rating"; targetId: string; threadId: string }
  | { kind: "report"; id: string }
  | { kind: "notifications" }
  | { kind: "gift" }
  | { kind: "event"; id: string }
  | { kind: "createEvent" }
  | { kind: "sticker"; toName: string }
  | { kind: "circle" }
  | { kind: "wardrobe" }
  | null;
