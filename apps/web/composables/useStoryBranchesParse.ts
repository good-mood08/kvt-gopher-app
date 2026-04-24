/**
 * Разбор поля `content` у map-story / story: объект из API, JSON-строка или JS-объектный литерал (как в админке).
 * Неполный текст, «умные» кавычки и лишние пробелы — частые причины падения `new Function`.
 */
export type StoryBranchesMap = Record<string, unknown>

export function parseStoryBranchesContent(raw: unknown): StoryBranchesMap {
  if (raw == null) return { main: [] }

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return normalizeShape(raw as StoryBranchesMap)
  }

  if (typeof raw !== 'string') return { main: [] }

  let s = raw.replace(/^\uFEFF/, '').trim()
  if (!s) return { main: [] }

  s = normalizeEditorQuotes(s)

  if (s.startsWith('{')) {
    try {
      const parsed = JSON.parse(s) as StoryBranchesMap
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeShape(parsed)
      }
    } catch {
      /* не JSON — пробуем как JS */
    }
  }

  try {
    const data = new Function(`return (${s})`)() as unknown
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return normalizeShape(data as StoryBranchesMap)
    }
  } catch (e) {
    console.warn('[parseStoryBranchesContent] не удалось разобрать content', e, {
      length: s.length,
      head: s.slice(0, 160),
      tail: s.slice(-80),
    })
  }

  return { main: [] }
}

function normalizeEditorQuotes(str: string) {
  return str
    .replace(/\u201c|\u201d|\u00ab|\u00bb/g, '"')
    .replace(/\u2018|\u2019/g, "'")
}

function normalizeShape(o: StoryBranchesMap): StoryBranchesMap {
  const main = o.main
  return {
    ...o,
    main: Array.isArray(main) ? main : [],
  }
}
