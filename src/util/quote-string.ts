export function dropQuotes(stringWithQuote: string) {
  if (
    stringWithQuote.length >= 2 &&
    stringWithQuote.startsWith('"') &&
    stringWithQuote.endsWith('"')
  ) {
    return stringWithQuote.slice(1, -1);
  }
  return stringWithQuote;
}
