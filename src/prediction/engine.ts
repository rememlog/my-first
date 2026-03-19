import type {
  DimensionScores,
  DimensionWeights,
  HorseRecord,
  PredictionResult,
} from './types'
import { computeAllScores } from './scorers'

/** 기본 가중치 (합계 = 1.0) */
export const DEFAULT_WEIGHTS: DimensionWeights = {
  recentForm:         0.25,  // 폼이 가장 중요
  distanceFit:        0.18,  // 거리적성
  jockeyTrainerRate:  0.15,  // 기수/조교사
  conditionStability: 0.12,  // 컨디션
  raceInterval:       0.12,  // 출전간격
  weightChange:       0.10,  // 부담중량
  gateAdvantage:      0.08,  // 게이트
}

/** 가중합 계산 */
function weightedTotal(
  scores: DimensionScores,
  weights: DimensionWeights,
): number {
  let total = 0
  for (const key of Object.keys(weights) as (keyof DimensionWeights)[]) {
    total += scores[key] * weights[key]
  }
  return Math.round(total * 10) / 10
}

/** 신뢰도 판정: 데이터 충분성 기반 */
function assessConfidence(record: HorseRecord): PredictionResult['confidence'] {
  const raceCount = record.recentRaces.length
  if (raceCount >= 5) return 'high'
  if (raceCount >= 3) return 'medium'
  return 'low'
}

/** 단일 말 예측 점수 산출 */
export function predictHorse(
  record: HorseRecord,
  weights: DimensionWeights = DEFAULT_WEIGHTS,
): Omit<PredictionResult, 'predictedRank'> {
  const dimensions = computeAllScores(record)
  const totalScore = weightedTotal(dimensions, weights)
  const confidence = assessConfidence(record)

  return {
    hrNo: record.hrNo,
    hrName: record.hrName,
    totalScore,
    dimensions,
    confidence,
  }
}

/** 경주 내 전체 말 예측 → 순위 포함 결과 */
export function predictRace(
  horses: HorseRecord[],
  weights: DimensionWeights = DEFAULT_WEIGHTS,
): PredictionResult[] {
  const scored = horses.map((h) => predictHorse(h, weights))

  // 총점 내림차순 정렬
  scored.sort((a, b) => b.totalScore - a.totalScore)

  return scored.map((s, i) => ({
    ...s,
    predictedRank: i + 1,
  }))
}
