/** 공공데이터포털 공통 응답 래퍼 */
export interface KraResponse<T> {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items: {
        item: T[]
      }
      totalCount: number
      numOfRows: number
      pageNo: number
    }
  }
}

/** 경주별 상세 성적표 (B551015/racedetailresult) */
export interface RaceDetailResult {
  meet: string          // 경마장 (1:서울, 2:제주, 3:부산경남)
  rcDate: string        // 경주일자 (YYYYMMDD)
  rcNo: string          // 경주번호
  ord: string           // 착순
  startNo: string       // 출주번호
  hrNo: string          // 마번
  hrName: string        // 마명
  birthPlace: string    // 산지
  sex: string           // 성별
  age: string           // 연령
  budam: string         // 부담중량
  jkNo: string          // 기수번호
  jkName: string        // 기수명
  trNo: string          // 조교사번호
  trName: string        // 조교사명
  owNo: string          // 마주번호
  owName: string        // 마주명
  diffUnit: string      // 도착차
  hrWeight: string      // 마체중
  hrWeightDiff: string  // 마체중증감
  winOdds: string       // 단승식배당율
  plcOdds: string       // 연승식배당율
  rcTime: string        // 경주기록
  rating: string        // 레이팅
  chulYn: string        // 출주여부
}

/** 경마경주정보 (B551015/API187/HorseRaceInfo) */
export interface HorseRaceInfo {
  meetNm: string        // 경마장명
  rcYear: string        // 경마시행년도
  birthPlaceCd: string  // 마필산지구분코드
  birthPlaceNm: string  // 마필산지구분명
  grpNm: string         // 마필등급(군분류)
  rcCnt: string         // 경주수
}

/** RC경마경주정보 (B551015/API186) */
export interface RcRaceResult {
  meet: string
  rcDate: string
  rcNo: string
  chaksun: string       // 착순
  chaksunPrize: string  // 착순상금
  rcCancelYn: string    // 경주취소여부
  ownerNm: string       // 마주명
  trainerNm: string     // 조교사명
  age: string           // 마령
  hrNo: string          // 마번
  hrName: string        // 경주마명
  hrBirthPlace: string  // 생산지
  rank: string          // 등급
  jockeyNm: string      // 기수명
  nightRcYn: string     // 야간경주여부
  winOdds: string       // 단승식배당
  plcOdds: string       // 연승식배당
  hrCnt: string         // 편성두수
  startCnt: string      // 출주두수
  rcDist: string        // 경주거리
  rcRecord: string      // 경주기록
  sex: string           // 성별
  baseWeight: string    // 기본부담중량
  trackState: string    // 트랙상태
  weather: string       // 날씨
  startNo: string       // 출주번호
  hrWeight: string      // 마체중
}

/** 경마장 코드 */
export const MEET_CODES = {
  SEOUL: '1',
  JEJU: '2',
  BUSAN: '3',
} as const

export type MeetCode = (typeof MEET_CODES)[keyof typeof MEET_CODES]

export const MEET_NAMES: Record<string, string> = {
  '1': '서울',
  '2': '제주',
  '3': '부산경남',
}
