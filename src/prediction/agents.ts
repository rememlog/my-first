/**
 * 경마 예측 파이프라인 - 3단계 에이전트 아키텍처
 *
 * 1. DataCollectorAgent  : 원시 데이터 → 정규화된 HorseRecord[]
 * 2. AnalyzerAgent       : HorseRecord[] → 7차원 개별 점수
 * 3. PredictorAgent      : 7차원 점수 → 종합 예측 + 순위
 *
 * Pipeline이 3개 에이전트를 순차 체이닝하며,
 * 각 에이전트는 독립적으로 테스트/교체 가능하다.
 */

import type {
  DimensionScores,
  DimensionWeights,
  HorseRecord,
  PastRace,
  PredictionResult,
  TodayRaceEntry,
} from './types'
import { computeAllScores } from './scorers'
import { DEFAULT_WEIGHTS } from './engine'

// ─────────────────────────────────────────────────────
// 에이전트 간 메시지 타입
// ─────────────────────────────────────────────────────

/** 원시 경주 데이터 (API/크롤링 결과물) */
export interface RawHorseData {
  hrNo: string
  hrName: string
  pastRaces: RawPastRace[]
  today: RawTodayEntry
}

/** API에서 오는 원시 과거 경주 (문자열 필드 포함 가능) */
export interface RawPastRace {
  rcDate: string
  rcDist: string | number
  ord: string | number
  startNo: string | number
  hrCnt: string | number
  rcTime: string | number
  hrWeight: string | number
  hrWeightDiff: string | number
  budam: string | number
  jkWinRate: string | number
  trWinRate: string | number
}

/** 오늘 경주 원시 데이터 */
export interface RawTodayEntry {
  rcDist: string | number
  startNo: string | number
  hrCnt: string | number
  budam: string | number
  hrWeight: string | number
  hrWeightDiff: string | number
  jkWinRate: string | number
  trWinRate: string | number
  daysSinceLastRace: string | number
}

/** 에이전트 실행 로그 */
export interface AgentLog {
  agent: string
  timestamp: number
  message: string
  data?: unknown
}

/** AnalyzerAgent 출력: 말별 7차원 분석 결과 */
export interface AnalyzedHorse {
  hrNo: string
  hrName: string
  dimensions: DimensionScores
  raceCount: number
}

/** 파이프라인 최종 출력 */
export interface PipelineResult {
  predictions: PredictionResult[]
  logs: AgentLog[]
  executedAt: number
}

// ─────────────────────────────────────────────────────
// Agent 1: DataCollectorAgent
// ─────────────────────────────────────────────────────
// 역할: 원시 데이터 수집 + 타입 변환 + 유효성 검증

export class DataCollectorAgent {
  name = 'DataCollector'

  /**
   * 원시 데이터를 정규화된 HorseRecord[]로 변환
   * - 문자열 → 숫자 변환
   * - 유효하지 않은 레코드 필터링
   * - 최근 10경주로 제한
   */
  execute(rawData: RawHorseData[]): {
    records: HorseRecord[]
    logs: AgentLog[]
  } {
    const logs: AgentLog[] = []
    const records: HorseRecord[] = []

    logs.push(this.log(`${rawData.length}두 원시 데이터 수신`))

    for (const raw of rawData) {
      const pastRaces = this.normalizePastRaces(raw.pastRaces)
      const todayRace = this.normalizeTodayEntry(raw.today)

      if (!todayRace) {
        logs.push(this.log(`${raw.hrName}: 오늘 경주 데이터 불량 → 제외`))
        continue
      }

      records.push({
        hrNo: raw.hrNo,
        hrName: raw.hrName,
        recentRaces: pastRaces.slice(0, 10), // 최대 10경주
        todayRace,
      })
    }

    logs.push(this.log(`${records.length}두 정규화 완료 (${rawData.length - records.length}두 제외)`))

    return { records, logs }
  }

  normalizePastRaces(raw: RawPastRace[]): PastRace[] {
    return raw
      .map((r) => ({
        rcDate: String(r.rcDate),
        rcDist: Number(r.rcDist),
        ord: Number(r.ord),
        startNo: Number(r.startNo),
        hrCnt: Number(r.hrCnt),
        rcTime: Number(r.rcTime),
        hrWeight: Number(r.hrWeight),
        hrWeightDiff: Number(r.hrWeightDiff),
        budam: Number(r.budam),
        jkWinRate: Number(r.jkWinRate),
        trWinRate: Number(r.trWinRate),
      }))
      .filter((r) => !isNaN(r.ord) && r.ord > 0 && !isNaN(r.rcDist) && r.rcDist > 0)
  }

  normalizeTodayEntry(raw: RawTodayEntry): TodayRaceEntry | null {
    const entry: TodayRaceEntry = {
      rcDist: Number(raw.rcDist),
      startNo: Number(raw.startNo),
      hrCnt: Number(raw.hrCnt),
      budam: Number(raw.budam),
      hrWeight: Number(raw.hrWeight),
      hrWeightDiff: Number(raw.hrWeightDiff),
      jkWinRate: Number(raw.jkWinRate),
      trWinRate: Number(raw.trWinRate),
      daysSinceLastRace: Number(raw.daysSinceLastRace),
    }

    if (isNaN(entry.rcDist) || entry.rcDist <= 0) return null
    if (isNaN(entry.hrCnt) || entry.hrCnt <= 0) return null

    return entry
  }

  log(message: string): AgentLog {
    return { agent: this.name, timestamp: Date.now(), message }
  }
}

// ─────────────────────────────────────────────────────
// Agent 2: AnalyzerAgent
// ─────────────────────────────────────────────────────
// 역할: HorseRecord → 7차원 개별 점수 계산

export class AnalyzerAgent {
  name = 'Analyzer'

  /**
   * 각 말의 7차원 점수를 독립적으로 계산
   * - computeAllScores를 호출하여 채점
   * - 각 차원별 이상치(0점 또는 100점) 경고 로그
   */
  execute(records: HorseRecord[]): {
    analyzed: AnalyzedHorse[]
    logs: AgentLog[]
  } {
    const logs: AgentLog[] = []
    const analyzed: AnalyzedHorse[] = []

    logs.push(this.log(`${records.length}두 분석 시작`))

    for (const record of records) {
      const dimensions = computeAllScores(record)

      // 극단값 경고
      const extremes = this.findExtremes(dimensions)
      if (extremes.length > 0) {
        logs.push(
          this.log(`${record.hrName}: 극단값 감지 [${extremes.join(', ')}]`),
        )
      }

      analyzed.push({
        hrNo: record.hrNo,
        hrName: record.hrName,
        dimensions,
        raceCount: record.recentRaces.length,
      })
    }

    logs.push(this.log(`${analyzed.length}두 7차원 분석 완료`))

    return { analyzed, logs }
  }

  findExtremes(scores: DimensionScores): string[] {
    const warnings: string[] = []
    for (const [key, value] of Object.entries(scores)) {
      if (value <= 10) warnings.push(`${key}=${value}(극저)`)
      else if (value >= 95) warnings.push(`${key}=${value}(극고)`)
    }
    return warnings
  }

  log(message: string): AgentLog {
    return { agent: this.name, timestamp: Date.now(), message }
  }
}

// ─────────────────────────────────────────────────────
// Agent 3: PredictorAgent
// ─────────────────────────────────────────────────────
// 역할: 7차원 점수 → 가중합 → 순위 + 신뢰도

export class PredictorAgent {
  name = 'Predictor'
  weights: DimensionWeights

  constructor(weights: DimensionWeights = DEFAULT_WEIGHTS) {
    this.weights = weights
  }

  /**
   * 분석 결과를 종합하여 최종 예측 산출
   * - 가중합 계산 → totalScore
   * - 내림차순 정렬 → predictedRank
   * - 데이터 충분성 → confidence
   */
  execute(analyzed: AnalyzedHorse[]): {
    predictions: PredictionResult[]
    logs: AgentLog[]
  } {
    const logs: AgentLog[] = []

    logs.push(this.log(`${analyzed.length}두 종합 예측 시작`))

    const scored = analyzed.map((horse) => {
      const totalScore = this.weightedTotal(horse.dimensions)
      const confidence = this.assessConfidence(horse.raceCount)

      return {
        hrNo: horse.hrNo,
        hrName: horse.hrName,
        totalScore,
        dimensions: horse.dimensions,
        confidence,
      }
    })

    // 총점 내림차순 정렬
    scored.sort((a, b) => b.totalScore - a.totalScore)

    const predictions: PredictionResult[] = scored.map((s, i) => ({
      ...s,
      predictedRank: i + 1,
    }))

    // 상위 3두 로그
    const top3 = predictions
      .slice(0, 3)
      .map((p) => `${p.predictedRank}위 ${p.hrName}(${p.totalScore})`)
      .join(', ')
    logs.push(this.log(`예측 완료: ${top3}`))

    return { predictions, logs }
  }

  weightedTotal(scores: DimensionScores): number {
    let total = 0
    for (const key of Object.keys(this.weights) as (keyof DimensionWeights)[]) {
      total += scores[key] * this.weights[key]
    }
    return Math.round(total * 10) / 10
  }

  assessConfidence(raceCount: number): PredictionResult['confidence'] {
    if (raceCount >= 5) return 'high'
    if (raceCount >= 3) return 'medium'
    return 'low'
  }

  log(message: string): AgentLog {
    return { agent: this.name, timestamp: Date.now(), message }
  }
}

// ─────────────────────────────────────────────────────
// Pipeline: 3 에이전트 오케스트레이터
// ─────────────────────────────────────────────────────

export class PredictionPipeline {
  collector: DataCollectorAgent
  analyzer: AnalyzerAgent
  predictor: PredictorAgent

  constructor(weights?: DimensionWeights) {
    this.collector = new DataCollectorAgent()
    this.analyzer = new AnalyzerAgent()
    this.predictor = new PredictorAgent(weights)
  }

  /**
   * 전체 파이프라인 실행
   * RawData → [Collector] → [Analyzer] → [Predictor] → PipelineResult
   */
  run(rawData: RawHorseData[]): PipelineResult {
    const allLogs: AgentLog[] = []

    // Step 1: 데이터 수집/정규화
    const { records, logs: collectorLogs } = this.collector.execute(rawData)
    allLogs.push(...collectorLogs)

    // Step 2: 7차원 분석
    const { analyzed, logs: analyzerLogs } = this.analyzer.execute(records)
    allLogs.push(...analyzerLogs)

    // Step 3: 종합 예측
    const { predictions, logs: predictorLogs } = this.predictor.execute(analyzed)
    allLogs.push(...predictorLogs)

    return {
      predictions,
      logs: allLogs,
      executedAt: Date.now(),
    }
  }

  /**
   * 이미 정규화된 HorseRecord[]로 직접 분석+예측
   * (DataCollector 단계 스킵)
   */
  runFromRecords(records: HorseRecord[]): PipelineResult {
    const allLogs: AgentLog[] = []

    const { analyzed, logs: analyzerLogs } = this.analyzer.execute(records)
    allLogs.push(...analyzerLogs)

    const { predictions, logs: predictorLogs } = this.predictor.execute(analyzed)
    allLogs.push(...predictorLogs)

    return {
      predictions,
      logs: allLogs,
      executedAt: Date.now(),
    }
  }
}
