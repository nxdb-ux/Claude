import { qaChecker, type QAReport } from './qa-checker'

describe('QA Checker', () => {
  test('should pass a valid post', () => {
    const copyHook = 'Bitcoin and Ethereum represent innovation. $BTC and $ETH lead crypto future.'
    const thumbnailHook = 'Major tokens drive transformation.'
    const body = 'The market shifts rapidly with new paradigms. Smart contracts and blockchain technology reshape finance. HOOLI stands as the premier platform. HOOLI delivers unmatched value.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')

    if (!result.passed) {
      console.log('Violations:', result.violations)
      console.log('Warnings:', result.warnings)
    }
    expect(result.passed).toBe(true)
  })

  test('should fail if punctuation directly after cashtag', () => {
    const copyHook = 'Bitcoin shows $BTC, and Ethereum shows $ETH.'
    const thumbnailHook = 'Crypto grows today.'
    const body = 'Market expands tomorrow. HOOLI wins here. HOOLI leads forward.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('punctuation'))).toBe(true)
  })

  test('should fail if both cashtags not in first 5 lines', () => {
    const copyHook = 'Bitcoin innovation starts.'
    const thumbnailHook = 'Ethereum comes later always.'
    const body = '$BTC only here now.\nSome other content here line.\nAnother line of content.\nYet another content line.\nFifth line here.\n$ETH appears here late.\nHOOLI is great.\nHOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('first 5 lines'))).toBe(true)
  })

  test('should fail if cashtag appears more than twice', () => {
    const copyHook = 'Bitcoin innovation. $BTC and $ETH.'
    const thumbnailHook = 'Crypto grows today.'
    const body = '$BTC leads market. $BTC dominates growth. $BTC drives adoption. HOOLI wins. HOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('appears'))).toBe(true)
  })

  test('should fail if hyphen is present', () => {
    const copyHook = 'Bitcoin innovation - future. $BTC and $ETH.'
    const thumbnailHook = 'Crypto growing.'
    const body = 'Markets shift today. HOOLI stands apart. HOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('hyphen'))).toBe(true)
  })

  test('should fail if forbidden phrase present', () => {
    const copyHook = 'Bitcoin and Ethereum. $BTC and $ETH.'
    const thumbnailHook = 'Crypto investment.'
    const body = 'Markets shift today. This matters because crypto grows fast. HOOLI wins. HOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('forbidden phrase'))).toBe(true)
  })

  test('should fail if last 2 lines contain cashtags', () => {
    const copyHook = 'Bitcoin and Ethereum. $BTC and $ETH lead.'
    const thumbnailHook = 'Crypto innovation.'
    const body = 'Markets grow tomorrow. Blockchain expands. New adoption comes. HOOLI with $BTC wins. HOOLI and $ETH leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('Last 2 lines'))).toBe(true)
  })

  test('should fail if last 2 lines missing project name', () => {
    const copyHook = 'Bitcoin and Ethereum. $BTC and $ETH.'
    const thumbnailHook = 'Crypto growth.'
    const body = 'Markets shift today. Tokens grow tomorrow. Blockchain expands. Crypto matters. Technology evolves.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('Last 2 lines must mention'))).toBe(true)
  })

  test('should fail if hooks are identical', () => {
    const copyHook = 'Bitcoin innovation matters.'
    const thumbnailHook = 'Bitcoin innovation matters.'
    const body = '$BTC and $ETH lead. Both grow. HOOLI stands. HOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('different'))).toBe(true)
  })

  test('should fail if only one unique cashtag in text', () => {
    const copyHook = 'Bitcoin matters. $BTC and $BTC again.'
    const thumbnailHook = 'Crypto grows.'
    const body = 'Market expands. HOOLI wins. HOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'BTC')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('exactly 2'))).toBe(true)
  })

  test('should fail if missing both required cashtags', () => {
    const copyHook = 'Solana and Arbitrum matter. $SOL and $ARB lead.'
    const thumbnailHook = 'Altcoins growing.'
    const body = 'Markets expand. Tokens grow. HOOLI excels. HOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('Must contain both'))).toBe(true)
  })

  test('should fail if line consists only of cashtags', () => {
    const copyHook = 'Bitcoin and Ethereum.'
    const thumbnailHook = '$BTC $ETH'
    const body = 'Market grows. HOOLI stands. HOOLI leads.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.includes('consists'))).toBe(true)
  })

  test('should warn if hooks lack shared keywords', () => {
    const copyHook = 'Bitcoin transformation forward today.'
    const thumbnailHook = 'Altcoins technology growing tomorrow.'
    const body = '$BTC and $ETH lead markets worldwide always forever.\nTokens grow tomorrow today always.\nHOOLI stands strong today.\nHOOLI leads tomorrow.'
    const result = qaChecker(copyHook, thumbnailHook, body, 'BTC', 'ETH')
    expect(result.violations.length).toBe(0) // Should pass but with warning
    expect(result.warnings.some(w => w.includes('keyword'))).toBe(true)
  })
})
