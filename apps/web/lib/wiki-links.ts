const PROJECT_SUFFIX_TO_DOMAIN: Array<[suffix: string, domain: string]> = [
  ["wiktionary", "wiktionary.org"],
  ["wikibooks", "wikibooks.org"],
  ["wikinews", "wikinews.org"],
  ["wikiquote", "wikiquote.org"],
  ["wikisource", "wikisource.org"],
  ["wikiversity", "wikiversity.org"],
  ["wikivoyage", "wikivoyage.org"],
  ["wikimedia", "wikimedia.org"],
  ["wiki", "wikipedia.org"],
];

const SPECIAL_WIKIS: Record<string, string> = {
  commonswiki: "https://commons.wikimedia.org/wiki/",
  foundationwiki: "https://foundation.wikimedia.org/wiki/",
  incubatorwiki: "https://incubator.wikimedia.org/wiki/",
  mediawikiwiki: "https://www.mediawiki.org/wiki/",
  metawiki: "https://meta.wikimedia.org/wiki/",
  specieswiki: "https://species.wikimedia.org/wiki/",
  wikidatawiki: "https://www.wikidata.org/wiki/",
};

export function buildWikiPageUrl(wiki: string, pageTitle: string): string | null {
  const trimmedWiki = wiki.trim().toLowerCase();
  if (!trimmedWiki || !pageTitle.trim()) {
    return null;
  }

  const specialBase = SPECIAL_WIKIS[trimmedWiki];
  if (specialBase) {
    return `${specialBase}${encodeWikiTitle(pageTitle)}`;
  }

  for (const [suffix, domain] of PROJECT_SUFFIX_TO_DOMAIN) {
    if (trimmedWiki.endsWith(suffix) && trimmedWiki.length > suffix.length) {
      const languageCode = trimmedWiki.slice(0, -suffix.length);
      if (!languageCode) {
        continue;
      }
      return `https://${languageCode}.${domain}/wiki/${encodeWikiTitle(pageTitle)}`;
    }
  }

  return null;
}

function encodeWikiTitle(pageTitle: string): string {
  return encodeURIComponent(pageTitle.trim().replace(/ /g, "_"));
}
