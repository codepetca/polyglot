// Internal (non-student-facing) curriculum: demo seeds, import tests. Marked by
// a "__" title prefix.
//
// DO NOT express this as a Prisma `startsWith: "__"` filter. Prisma compiles
// startsWith to SQL `LIKE '__%'`, and in LIKE an underscore is a
// SINGLE-CHARACTER WILDCARD — so '__%' matches every title with 2+ characters,
// and `NOT startsWith("__")` silently matches NOTHING. That bug shipped in
// three places (student sidebar, AI overseer curriculum, authoring picker)
// before it was caught. Filter in JS instead: chapter counts are tiny, and this
// has no wildcard semantics to get wrong.

export const INTERNAL_PREFIX = "__";

export const isInternalChapter = (title: string): boolean => title.startsWith(INTERNAL_PREFIX);

export function excludeInternal<T extends { title: string }>(chapters: T[]): T[] {
  return chapters.filter((c) => !isInternalChapter(c.title));
}
