import { ALL_DRINKS } from "../data/drinks";

// Papercut's order-export "Name" column doesn't always match the dashboard's
// drink names 1:1 (product renames, add-on variants, etc). This is the
// explicit correction list from the spec.
const EXPLICIT_MAP: Record<string, string> = {
  "Still Water": "Alps Water",
  "Bottled Alps Water": "Alps Water",
  "Coconut Water Mini Packs": "Coconut Water",
  "Assorted Packet Juices": "Packet Fruit Juices",
  "Packet Fruit Juice": "Packet Fruit Juices",
  "1 Litre UHT Milk": "UHT Milk",
  "(Add-on) Barista Oat Milk Mini Pack, by Oatside (Vg)": "Oatside Barista",
  "(Add-on) Chocolate Oat Milk Mini Pack, by Oatside (Vg)": "Oatside Chocolate",
  "(Add-on) Coffee Oat Milk Mini Pack, by Oatside (Vg)": "Oatside Coffee",
  "Barista Oat Milk Mini Packs": "Oatside Barista",
  "Chocolate Oat Milk Mini Packs": "Oatside Chocolate",
  "Coffee Oat Milk Mini Packs": "Oatside Coffee",
  "Passionfruit Orange Infusion": "Passionfruit OJ",
  "(Add-on Bottled Drink) Passionfruit Orange Infusion (Vg)": "Passionfruit OJ",
  "Add-on Tetra Pak Water (330ML)": "Tetra Pack 330ml",
};

const EXPLICIT_MAP_LOWER = new Map(
  Object.entries(EXPLICIT_MAP).map(([raw, canonical]) => [raw.trim().toLowerCase(), canonical]),
);

const CANONICAL_LOWER = new Map(ALL_DRINKS.map((name) => [name.toLowerCase(), name]));

// Maps a raw Papercut CSV "Name" value to a dashboard drink name, or null if
// it isn't one of the drinks this dashboard tracks.
export function mapPapercutName(rawName: string): string | null {
  const trimmed = rawName.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  return EXPLICIT_MAP_LOWER.get(lower) ?? CANONICAL_LOWER.get(lower) ?? null;
}
