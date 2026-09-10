// Table 1 — managed stock: has a minimum threshold, so the dashboard can
// flag it as needing a reorder.
export const MANAGED_MINIMUMS: Record<string, number> = {
  "Black Cold Brew": 240,
  "Alps Water": 720,
  "White Cold Brew": 240,
  "Straight Guava OJ": 400,
  "Watermelime Crush": 400,
  "Four Seasons Oolong": 400,
  "Honey Yuzu Tea": 400,
  "Passionfruit OJ": 400,
};

export const MANAGED_DRINKS = Object.keys(MANAGED_MINIMUMS);

// Table 2 — tracked stock: monitored, no reorder threshold.
export const TRACKED_DRINKS = [
  "Coconut Water",
  "Packet Fruit Juices",
  "Oatside Barista 1L",
  "Oatside Barista",
  "Oatside Chocolate",
  "Oatside Coffee",
  "UHT Milk",
  "Tetra Pack 330ml",
];

// Table 3 — being discontinued, sell through remaining stock only.
export const DISCONTINUING_DRINKS = ["Teh C", "Bandung Gao"];

export const ALL_DRINKS = [...MANAGED_DRINKS, ...TRACKED_DRINKS, ...DISCONTINUING_DRINKS];
