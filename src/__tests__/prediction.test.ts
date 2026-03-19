import { describe, it, expect } from 'vitest'
import {
  scoreRecentForm,
  scoreDistanceFit,
  scoreWeightChange,
  scoreGateAdvantage,
  scoreJockeyTrainer,
  scoreConditionStability,
  scoreRaceInterval,
  predictRace,
  DEFAULT_WEIGHTS,
} from '../prediction'
import type { HorseRecord, PastRace } from '../prediction'

// ── 테스트 데이터 팩토리 ──

function makePastRace(overrides: Partial<PastRace> = {}): PastRace {
  return {
    rcDate: '20250301',
    rcDist: 1200,
    ord: 3,
    startNo: 5,
    hrCnt: 12,
    rcTime: 72.5,
    hrWeight: 480,
    hrWeightDiff: 0,
    budam: 57,
    jkWinRate: 0.10,
    trWinRate: 0.08,
    ...overrides,
  }
}

function makeHorse(overrides: Partial<HorseRecord> = {}): HorseRecord {
  return {
    hrNo: '7',
    hrName: '테스트호',
    recentRaces: [
      makePastRace({ ord: 1 }),
      makePastRace({ ord: 2 }),
      makePastRace({ ord: 3 }),
    ],
    todayRace: {
      rcDist: 1200,
      startNo: 3,
      hrCnt: 12,
      budam: 57,
      hrWeight: 480,
      hrWeightDiff: 0,
      jkWinRate: 0.12,
      trWinRate: 0.10,
      daysSinceLastRace: 21,
    },
    ...overrides,
  }
}

// ──────────────────────────────────────────────
// TC1: 최근 폼 스코어
// ──────────────────────────────────────────────

describe('scoreRecentForm', () => {
  it('연속 1착 → 100점', () => {
    const horse = makeHorse({
      recentRaces: [
        makePastRace({ ord: 1 }),
        makePastRace({ ord: 1 }),
        makePastRace({ ord: 1 }),
      ],
    })
    expect(scoreRecentForm(horse)).toBe(100)
  })

  it('1착→3착→5착 (최근순) → 가중 반영된 점수', () => {
    const horse = makeHorse({
      recentRaces: [
        makePastRace({ ord: 1 }), // 가중 3
        makePastRace({ ord: 3 }), // 가중 2
        makePastRace({ ord: 5 }), // 가중 1
      ],
    })
    // (100*3 + 60*2 + 20*1) / 6 = 73.3 → 73
    expect(scoreRecentForm(horse)).toBe(73)
  })

  it('경주 기록 없음 → 중립 50점', () => {
    const horse = makeHorse({ recentRaces: [] })
    expect(scoreRecentForm(horse)).toBe(50)
  })
})

// ──────────────────────────────────────────────
// TC2: 거리적성 스코어
// ──────────────────────────────────────────────

describe('scoreDistanceFit', () => {
  it('같은 거리에서 1착 이력 → 고점수', () => {
    const horse = makeHorse({
      recentRaces: [
        makePastRace({ rcDist: 1200, ord: 1 }),
        makePastRace({ rcDist: 1200, ord: 1 }),
      ],
      todayRace: { ...makeHorse().todayRace, rcDist: 1200 },
    })
    expect(scoreDistanceFit(horse)).toBe(100)
  })

  it('거리 범위(±100m) 내 기록 포함', () => {
    const horse = makeHorse({
      recentRaces: [
        makePastRace({ rcDist: 1300, ord: 2 }), // 1200±100 내
        makePastRace({ rcDist: 1400, ord: 1 }), // 범위 밖
      ],
      todayRace: { ...makeHorse().todayRace, rcDist: 1200 },
    })
    // 1300m만 매칭 → ord=2 → 80점
    expect(scoreDistanceFit(horse)).toBe(80)
  })

  it('해당 거리 출전 이력 없음 → 중립 50점', () => {
    const horse = makeHorse({
      recentRaces: [makePastRace({ rcDist: 1800, ord: 1 })],
      todayRace: { ...makeHorse().todayRace, rcDist: 1200 },
    })
    expect(scoreDistanceFit(horse)).toBe(50)
  })
})

// ──────────────────────────────────────────────
// TC3: 부담중량 변화 스코어
// ──────────────────────────────────────────────

describe('scoreWeightChange', () => {
  it('2kg 감량 → 80점', () => {
    const horse = makeHorse({
      recentRaces: [makePastRace({ budam: 59 })],
      todayRace: { ...makeHorse().todayRace, budam: 57 },
    })
    expect(scoreWeightChange(horse)).toBe(80)
  })

  it('2kg 증량 → 40점', () => {
    const horse = makeHorse({
      recentRaces: [makePastRace({ budam: 55 })],
      todayRace: { ...makeHorse().todayRace, budam: 57 },
    })
    expect(scoreWeightChange(horse)).toBe(40)
  })

  it('동일 중량 → 60점', () => {
    const horse = makeHorse({
      recentRaces: [makePastRace({ budam: 57 })],
      todayRace: { ...makeHorse().todayRace, budam: 57 },
    })
    expect(scoreWeightChange(horse)).toBe(60)
  })
})

// ──────────────────────────────────────────────
// TC4: 게이트/전개 유리 스코어
// ──────────────────────────────────────────────

describe('scoreGateAdvantage', () => {
  it('1번 게이트(최내측) → 85점', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, startNo: 1, hrCnt: 12 },
    })
    expect(scoreGateAdvantage(horse)).toBe(85)
  })

  it('12번 게이트(최외측, 12두) → 35점', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, startNo: 12, hrCnt: 12 },
    })
    expect(scoreGateAdvantage(horse)).toBe(35)
  })

  it('중간 게이트 → 중간 점수', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, startNo: 6, hrCnt: 12 },
    })
    const score = scoreGateAdvantage(horse)
    expect(score).toBeGreaterThan(50)
    expect(score).toBeLessThan(80)
  })
})

// ──────────────────────────────────────────────
// TC5: 기수/조교사 승률 스코어
// ──────────────────────────────────────────────

describe('scoreJockeyTrainer', () => {
  it('기수 20% + 조교사 15% → 고점수', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, jkWinRate: 0.20, trWinRate: 0.15 },
    })
    expect(scoreJockeyTrainer(horse)).toBeGreaterThan(80)
  })

  it('기수 0% + 조교사 0% → 저점수', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, jkWinRate: 0, trWinRate: 0 },
    })
    expect(scoreJockeyTrainer(horse)).toBe(20)
  })
})

// ──────────────────────────────────────────────
// TC6: 컨디션 안정성 스코어
// ──────────────────────────────────────────────

describe('scoreConditionStability', () => {
  it('체중 변동 없음 → 고점수', () => {
    const horse = makeHorse({
      recentRaces: [
        makePastRace({ hrWeightDiff: 0 }),
        makePastRace({ hrWeightDiff: 0 }),
        makePastRace({ hrWeightDiff: 0 }),
      ],
      todayRace: { ...makeHorse().todayRace, hrWeightDiff: 0 },
    })
    expect(scoreConditionStability(horse)).toBe(100)
  })

  it('체중 대폭 변동 → 저점수', () => {
    const horse = makeHorse({
      recentRaces: [
        makePastRace({ hrWeightDiff: -8 }),
        makePastRace({ hrWeightDiff: 10 }),
        makePastRace({ hrWeightDiff: -6 }),
      ],
      todayRace: { ...makeHorse().todayRace, hrWeightDiff: 10 },
    })
    expect(scoreConditionStability(horse)).toBeLessThan(30)
  })
})

// ──────────────────────────────────────────────
// TC7: 출전간격 스코어
// ──────────────────────────────────────────────

describe('scoreRaceInterval', () => {
  it('최적 간격(21일) → 90점', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, daysSinceLastRace: 21 },
    })
    expect(scoreRaceInterval(horse)).toBe(90)
  })

  it('과도한 연전(5일) → 30점', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, daysSinceLastRace: 5 },
    })
    expect(scoreRaceInterval(horse)).toBe(30)
  })

  it('장기 휴양(100일) → 30점', () => {
    const horse = makeHorse({
      todayRace: { ...makeHorse().todayRace, daysSinceLastRace: 100 },
    })
    expect(scoreRaceInterval(horse)).toBe(30)
  })
})

// ──────────────────────────────────────────────
// TC8: 종합 예측 엔진 (predictRace)
// ──────────────────────────────────────────────

describe('predictRace', () => {
  it('강한 말이 높은 순위로 예측된다', () => {
    const strong = makeHorse({
      hrNo: '1', hrName: '강한호',
      recentRaces: [
        makePastRace({ ord: 1, rcDist: 1200 }),
        makePastRace({ ord: 1, rcDist: 1200 }),
        makePastRace({ ord: 1, rcDist: 1200 }),
        makePastRace({ ord: 2, rcDist: 1200 }),
        makePastRace({ ord: 1, rcDist: 1200 }),
      ],
      todayRace: {
        rcDist: 1200, startNo: 1, hrCnt: 10, budam: 55,
        hrWeight: 480, hrWeightDiff: 0,
        jkWinRate: 0.20, trWinRate: 0.15,
        daysSinceLastRace: 21,
      },
    })

    const weak = makeHorse({
      hrNo: '2', hrName: '약한호',
      recentRaces: [
        makePastRace({ ord: 8, rcDist: 1400 }),
        makePastRace({ ord: 10, rcDist: 1600 }),
      ],
      todayRace: {
        rcDist: 1200, startNo: 10, hrCnt: 10, budam: 59,
        hrWeight: 490, hrWeightDiff: 8,
        jkWinRate: 0.02, trWinRate: 0.03,
        daysSinceLastRace: 5,
      },
    })

    const results = predictRace([weak, strong])

    expect(results[0].hrName).toBe('강한호')
    expect(results[0].predictedRank).toBe(1)
    expect(results[1].hrName).toBe('약한호')
    expect(results[1].predictedRank).toBe(2)
    expect(results[0].totalScore).toBeGreaterThan(results[1].totalScore)
  })

  it('결과에 7차원 점수가 모두 포함된다', () => {
    const horse = makeHorse()
    const results = predictRace([horse])

    const dims = results[0].dimensions
    expect(dims).toHaveProperty('recentForm')
    expect(dims).toHaveProperty('distanceFit')
    expect(dims).toHaveProperty('weightChange')
    expect(dims).toHaveProperty('gateAdvantage')
    expect(dims).toHaveProperty('jockeyTrainerRate')
    expect(dims).toHaveProperty('conditionStability')
    expect(dims).toHaveProperty('raceInterval')
  })

  it('신뢰도가 데이터 양에 따라 결정된다', () => {
    const rich = makeHorse({
      recentRaces: Array.from({ length: 6 }, () => makePastRace()),
    })
    const poor = makeHorse({ recentRaces: [makePastRace()] })

    const [richResult] = predictRace([rich])
    const [poorResult] = predictRace([poor])

    expect(richResult.confidence).toBe('high')
    expect(poorResult.confidence).toBe('low')
  })
})

// ──────────────────────────────────────────────
// TC9: 가중치 합계 검증
// ──────────────────────────────────────────────

describe('DEFAULT_WEIGHTS', () => {
  it('가중치 합계가 1.0이다', () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((s, v) => s + v, 0)
    expect(Math.round(sum * 100) / 100).toBe(1.0)
  })
})

// ──────────────────────────────────────────────
// TC10: 점수 경계값 (0~100 클램프)
// ──────────────────────────────────────────────

describe('점수 경계값 클램프', () => {
  it('극단적 입력에서도 0~100 범위를 벗어나지 않는다', () => {
    const extreme = makeHorse({
      recentRaces: [
        makePastRace({ ord: 99, budam: 100, hrWeightDiff: 50, rcDist: 9999 }),
      ],
      todayRace: {
        rcDist: 1200, startNo: 99, hrCnt: 2, budam: 30,
        hrWeight: 999, hrWeightDiff: 50,
        jkWinRate: 1.0, trWinRate: 1.0,
        daysSinceLastRace: 999,
      },
    })

    const [result] = predictRace([extreme])

    // 모든 차원 점수가 0~100
    for (const score of Object.values(result.dimensions)) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }

    // 총점도 0~100
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })
})
