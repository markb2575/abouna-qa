import churchesData from "@/data/churches.json";

export type ChurchEntry = {
  country: string;
  state: string;
  church: string;
};

const churches: ChurchEntry[] = churchesData;

export function getCountries(): string[] {
  return Array.from(new Set(churches.map((c) => c.country))).sort((a, b) => a.localeCompare(b));
}

export function getStates(country: string): string[] {
  return Array.from(
    new Set(churches.filter((c) => c.country === country).map((c) => c.state))
  ).sort((a, b) => a.localeCompare(b));
}

export function getChurches(country: string, state: string): string[] {
  return churches
    .filter((c) => c.country === country && c.state === state)
    .map((c) => c.church)
    .sort((a, b) => a.localeCompare(b));
}

export function isValidChurch(country: string, state: string, church: string): boolean {
  return churches.some((c) => c.country === country && c.state === state && c.church === church);
}
