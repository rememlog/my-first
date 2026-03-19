import type { HorseRecord } from './types'

/** 0~100 범위로 클램프 */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

// ─────────────────────────────────────────────
// 1. 폼 (최근 3경주 착순 기반)
// ─────────────────────────────────────────────
// 착순 → 점수 매핑: 1착=100, 2착=80, 3착=60, 4착=40, 5착=20, 6착이하=5
// 최근일수록 가중(3배/2배/1배)
const ORD_SCORES = [100, 80, 60, 40, 20] as const

function ordToScore(ord: number): number {
  if (ord >= 1 && ord <= 5) return ORD_SCORES[ord - 1]
  return 5
}

export function scoreRecentForm(record: HorseRecord): number {
  const last3 = record.recentRaces.slice(0, 3)
  if (last3.length === 0) return 50 // 데이터 없으면 중립

  const weights = [3, 2, 1]
  let weightedSum = 0
  let weightTotal = 0

  for (let i = 0; i < last3.length; i++) {
    const w = weights[i]
    weightedSum += ordToScore(last3[i].ord) * w
    weightTotal += w
  }

  return clamp(Math.round(weightedSum / weightTotal))
}

// ─────────────────────────────────────────────
// 2. 거리적성 (해당 거리에서의 과거 성적)
// ─────────────────────────────────────────────
// 오늘 경주 거리 ±100m 이내 과거 경주 필터 → 평균 착순 점수

export function scoreDistanceFit(record: HorseRecord): number {
  const todayDist = record.todayRace.rcDist
  const tolerance = 100

  const matched = record.recentRaces.filter(
    (r) => Math.abs(r.rcDist - todayDist) <= tolerance,
  )

  if (matched.length === 0) return 50 // 해당 거리 출전 이력 없으면 중립

  const avg = matched.reduce((sum, r) => sum + ordToScore(r.ord), 0) / matched.length
  return clamp(Math.round(avg))
}

// ─────────────────────────────────────────────
// 3. 부담중량 변화
// ─────────────────────────────────────────────
// 직전 경주 대비 부담중량 감소 → 유리(+), 증가 → 불리(-)
// 기준: ±0kg = 60, -2kg = 80, +2kg = 40 (1kg당 ±10점)

export function scoreWeightChange(record: HorseRecord): number {
  const lastRace = record.recentRaces[0]
  if (!lastRace) return 60

  const diff = lastRace.budam - record.todayRace.budam // 양수 = 감량(유리)
  const score = 60 + diff * 10
  return clamp(Math.round(score))
}

// ─────────────────────────────────────────────
// 4. 게이트/전개 유리
// ─────────────────────────────────────────────
// 내측 게이트(1~4번) 유리, 극외측(10+) 불리
// 편성두수 대비 상대 위치도 반영

export function scoreGateAdvantage(record: HorseRecord): number {
  const { startNo, hrCnt } = record.todayRace

  // 편성두수 대비 상대 위치 (0~1, 작을수록 내측)
  const relativePos = (startNo - 1) / Math.max(hrCnt - 1, 1)

  // 내측일수록 높은 점수 (선형 모델)
  // relativePos 0 → 85점, relativePos 1 → 35점
  const score = 85 - relativePos * 50

  return clamp(Math.round(score))
}

// ─────────────────────────────────────────────
// 5. 기수/조교사 최근 승률
// ─────────────────────────────────────────────
// 기수 승률(70% 가중) + 조교사 승률(30% 가중)
// 승률 15% 이상 → 90점 수준, 5% → 50점 수준

function winRateToScore(rate: number): number {
  // rate는 0~1 (예: 0.15 = 15%)
  // 0% → 20, 10% → 60, 20%+ → 100
  return clamp(Math.round(20 + rate * 400))
}

export function scoreJockeyTrainer(record: HorseRecord): number {
  const { jkWinRate, trWinRate } = record.todayRace

  const jkScore = winRateToScore(jkWinRate)
  const trScore = winRateToScore(trWinRate)

  return clamp(Math.round(jkScore * 0.7 + trScore * 0.3))
}

// ─────────────────────────────────────────────
// 6. 컨디션 안정성 (마체중 증감 패턴)
// ─────────────────────────────────────────────
// 최근 3경주 체중 증감의 표준편차가 작을수록 안정적
// 오늘 체중 증감이 ±5kg 이내면 보너스

export function scoreConditionStability(record: HorseRecord): number {
  const last3 = record.recentRaces.slice(0, 3)
  const todayDiff = Math.abs(record.todayRace.hrWeightDiff)

  // 오늘 체중변화 점수: ±0 = 100, ±3 = 70, ±5 = 50, ±10+ = 20
  const todayScore = clamp(100 - todayDiff * 8)

  if (last3.length < 2) return todayScore

  // 과거 체중 증감의 변동성 (표준편차)
  const diffs = last3.map((r) => r.hrWeightDiff)
  const mean = diffs.reduce((s, v) => s + v, 0) / diffs.length
  const variance = diffs.reduce((s, v) => s + (v - mean) ** 2, 0) / diffs.length
  const stdDev = Math.sqrt(variance)

  // stdDev 0 → 100, 5 → 50, 10+ → 20
  const stabilityScore = clamp(100 - stdDev * 10)

  return clamp(Math.round(todayScore * 0.5 + stabilityScore * 0.5))
}

// ─────────────────────────────────────────────
// 7. 출전간격 (휴양 여부)
// ─────────────────────────────────────────────
// 최적 간격: 14~28일 → 고점수
// 너무 짧음(<7일): 피로 누적
// 너무 길음(>90일): 감각 저하

export function scoreRaceInterval(record: HorseRecord): number {
  const days = record.todayRace.daysSinceLastRace

  if (days <= 0) return 50 // 데이터 없음

  // 구간별 점수
  if (days >= 14 && days <= 28) return 90  // 최적
  if (days >= 10 && days < 14) return 75   // 약간 빠름
  if (days > 28 && days <= 42) return 80   // 약간 김
  if (days >= 7 && days < 10) return 55    // 빠름
  if (days > 42 && days <= 60) return 65   // 김
  if (days > 60 && days <= 90) return 45   // 장기 휴양
  if (days < 7) return 30                  // 과도한 연전
  return 30                                // 90일 초과 → 감각 저하
}

/** 모든 7차원 스코어를 한 번에 계산 */
export function computeAllScores(record: HorseRecord) {
  return {
    recentForm: scoreRecentForm(record),
    distanceFit: scoreDistanceFit(record),
    weightChange: scoreWeightChange(record),
    gateAdvantage: scoreGateAdvantage(record),
    jockeyTrainerRate: scoreJockeyTrainer(record),
    conditionStability: scoreConditionStability(record),
    raceInterval: scoreRaceInterval(record),
  }
}
