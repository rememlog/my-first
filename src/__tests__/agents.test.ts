import { describe, it, expect } from 'vitest'
import {
  DataCollectorAgent,
  AnalyzerAgent,
  PredictorAgent,
  PredictionPipeline,
} from '../prediction/agents'
import type { RawHorseData } from '../prediction/agents'
import type { HorseRecord, PastRace } from '../prediction/types'

// ─────────────────────────────────────────────────────
// 테스트 헬퍼
// ─────────────────────────────────────────────────────

function makeRawHorse(name: string, overrides: Partial<RawHorseData> = {}): RawHorseData {
  return {
    hrNo: '1',
    hrName: name,
    pastRaces: [
      {
        rcDate: '20260301', rcDist: '1200', ord: '1', startNo: '3',
        hrCnt: '10', rcTime: '72.5', hrWeight: '475', hrWeightDiff: '-1',
        budam: '57', jkWinRate: '0.15', trWinRate: '0.10',
      },
      {
        rcDate: '20260215', rcDist: 1200, ord: 2, startNo: 5,
        hrCnt: 10, rcTime: 73.0, hrWeight: 476, hrWeightDiff: 1,
        budam: 56, jkWinRate: 0.15, trWinRate: 0.10,
      },
    ],
    today: {
      rcDist: '1200', startNo: '4', hrCnt: '10', budam: '57',
      hrWeight: '474', hrWeightDiff: '-2', jkWinRate: '0.15',
      trWinRate: '0.10', daysSinceLastRace: '21',
    },
    ...overrides,
  }
}

function makeRecord(overrides: Partial<PastRace> = {}): PastRace {
  return {
    rcDate: '20260308', rcDist: 1200, ord: 3, startNo: 5, hrCnt: 10,
    rcTime: 73.2, hrWeight: 480, hrWeightDiff: 0, budam: 57,
    jkWinRate: 0.10, trWinRate: 0.08, ...overrides,
  }
}

// ─────────────────────────────────────────────────────
// DataCollectorAgent 테스트
// ─────────────────────────────────────────────────────

describe('DataCollectorAgent', () => {
  const collector = new DataCollectorAgent()

  it('문자열 필드를 숫자로 정규화한다', () => {
    const raw = [makeRawHorse('테스트마')]
    const { records } = collector.execute(raw)

    expect(records).toHaveLength(1)
    expect(records[0].todayRace.rcDist).toBe(1200)
    expect(typeof records[0].todayRace.rcDist).toBe('number')
    expect(records[0].recentRaces[0].ord).toBe(1)
    expect(typeof records[0].recentRaces[0].ord).toBe('number')
  })

  it('유효하지 않은 오늘 경주 데이터는 제외한다', () => {
    const raw = [
      makeRawHorse('정상마'),
      makeRawHorse('불량마', { today: { ...makeRawHorse('x').today, rcDist: 'abc' } }),
    ]
    const { records, logs } = collector.execute(raw)

    expect(records).toHaveLength(1)
    expect(records[0].hrName).toBe('정상마')
    expect(logs.some((l) => l.message.includes('불량마'))).toBe(true)
  })

  it('유효하지 않은 과거 경주 레코드는 필터링한다', () => {
    const raw = [makeRawHorse('필터마', {
      pastRaces: [
        { rcDate: '20260301', rcDist: '1200', ord: '1', startNo: '3', hrCnt: '10', rcTime: '72.5', hrWeight: '475', hrWeightDiff: '-1', budam: '57', jkWinRate: '0.15', trWinRate: '0.10' },
        { rcDate: '20260201', rcDist: 'xxx', ord: 'abc', startNo: '5', hrCnt: '10', rcTime: '73.0', hrWeight: '476', hrWeightDiff: '1', budam: '56', jkWinRate: '0.15', trWinRate: '0.10' },
      ],
    })]
    const { records } = collector.execute(raw)

    expect(records[0].recentRaces).toHaveLength(1)
  })

  it('과거 경주를 최대 10경주로 제한한다', () => {
    const manyRaces = Array.from({ length: 15 }, (_, i) => ({
      rcDate: `2026030${i}`, rcDist: '1200', ord: '3', startNo: '5',
      hrCnt: '10', rcTime: '73.0', hrWeight: '480', hrWeightDiff: '0',
      budam: '57', jkWinRate: '0.10', trWinRate: '0.08',
    }))
    const raw = [makeRawHorse('다전마', { pastRaces: manyRaces })]
    const { records } = collector.execute(raw)

    expect(records[0].recentRaces).toHaveLength(10)
  })

  it('로그에 에이전트 이름이 포함된다', () => {
    const raw = [makeRawHorse('로그마')]
    const { logs } = collector.execute(raw)

    expect(logs.every((l) => l.agent === 'DataCollector')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────
// AnalyzerAgent 테스트
// ─────────────────────────────────────────────────────

describe('AnalyzerAgent', () => {
  const analyzer = new AnalyzerAgent()

  it('7차원 점수를 모두 계산한다', () => {
    const records: HorseRecord[] = [{
      hrNo: '1', hrName: '분석마',
      recentRaces: [
        makeRecord({ ord: 1 }),
        makeRecord({ ord: 2 }),
        makeRecord({ ord: 3 }),
      ],
      todayRace: {
        rcDist: 1200, startNo: 3, hrCnt: 10, budam: 57,
        hrWeight: 480, hrWeightDiff: 0, jkWinRate: 0.10,
        trWinRate: 0.08, daysSinceLastRace: 21,
      },
    }]

    const { analyzed } = analyzer.execute(records)

    expect(analyzed).toHaveLength(1)
    expect(analyzed[0].dimensions).toHaveProperty('recentForm')
    expect(analyzed[0].dimensions).toHaveProperty('distanceFit')
    expect(analyzed[0].dimensions).toHaveProperty('weightChange')
    expect(analyzed[0].dimensions).toHaveProperty('gateAdvantage')
    expect(analyzed[0].dimensions).toHaveProperty('jockeyTrainerRate')
    expect(analyzed[0].dimensions).toHaveProperty('conditionStability')
    expect(analyzed[0].dimensions).toHaveProperty('raceInterval')
  })

  it('극단값이 있으면 경고 로그를 남긴다', () => {
    const records: HorseRecord[] = [{
      hrNo: '1', hrName: '극단마',
      recentRaces: [
        makeRecord({ ord: 1, rcDist: 1200 }),
        makeRecord({ ord: 1, rcDist: 1200 }),
        makeRecord({ ord: 1, rcDist: 1200 }),
      ],
      todayRace: {
        rcDist: 1200, startNo: 1, hrCnt: 10, budam: 57,
        hrWeight: 480, hrWeightDiff: 0, jkWinRate: 0.20,
        trWinRate: 0.15, daysSinceLastRace: 21,
      },
    }]

    const { logs } = analyzer.execute(records)

    expect(logs.some((l) => l.message.includes('극단값'))).toBe(true)
  })

  it('raceCount가 정확히 반영된다', () => {
    const records: HorseRecord[] = [{
      hrNo: '1', hrName: '삼전마',
      recentRaces: [makeRecord(), makeRecord(), makeRecord()],
      todayRace: {
        rcDist: 1200, startNo: 5, hrCnt: 10, budam: 57,
        hrWeight: 480, hrWeightDiff: 0, jkWinRate: 0.10,
        trWinRate: 0.08, daysSinceLastRace: 21,
      },
    }]

    const { analyzed } = analyzer.execute(records)
    expect(analyzed[0].raceCount).toBe(3)
  })
})

// ─────────────────────────────────────────────────────
// PredictorAgent 테스트
// ─────────────────────────────────────────────────────

describe('PredictorAgent', () => {
  const predictor = new PredictorAgent()

  it('종합 점수 내림차순으로 순위를 매긴다', () => {
    const analyzed = [
      { hrNo: '1', hrName: '하위마', dimensions: { recentForm: 30, distanceFit: 30, weightChange: 30, gateAdvantage: 30, jockeyTrainerRate: 30, conditionStability: 30, raceInterval: 30 }, raceCount: 5 },
      { hrNo: '2', hrName: '상위마', dimensions: { recentForm: 90, distanceFit: 90, weightChange: 90, gateAdvantage: 90, jockeyTrainerRate: 90, conditionStability: 90, raceInterval: 90 }, raceCount: 5 },
    ]

    const { predictions } = predictor.execute(analyzed)

    expect(predictions[0].hrName).toBe('상위마')
    expect(predictions[0].predictedRank).toBe(1)
    expect(predictions[1].hrName).toBe('하위마')
    expect(predictions[1].predictedRank).toBe(2)
  })

  it('raceCount에 따라 신뢰도를 판정한다', () => {
    const analyzed = [
      { hrNo: '1', hrName: '다전마', dimensions: { recentForm: 50, distanceFit: 50, weightChange: 50, gateAdvantage: 50, jockeyTrainerRate: 50, conditionStability: 50, raceInterval: 50 }, raceCount: 7 },
      { hrNo: '2', hrName: '중전마', dimensions: { recentForm: 50, distanceFit: 50, weightChange: 50, gateAdvantage: 50, jockeyTrainerRate: 50, conditionStability: 50, raceInterval: 50 }, raceCount: 4 },
      { hrNo: '3', hrName: '소전마', dimensions: { recentForm: 50, distanceFit: 50, weightChange: 50, gateAdvantage: 50, jockeyTrainerRate: 50, conditionStability: 50, raceInterval: 50 }, raceCount: 1 },
    ]

    const { predictions } = predictor.execute(analyzed)

    expect(predictions.find((p) => p.hrName === '다전마')!.confidence).toBe('high')
    expect(predictions.find((p) => p.hrName === '중전마')!.confidence).toBe('medium')
    expect(predictions.find((p) => p.hrName === '소전마')!.confidence).toBe('low')
  })

  it('상위 3두를 로그에 기록한다', () => {
    const analyzed = [
      { hrNo: '1', hrName: '일등마', dimensions: { recentForm: 90, distanceFit: 90, weightChange: 60, gateAdvantage: 70, jockeyTrainerRate: 80, conditionStability: 70, raceInterval: 80 }, raceCount: 5 },
      { hrNo: '2', hrName: '이등마', dimensions: { recentForm: 70, distanceFit: 70, weightChange: 60, gateAdvantage: 60, jockeyTrainerRate: 60, conditionStability: 60, raceInterval: 70 }, raceCount: 5 },
    ]

    const { logs } = predictor.execute(analyzed)

    expect(logs.some((l) => l.message.includes('일등마'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────
// PredictionPipeline 통합 테스트
// ─────────────────────────────────────────────────────

describe('PredictionPipeline', () => {
  const pipeline = new PredictionPipeline()

  it('RawData → 최종 예측까지 전체 파이프라인이 작동한다', () => {
    const rawData: RawHorseData[] = [
      makeRawHorse('파이프1', { hrNo: '1' }),
      makeRawHorse('파이프2', {
        hrNo: '2',
        pastRaces: [
          { rcDate: '20260301', rcDist: '1200', ord: '5', startNo: '8', hrCnt: '10', rcTime: '75.0', hrWeight: '490', hrWeightDiff: '3', budam: '56', jkWinRate: '0.05', trWinRate: '0.04' },
        ],
        today: { rcDist: '1200', startNo: '9', hrCnt: '10', budam: '56', hrWeight: '493', hrWeightDiff: '3', jkWinRate: '0.05', trWinRate: '0.04', daysSinceLastRace: '7' },
      }),
    ]

    const result = pipeline.run(rawData)

    expect(result.predictions).toHaveLength(2)
    expect(result.predictions[0].predictedRank).toBe(1)
    expect(result.predictions[1].predictedRank).toBe(2)
    expect(result.predictions[0].hrName).toBe('파이프1') // 더 좋은 성적
    expect(result.logs.length).toBeGreaterThan(0)
    expect(result.executedAt).toBeGreaterThan(0)
  })

  it('3개 에이전트의 로그가 모두 포함된다', () => {
    const rawData: RawHorseData[] = [makeRawHorse('로그확인마')]
    const result = pipeline.run(rawData)

    const agentNames = [...new Set(result.logs.map((l) => l.agent))]
    expect(agentNames).toContain('DataCollector')
    expect(agentNames).toContain('Analyzer')
    expect(agentNames).toContain('Predictor')
  })

  it('runFromRecords로 정규화 단계를 스킵할 수 있다', () => {
    const records: HorseRecord[] = [{
      hrNo: '1', hrName: '스킵마',
      recentRaces: [makeRecord({ ord: 1 }), makeRecord({ ord: 2 }), makeRecord({ ord: 3 })],
      todayRace: {
        rcDist: 1200, startNo: 3, hrCnt: 10, budam: 57,
        hrWeight: 480, hrWeightDiff: 0, jkWinRate: 0.12,
        trWinRate: 0.10, daysSinceLastRace: 21,
      },
    }]

    const result = pipeline.runFromRecords(records)

    expect(result.predictions).toHaveLength(1)
    // DataCollector 로그가 없어야 함
    expect(result.logs.every((l) => l.agent !== 'DataCollector')).toBe(true)
  })

  it('불량 데이터가 섞여도 정상 데이터만 예측한다', () => {
    const rawData: RawHorseData[] = [
      makeRawHorse('정상마'),
      makeRawHorse('불량마', { today: { ...makeRawHorse('x').today, rcDist: '' } }),
    ]

    const result = pipeline.run(rawData)

    expect(result.predictions).toHaveLength(1)
    expect(result.predictions[0].hrName).toBe('정상마')
  })
})
