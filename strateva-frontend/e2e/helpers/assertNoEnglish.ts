import { expect, type Page } from '@playwright/test'

/**
 * Scans visible DOM text for English tokens.
 * Ignores attributes (data-testid, aria-*, class, role, href), DEV_EN debug
 * markers, and inline <code>/<pre> content (raw identifiers/tokens).
 *
 * Fails with a breadcrumb listing each offending token + nearest element text,
 * so test output points straight at the source of a leak.
 */
export async function assertNoEnglish(page: Page, opts?: { allow?: RegExp[] }) {
  const allow = opts?.allow ?? []
  const leaks = await page.evaluate((allowSources: string[]) => {
    const allowRe = allowSources.map((s) => new RegExp(s))
    const skipTag = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'])
    const englishWord = /\b[A-Za-z]{2,}\b/g
    const problems: Array<{ token: string; snippet: string; path: string }> = []

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node: Node | null = walker.nextNode()
    while (node) {
      const parent = (node as Text).parentElement
      if (parent && !skipTag.has(parent.tagName) && !parent.closest('[data-allow-en]')) {
        const text = (node.nodeValue ?? '').trim()
        if (text.length > 0) {
          const matches = text.match(englishWord) ?? []
          for (const m of matches) {
            if (allowRe.some((re) => re.test(m))) continue
            const path = buildPath(parent)
            problems.push({ token: m, snippet: text.slice(0, 120), path })
          }
        }
      }
      node = walker.nextNode()
    }
    return problems

    function buildPath(el: Element): string {
      const parts: string[] = []
      let cur: Element | null = el
      while (cur && cur !== document.body && parts.length < 5) {
        const id = cur.id ? `#${cur.id}` : ''
        const testId = cur.getAttribute('data-testid')
        const suffix = testId ? `[data-testid="${testId}"]` : ''
        parts.unshift(`${cur.tagName.toLowerCase()}${id}${suffix}`)
        cur = cur.parentElement
      }
      return parts.join(' > ')
    }
  }, allow.map((r) => r.source))

  if (leaks.length > 0) {
    const msg = leaks
      .slice(0, 20)
      .map((l) => `  - "${l.token}" in ${l.path} :: "${l.snippet}"`)
      .join('\n')
    throw new Error(
      `assertNoEnglish: ${leaks.length} English token(s) found in DOM:\n${msg}`,
    )
  }
  expect(leaks.length).toBe(0)
}
