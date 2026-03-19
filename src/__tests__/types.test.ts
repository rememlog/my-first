import { describe, it, expect } from 'vitest'
import { MEET_CODES, MEET_NAMES } from '../api/types'

// ──────────────────────────────────────────────
// 테스트 케이스 7: 타입 및 상수 검증
// ──────────────────────────────────────────────

describe('TC7: MEET_CODES / MEET_NAMES 상수 일관성', () => {
  it('MEET_CODES의 모든 값에 대응하는 MEET_NAMES가 존재한다', () => {
    const codes = Object.values(MEET_CODES)
    expect(codes).toEqual(['1', '2', '3'])

    for (const code of codes) {
      expect(MEET_NAMES[code]).toBeDefined()
      expect(typeof MEET_NAMES[code]).toBe('string')
    }
  })

  it('경마장 이름이 올바르다', () => {
    expect(MEET_NAMES[MEET_CODES.SEOUL]).toBe('서울')
    expect(MEET_NAMES[MEET_CODES.JEJU]).toBe('제주')
    expect(MEET_NAMES[MEET_CODES.BUSAN]).toBe('부산경남')
  })
})
