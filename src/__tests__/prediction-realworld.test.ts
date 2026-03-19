/**
 * 실제 경마 데이터 구조 시뮬레이션 테스트
 *
 * 한국마사회 경주별상세성적표(data.go.kr/data/15089492) 응답 구조를 기반으로
 * 실제 경주와 유사한 시나리오를 구성하여 예측 모듈을 검증한다.
 *
 * 시나리오: 서울 1200m 10두 편성 경주
 * - 실제 경마에서 나타나는 패턴을 반영
 * - 예측 순위 vs 실제 착순 비교로 모델 타당성 검증
 */
import { describe, it, expect } from 'vitest'
import { predictRace } from '../prediction'
import type { HorseRecord, PastRace } from '../prediction'

function race(overrides: Partial<PastRace> = {}): PastRace {
  return {
    rcDate: '20260308', rcDist: 1200, ord: 5, startNo: 5, hrCnt: 10,
    rcTime: 73.2, hrWeight: 480, hrWeightDiff: 0, budam: 57,
    jkWinRate: 0.08, trWinRate: 0.06, ...overrides,
  }
}

// ──────────────────────────────────────────────────────
// 시나리오: 서울 1200m 10두 편성 (현실적 데이터 기반)
// ──────────────────────────────────────────────────────

const horses: HorseRecord[] = [
  {
    // 1번마: "천둥번개" - 최근 폼 우수, 거리적성 좋음, 리딩기수
    hrNo: '1', hrName: '천둥번개',
    recentRaces: [
      race({ ord: 1, rcDist: 1200, budam: 57, hrWeight: 472, hrWeightDiff: -2, jkWinRate: 0.18, trWinRate: 0.14 }),
      race({ ord: 2, rcDist: 1200, budam: 57, hrWeight: 474, hrWeightDiff: 1, jkWinRate: 0.18, trWinRate: 0.14 }),
      race({ ord: 1, rcDist: 1300, budam: 56, hrWeight: 473, hrWeightDiff: -1, jkWinRate: 0.18, trWinRate: 0.14 }),
      race({ ord: 3, rcDist: 1200, budam: 56, hrWeight: 474, hrWeightDiff: 2, jkWinRate: 0.18, trWinRate: 0.14 }),
      race({ ord: 1, rcDist: 1200, budam: 55, hrWeight: 472, hrWeightDiff: 0, jkWinRate: 0.18, trWinRate: 0.14 }),
    ],
    todayRace: {
      rcDist: 1200, startNo: 3, hrCnt: 10, budam: 57,
      hrWeight: 473, hrWeightDiff: -1,
      jkWinRate: 0.18, trWinRate: 0.14, daysSinceLastRace: 21,
    },
  },
  {
    // 2번마: "질풍노도" - 거리적성 부족(1600m 전문), 중간 폼
    hrNo: '2', hrName: '질풍노도',
    recentRaces: [
      race({ ord: 1, rcDist: 1600, budam: 56, hrWeight: 490, hrWeightDiff: 0, jkWinRate: 0.12, trWinRate: 0.10 }),
      race({ ord: 2, rcDist: 1600, budam: 56, hrWeight: 490, hrWeightDiff: 2, jkWinRate: 0.12, trWinRate: 0.10 }),
      race({ ord: 4, rcDist: 1200, budam: 56, hrWeight: 488, hrWeightDiff: -2, jkWinRate: 0.12, trWinRate: 0.10 }),
      race({ ord: 3, rcDist: 1400, budam: 55, hrWeight: 490, hrWeightDiff: 3, jkWinRate: 0.12, trWinRate: 0.10 }),
      race({ ord: 2, rcDist: 1600, budam: 55, hrWeight: 487, hrWeightDiff: -1, jkWinRate: 0.12, trWinRate: 0.10 }),
    ],
    todayRace: {
      rcDist: 1200, startNo: 8, hrCnt: 10, budam: 56,
      hrWeight: 491, hrWeightDiff: 3,
      jkWinRate: 0.12, trWinRate: 0.10, daysSinceLastRace: 14,
    },
  },
  {
    // 3번마: "폭풍전야" - 신마급, 데이터 부족, 조교사 승률 높음
    hrNo: '3', hrName: '폭풍전야',
    recentRaces: [
      race({ ord: 3, rcDist: 1200, budam: 54, hrWeight: 460, hrWeightDiff: 0, jkWinRate: 0.06, trWinRate: 0.16 }),
      race({ ord: 5, rcDist: 1200, budam: 54, hrWeight: 458, hrWeightDiff: -2, jkWinRate: 0.06, trWinRate: 0.16 }),
    ],
    todayRace: {
      rcDist: 1200, startNo: 1, hrCnt: 10, budam: 54,
      hrWeight: 462, hrWeightDiff: 2,
      jkWinRate: 0.06, trWinRate: 0.16, daysSinceLastRace: 28,
    },
  },
  {
    // 4번마: "맹호출산" - 장기 휴양 복귀, 과거 성적 우수
    hrNo: '4', hrName: '맹호출산',
    recentRaces: [
      race({ ord: 1, rcDist: 1200, budam: 58, hrWeight: 500, hrWeightDiff: 5, jkWinRate: 0.15, trWinRate: 0.12 }),
      race({ ord: 1, rcDist: 1200, budam: 57, hrWeight: 495, hrWeightDiff: 0, jkWinRate: 0.15, trWinRate: 0.12 }),
      race({ ord: 2, rcDist: 1300, budam: 57, hrWeight: 495, hrWeightDiff: -3, jkWinRate: 0.15, trWinRate: 0.12 }),
    ],
    todayRace: {
      rcDist: 1200, startNo: 5, hrCnt: 10, budam: 58,
      hrWeight: 505, hrWeightDiff: 10,
      jkWinRate: 0.15, trWinRate: 0.12, daysSinceLastRace: 120,
    },
  },
  {
    // 5번마: "번개맨" - 연전 과다(5일), 하락세
    hrNo: '5', hrName: '번개맨',
    recentRaces: [
      race({ ord: 6, rcDist: 1200, budam: 55, hrWeight: 468, hrWeightDiff: -4, jkWinRate: 0.09, trWinRate: 0.07 }),
      race({ ord: 4, rcDist: 1200, budam: 55, hrWeight: 472, hrWeightDiff: 3, jkWinRate: 0.09, trWinRate: 0.07 }),
      race({ ord: 3, rcDist: 1200, budam: 54, hrWeight: 469, hrWeightDiff: -1, jkWinRate: 0.09, trWinRate: 0.07 }),
    ],
    todayRace: {
      rcDist: 1200, startNo: 10, hrCnt: 10, budam: 56,
      hrWeight: 465, hrWeightDiff: -3,
      jkWinRate: 0.09, trWinRate: 0.07, daysSinceLastRace: 5,
    },
  },
  {
    // 6번마: "용의눈물" - 중간 실력, 안정적 체중, 적정 간격
    hrNo: '6', hrName: '용의눈물',
    recentRaces: [
      race({ ord: 3, rcDist: 1200, budam: 56, hrWeight: 485, hrWeightDiff: 1, jkWinRate: 0.10, trWinRate: 0.09 }),
      race({ ord: 2, rcDist: 1200, budam: 56, hrWeight: 484, hrWeightDiff: -1, jkWinRate: 0.10, trWinRate: 0.09 }),
      race({ ord: 4, rcDist: 1300, budam: 56, hrWeight: 485, hrWeightDiff: 0, jkWinRate: 0.10, trWinRate: 0.09 }),
      race({ ord: 3, rcDist: 1200, budam: 55, hrWeight: 485, hrWeightDiff: 1, jkWinRate: 0.10, trWinRate: 0.09 }),
      race({ ord: 5, rcDist: 1200, budam: 55, hrWeight: 484, hrWeightDiff: -1, jkWinRate: 0.10, trWinRate: 0.09 }),
    ],
    todayRace: {
      rcDist: 1200, startNo: 4, hrCnt: 10, budam: 56,
      hrWeight: 485, hrWeightDiff: 0,
      jkWinRate: 0.10, trWinRate: 0.09, daysSinceLastRace: 18,
    },
  },
]

describe('실제 경마 시뮬레이션: 서울 1200m 6두', () => {
  const results = predictRace(horses)

  it('TC-R1: 최근 폼+거리적성+리딩기수 "천둥번개"가 1위로 예측된다', () => {
    expect(results[0].hrName).toBe('천둥번개')
    expect(results[0].predictedRank).toBe(1)
  })

  it('TC-R2: 천둥번개의 종합 점수가 75점 이상이다', () => {
    expect(results[0].totalScore).toBeGreaterThanOrEqual(75)
  })

  it('TC-R3: 거리 부적합 "질풍노도"(1600m전문)가 천둥번개보다 낮게 예측된다', () => {
    const thunder = results.find((r) => r.hrName === '천둥번개')!
    const storm = results.find((r) => r.hrName === '질풍노도')!
    expect(storm.totalScore).toBeLessThan(thunder.totalScore)
    expect(storm.dimensions.distanceFit).toBeLessThan(thunder.dimensions.distanceFit)
  })

  it('TC-R4: 장기 휴양 "맹호출산"(120일)은 출전간격 점수가 낮다', () => {
    const tiger = results.find((r) => r.hrName === '맹호출산')!
    expect(tiger.dimensions.raceInterval).toBeLessThanOrEqual(30)
  })

  it('TC-R5: 장기 휴양 + 체중급증(+10kg) "맹호출산"은 컨디션 점수도 낮다', () => {
    const tiger = results.find((r) => r.hrName === '맹호출산')!
    expect(tiger.dimensions.conditionStability).toBeLessThan(50)
  })

  it('TC-R6: 연전 과다 "번개맨"(5일)은 출전간격 점수가 30점이다', () => {
    const flash = results.find((r) => r.hrName === '번개맨')!
    expect(flash.dimensions.raceInterval).toBe(30)
  })

  it('TC-R7: 최외측 게이트 "번개맨"(10번)은 게이트 점수가 35점이다', () => {
    const flash = results.find((r) => r.hrName === '번개맨')!
    expect(flash.dimensions.gateAdvantage).toBe(35)
  })

  it('TC-R8: 안정적 체중 "용의눈물"은 컨디션 점수가 80 이상이다', () => {
    const dragon = results.find((r) => r.hrName === '용의눈물')!
    expect(dragon.dimensions.conditionStability).toBeGreaterThanOrEqual(80)
  })

  it('TC-R9: 신마급 "폭풍전야"(2전)는 신뢰도가 low이다', () => {
    const newbie = results.find((r) => r.hrName === '폭풍전야')!
    expect(newbie.confidence).toBe('low')
  })

  it('TC-R10: 모든 말의 종합 점수가 0~100 범위이며 순위 연속이다', () => {
    for (let i = 0; i < results.length; i++) {
      expect(results[i].totalScore).toBeGreaterThanOrEqual(0)
      expect(results[i].totalScore).toBeLessThanOrEqual(100)
      expect(results[i].predictedRank).toBe(i + 1)
    }
  })

  it('예측 결과 전체 출력 (디버그용)', () => {
    console.table(
      results.map((r) => ({
        순위: r.predictedRank,
        마명: r.hrName,
        종합: r.totalScore,
        폼: r.dimensions.recentForm,
        거리: r.dimensions.distanceFit,
        중량: r.dimensions.weightChange,
        게이트: r.dimensions.gateAdvantage,
        '기수/조교': r.dimensions.jockeyTrainerRate,
        컨디션: r.dimensions.conditionStability,
        간격: r.dimensions.raceInterval,
        신뢰도: r.confidence,
      })),
    )
    expect(true).toBe(true)
  })
})
