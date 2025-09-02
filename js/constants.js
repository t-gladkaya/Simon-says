const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const easyLevel = range(0, 9).map(String); 
export const mediumLevel = range(65, 90).map((c) => String.fromCharCode(c));
export const hardLevel = [...easyLevel, ...mediumLevel];

export const HIGHLIGHT_TIME = 700; 
export const ALLOWED_ERRORS_PER_ROUND = 1;

export function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export function levelToLabel(level) {
  switch (level) {
    case "easyLevel":
      return "Easy";
    case "mediumLevel":
      return "Medium";
    case "hardLevel":
      return "Hard";
    default:
      return "Easy";
  }
}

export function getSymbolsByLevel(level) {
  switch (level) {
    case "easyLevel":
      return easyLevel;
    case "mediumLevel":
      return mediumLevel;
    case "hardLevel":
      return hardLevel;
    default:
      return easyLevel;
  }
}