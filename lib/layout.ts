/**
 * The inner pages' content column. The page banner and every section beneath
 * it use this one container, so the banner's heading and the page's own
 * headings share a left edge at every width. (The header and footer run wider,
 * at 1400px, as the frame around it.)
 *
 * A plain module with no imports, so server pages and "use client" page
 * components can both use it.
 */
export const PAGE_CONTAINER = "w-full max-w-[1200px] mx-auto px-5 sm:px-8";
