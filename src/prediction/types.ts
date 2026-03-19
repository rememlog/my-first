/**
 * 경마 승부예측 - 7차원 벡터 스코어링 타입 정의
 *
 * 각 차원은 0~100 정규화 점수로 계산되며,
 * 가중치를 곱해 종합 예측 점수를 산출한다.
 */

/** 7차원 개별 스코어 (0~100) */
export interface DimensionScores {
  /** 폼: 최근 3경주 착순 기반 */
  recentForm: number
  /** 거리적성: 해당 거리에서의 과거 성적 */
  distanceFit: number
  /** 부담중량 변화: 기본중량 대비 유불리 */
  weightChange: number
  /** 게이트/전개 유리: 출발번호 + 편성두수 기반 포지션 이점 */
  gateAdvantage: number
  /** 기수/조교사 최근 승률 */
  jockeyTrainerRate: number
  /** 조교기록 안정성: 마체중 증감 안정성 */
  conditionStability: number
  /** 출전간격: 적정 휴양 여부 */
  raceInterval: number
}

/** 차원별 가중치 (합계 = 1.0) */
export interface DimensionWeights {
  recentForm: number
  distanceFit: number
  weightChange: number
  gateAdvantage: number
  jockeyTrainerRate: number
  conditionStability: number
  raceInterval: number
}

/** 예측 결과 */
export interface PredictionResult {
  hrNo: string
  hrName: string
  /** 종합 예측 점수 (0~100) */
  totalScore: number
  /** 7차원 개별 점수 */
  dimensions: DimensionScores
  /** 예측 순위 */
  predictedRank: number
  /** 신뢰도 등급 */
  confidence: 'high' | 'medium' | 'low'
}

/** 개별 말의 과거 경주 기록 (예측 입력용) */
export interface HorseRecord {
  hrNo: string
  hrName: string
  /** 최근 경주 기록 (최신순, 최대 10경주) */
  recentRaces: PastRace[]
  /** 오늘 경주 정보 */
  todayRace: TodayRaceEntry
}

export interface PastRace {
  rcDate: string
  rcDist: number
  ord: number           // 착순
  startNo: number       // 게이트 번호
  hrCnt: number         // 편성두수
  rcTime: number        // 기록(초)
  hrWeight: number      // 마체중
  hrWeightDiff: number  // 마체중 증감
  budam: number         // 부담중량
  jkWinRate: number     // 해당 경주 기수 승률
  trWinRate: number     // 해당 경주 조교사 승률
}

export interface TodayRaceEntry {
  rcDist: number        // 오늘 경주 거리
  startNo: number       // 오늘 게이트 번호
  hrCnt: number         // 오늘 편성두수
  budam: number         // 오늘 부담중량
  hrWeight: number      // 오늘 마체중
  hrWeightDiff: number  // 오늘 체중 증감
  jkWinRate: number     // 기수 최근 승률
  trWinRate: number     // 조교사 최근 승률
  daysSinceLastRace: number // 마지막 출전으로부터 일수
}

/** 차원 이름 → 한국어 레이블 */
export const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  recentForm: '최근 폼',
  distanceFit: '거리적성',
  weightChange: '부담중량',
  gateAdvantage: '게이트/전개',
  jockeyTrainerRate: '기수/조교사',
  conditionStability: '컨디션',
  raceInterval: '출전간격',
}
