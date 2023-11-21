export const DELTA = 100 / 1000;
export const FRAME_CACHE_SIZE = 20;
export const CACHES_PER_PREVIEW_POINT = (numberOfMarbles: number) => {
  return Math.round(6 + numberOfMarbles * 4);
};
export const PREVIEW_FRAME_COUNT = (numberOfMarbles: number) => {
  if (numberOfMarbles < 4) return 100_000;
  if (numberOfMarbles < 8) return 90_000;
  return 75_000;
};

export const BOUNCY_BLOCK_FACTOR = 20;

export const COLORS = {
  background: "#252422",
  backgroundDark: "#121211",
  primary: "#fffcf2",
  highlight: "#ccc5b9",
  highlightLight: "#dad7d1",
  highlightDark: "#bab5ae",
  secondary: "#403d39",
  secondaryLight: "#4b4a48",
  secondaryDark: "#32312e",
  accent: "#ee6055",
  accentLight: "#f48a83",
  accentDark: "#cf5249",
  accentSecondary: "#5592ee",
  accentSecondaryLight: "#7faaeb",
  accentSecondaryDark: "#466fac",
};
