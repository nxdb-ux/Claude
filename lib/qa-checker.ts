export interface QAReport {
  passed: boolean
  violations: string[]
  warnings: string[]
}

const FORBIDDEN_PHRASES = [
  'this matters because',
  'now x comes into play',
  'now . comes into play',
]

export function qaChecker(
  copyHook: string,
  thumbnailHook: string,
  bodyText: string,
  cashtagA: string,
  cashtagB: string,
  lastLinesCashtagFocusProject: string = 'HOOLI'
): QAReport {
  const violations: string[] = []
  const warnings: string[] = []
  const fullText = `${copyHook}\n${thumbnailHook}\n${bodyText}`

  // Extract lines
  const lines = fullText.split('\n').filter(line => line.trim().length > 0)

  // Normalize cashtags (ensure they start with $)
  const targetA = cashtagA.startsWith('$') ? cashtagA : `$${cashtagA}`
  const targetB = cashtagB.startsWith('$') ? cashtagB : `$${cashtagB}`

  // Find all cashtags in text
  const cashtagPattern = /\$[A-Za-z0-9]+/g
  const allCashtagsInText = fullText.match(cashtagPattern) || []
  const uniqueCashtagsInText = new Set(allCashtagsInText)

  // Rule 1: Exactly 2 different external cashtags
  if (uniqueCashtagsInText.size !== 2) {
    violations.push(`Must contain exactly 2 different external cashtags. Found ${uniqueCashtagsInText.size}.`)
  } else {
    // Check if the right cashtags are there
    if (!uniqueCashtagsInText.has(targetA) || !uniqueCashtagsInText.has(targetB)) {
      violations.push(`Must contain both ${targetA} and ${targetB}.`)
    }
  }

  // Rule 2: First occurrence of both cashtags within first 5 lines
  const firstFiveLines = lines.slice(0, Math.min(5, lines.length)).join('\n')
  const tagsInFirstFive = firstFiveLines.match(cashtagPattern) || []
  const uniqueTagsInFirstFive = new Set(tagsInFirstFive)

  if (uniqueTagsInFirstFive.size < 2) {
    violations.push(`Both cashtags must appear within the first 5 lines. Found ${uniqueTagsInFirstFive.size} unique cashtags in first 5 lines.`)
  }

  // Rule 3: Each cashtag at most twice
  const cashtagCounts = new Map<string, number>()
  allCashtagsInText.forEach(tag => {
    cashtagCounts.set(tag, (cashtagCounts.get(tag) || 0) + 1)
  })

  cashtagCounts.forEach((count, tag) => {
    if (count > 2) {
      violations.push(`Cashtag ${tag} appears ${count} times. Maximum is 2.`)
    }
  })

  // Rule 4: Cashtags inside full sentences (heuristic: 6+ words, ends with punctuation)
  lines.forEach((line, idx) => {
    const cashtagsInLine = line.match(cashtagPattern) || []
    if (cashtagsInLine.length > 0) {
      const words = line.trim().split(/\s+/).filter(w => w.length > 0)
      if (words.length < 6) {
        warnings.push(`Line ${idx + 1} has cashtag but fewer than 6 words: "${line.trim()}"`)
      }
    }
  })

  // Rule 5: No stacked cashtags vertically
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const tagsInLine = trimmed.match(cashtagPattern) || []
    const wordsInLine = trimmed.split(/\s+/).filter(w => w.length > 0 && !w.match(cashtagPattern))
    if (tagsInLine.length > 0 && wordsInLine.length === 0) {
      violations.push(`Line ${idx + 1} consists only of cashtags: "${trimmed}"`)
    }
    if (tagsInLine.length > 1 && wordsInLine.length === 0) {
      violations.push(`Line ${idx + 1} consists mostly of cashtags: "${trimmed}"`)
    }
  })

  // Rule 6: No punctuation directly after cashtag
  const badPunctuation = /\$[A-Za-z0-9]+[,.!?]/g
  const badMatches = fullText.match(badPunctuation) || []
  if (badMatches.length > 0) {
    violations.push(`Found punctuation directly after cashtag: ${badMatches.join(', ')}`)
  }

  // Rule 7: No forbidden phrases
  FORBIDDEN_PHRASES.forEach(phrase => {
    if (fullText.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push(`Contains forbidden phrase: "${phrase}"`)
    }
  })

  // Check for "A not B" and "not X but Y" patterns (warning, not violation)
  const notPatterns = [
    /\b\w+(?:\s+\w+)?\s+not\s+\w+/gi,
    /\bnot\s+\w+(?:\s+\w+)?\s+but\s+/gi,
  ]
  notPatterns.forEach(pattern => {
    if (pattern.test(fullText)) {
      warnings.push(`Contains potential "A not B" framing. Please review for balance.`)
      pattern.lastIndex = 0 // Reset regex
    }
  })

  // Rule 8: No hyphens
  if (fullText.includes('-') || fullText.includes('—')) {
    violations.push(`Contains hyphen character. Hyphens are not allowed.`)
  }

  // Rule 9: Last 2 lines focus on project and no other cashtags
  const lastTwoLines = lines.slice(-2).join('\n')
  if (!lastTwoLines.includes(lastLinesCashtagFocusProject)) {
    violations.push(`Last 2 lines must mention ${lastLinesCashtagFocusProject}.`)
  }

  const lastTwoCashtags = lastTwoLines.match(cashtagPattern) || []
  if (lastTwoCashtags.length > 0) {
    violations.push(`Last 2 lines must not contain cashtags. Found: ${lastTwoCashtags.join(', ')}`)
  }

  // Rule 10: Must include copy hook and thumbnail hook that are different
  const hookSimilarity = copyHook.toLowerCase().trim() === thumbnailHook.toLowerCase().trim()
  if (hookSimilarity) {
    violations.push(`Copy hook and thumbnail hook must be different.`)
  }

  // Check if hooks share at least one keyword (length > 3)
  const copyWords = new Set(copyHook.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const thumbWords = new Set(thumbnailHook.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const sharedWords = Array.from(copyWords).filter(w => thumbWords.has(w))
  if (sharedWords.length === 0) {
    warnings.push(`Copy hook and thumbnail hook should share at least one keyword (3+ chars) for topic coherence.`)
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  }
}
