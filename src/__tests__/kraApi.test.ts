import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRaceDetailResults, getRcRaceResults } from '../api/kraApi'

// ──────────────────────────────────────────────
// 테스트 케이스 1~4: API 서비스 레이어
// ──────────────────────────────────────────────

function mockFetchSuccess<T>(items: T[], totalCount = 1) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        response: {
          header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
          body: {
            items: { item: items },
            totalCount,
            numOfRows: 100,
            pageNo: 1,
          },
        },
      }),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('TC1: getRaceDetailResults - 정상 응답 파싱', () => {
  it('배열 응답을 올바르게 반환한다', async () => {
    const mockData = [
      { meet: '1', rcDate: '20250301', rcNo: '1', hrName: '번개호', ord: '1' },
      { meet: '1', rcDate: '20250301', rcNo: '1', hrName: '태풍호', ord: '2' },
    ]
    globalThis.fetch = mockFetchSuccess(mockData, 2)

    const results = await getRaceDetailResults({ meet: '1', rcDate: '20250301' })

    expect(results).toHaveLength(2)
    expect(results[0].hrName).toBe('번개호')
    expect(results[1].ord).toBe('2')
  })
})

describe('TC2: getRaceDetailResults - 요청 URL 파라미터 구성', () => {
  it('meet, rc_date, rc_no 파라미터가 올바르게 전달된다', async () => {
    globalThis.fetch = mockFetchSuccess([])

    await getRaceDetailResults({ meet: '3', rcDate: '20250315', rcNo: '5' })

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/kra/')
    expect(calledUrl).toContain('meet=3')
    expect(calledUrl).toContain('rc_date=20250315')
    expect(calledUrl).toContain('rc_no=5')
  })
})

describe('TC3: API 오류 응답 처리', () => {
  it('resultCode가 00이 아니면 에러를 throw 한다', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          response: {
            header: { resultCode: '99', resultMsg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' },
            body: { items: { item: [] }, totalCount: 0, numOfRows: 0, pageNo: 0 },
          },
        }),
    })

    await expect(getRaceDetailResults({ meet: '1', rcDate: '20250301' }))
      .rejects.toThrow('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')
  })
})

describe('TC4: HTTP 오류 응답 처리', () => {
  it('HTTP 500 응답 시 에러를 throw 한다', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(getRaceDetailResults({ meet: '1', rcDate: '20250301' }))
      .rejects.toThrow('API 요청 실패: 500')
  })
})

describe('TC5: getRcRaceResults - 날짜 범위 파라미터', () => {
  it('rc_date_fr, rc_date_to가 올바르게 전달된다', async () => {
    globalThis.fetch = mockFetchSuccess([])

    await getRcRaceResults({
      meet: '1',
      rcDateFrom: '20250101',
      rcDateTo: '20250331',
    })

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('rc_date_fr=20250101')
    expect(calledUrl).toContain('rc_date_to=20250331')
  })
})

describe('TC6: 빈 응답 / 단일 아이템 응답 처리', () => {
  it('items가 null/undefined이면 빈 배열을 반환한다', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          response: {
            header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
            body: {
              items: { item: undefined },
              totalCount: 0,
              numOfRows: 100,
              pageNo: 1,
            },
          },
        }),
    })

    const results = await getRaceDetailResults({ meet: '1', rcDate: '20250301' })
    expect(results).toEqual([])
  })

  it('단일 객체 응답도 배열로 감싸서 반환한다', async () => {
    const singleItem = { meet: '1', rcDate: '20250301', rcNo: '1', hrName: '번개호', ord: '1' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          response: {
            header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
            body: {
              items: { item: singleItem },
              totalCount: 1,
              numOfRows: 100,
              pageNo: 1,
            },
          },
        }),
    })

    const results = await getRaceDetailResults({ meet: '1', rcDate: '20250301' })
    expect(results).toHaveLength(1)
    expect(results[0].hrName).toBe('번개호')
  })
})
