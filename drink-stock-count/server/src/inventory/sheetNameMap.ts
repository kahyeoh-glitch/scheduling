// The "Drink Name" column in the Drink FIFO / Inventory sheet is a free-typed
// operations label, not the same string Papercut uses on order exports. This
// maps the sheet's names to the dashboard's canonical drink names.
export const SHEET_NAME_TO_DASHBOARD: Record<string, string> = {
  "FOUR SEASON OOLONG": "Four Seasons Oolong",
  "HONEY YUZU TEA": "Honey Yuzu Tea",
  "STRAIGHT GUAVA OJ": "Straight Guava OJ",
  "WATERMELIME CRUSH": "Watermelime Crush",
  "BLACK COLD BREW": "Black Cold Brew",
  "WHITE COLD BREW": "White Cold Brew",
  "TEH C": "Teh C",
  "BANDUNG GAO": "Bandung Gao",
  "ALPS WATER": "Alps Water",
  "PASSIONFRUIT ORANGE": "Passionfruit OJ",
  "PACKET FRUIT JUICES": "Packet Fruit Juices",
  "OATSIDE BARISTA BLEND 1L": "Oatside Barista 1L",
  "OATSIDE BARISTA BLEND": "Oatside Barista",
  "OATSIDE CHOCOLATE": "Oatside Chocolate",
  "OATSIDE COFFEE": "Oatside Coffee",
  "COCONUT WATER": "Coconut Water",
  "UHT MILK": "UHT Milk",
  "TETRA PACK 330ML": "Tetra Pack 330ml",
};

export function mapSheetDrinkName(raw: string): string | null {
  return SHEET_NAME_TO_DASHBOARD[raw.trim().toUpperCase()] ?? null;
}
