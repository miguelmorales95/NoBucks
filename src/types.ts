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
  photo?: string; // optional image: a data URL (uploaded) or asset URL
}

export interface Notif {
  id: string;
  icon: string;
  title: string;
  body: string;
  read: boolean;
}

export interface CharacterLook {
  species: number;   // index into SPECIES
  skin: number;      // index into SKINS (person) or FURS (animal)
  haircolor: number; // index into HAIRCOLORS (also used as animal markings)
  hair: number;      // index into HAIRS (person only)
  shirt: number;     // index into SHIRTS
  acc: number;       // index into ACCS
}

export interface Villager {
  name: string;
  cat: Cat;
  char: CharacterLook;
  kind: "app" | "off"; // on Clover, or a private off-app keepsake
  note: string;
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

export type Stage = "auth" | "verify" | "create" | "app";
export type Tab = "village" | "explore" | "post" | "pacts" | "chats";
export type ExView = "list" | "map";

export type Sheet =
  | { kind: "item"; id: string }
  | { kind: "confirm"; id: string }
  | { kind: "villager"; index: number }
  | { kind: "addVillager" }
  | { kind: "rating"; targetId: string; threadId: string }
  | { kind: "report"; id: string }
  | { kind: "notifications" }
  | null;
