/**
 * GitHub's own linguist colors for the languages that actually show up in
 * Pull's Bitcoin/Lightning repository catalog — the same hex values GitHub
 * itself uses in a repo's language bar, so the color is already a familiar
 * convention to any developer rather than an arbitrary decoration. Falls
 * back to a neutral gray for anything not in this (deliberately short) list.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Solidity: "#AA6746",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Dart: "#00B4AB",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Nix: "#7e7eff",
  Zig: "#ec915c",
};

const FALLBACK_COLOR = "#8b8b8b";

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? FALLBACK_COLOR;
}
