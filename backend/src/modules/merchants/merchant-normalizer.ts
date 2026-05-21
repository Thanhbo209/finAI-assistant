const KNOWN_ALIAS_NORMALIZATIONS: Readonly<Record<string, string>> = {
  mcd: "mcdonalds",
  mcdonald: "mcdonalds",
  "mc donalds": "mcdonalds",
  "mc donald": "mcdonalds",
  sbux: "starbucks",
  starbuck: "starbucks",
  grabpay: "grab",
  "grab pay": "grab",
};

export interface MerchantNameNormalization {
  raw: string;
  normalized: string;
  compact: string;
  canonicalCandidate: string;
}

export function normalizeMerchantName(raw: string): MerchantNameNormalization {
  const trimmed = raw.trim();
  const lower = trimmed
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const normalized = lower
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  const aliasNormalized = KNOWN_ALIAS_NORMALIZATIONS[normalized] ?? normalized;
  const compact = aliasNormalized.replace(/\s+/g, "");

  return {
    raw: trimmed,
    normalized: aliasNormalized,
    compact,
    canonicalCandidate: toCanonicalMerchantName(aliasNormalized),
  };
}

export function toCanonicalMerchantName(normalizedName: string): string {
  if (normalizedName === "mcdonalds") return "McDonald's";

  return normalizedName
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function scoreAliasMatch(
  input: MerchantNameNormalization,
  candidateNormalized: string,
): number {
  if (input.normalized === candidateNormalized) return 1;
  if (input.compact === candidateNormalized.replace(/\s+/g, "")) return 0.94;
  if (
    candidateNormalized.includes(input.normalized) ||
    input.normalized.includes(candidateNormalized)
  ) {
    return 0.82;
  }
  return 0;
}
