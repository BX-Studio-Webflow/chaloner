export const CHALONER_API_PRODUCTION = "https://chaloner-loxo.vercel.app/api";
export const CHALONER_API_LOCAL = "http://localhost:3000/api";

/** Production unless `localStorage.setItem("script", "local")` (local dev API). */
export function getChalonerApiBaseUrl(): string {
  try {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem("script") === "local"
    ) {
      return CHALONER_API_LOCAL;
    }
  } catch {
    // private mode / storage unavailable
  }
  return CHALONER_API_PRODUCTION;
}
