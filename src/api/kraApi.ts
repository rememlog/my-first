import type {
  KraResponse,
  RaceDetailResult,
  RcRaceResult,
  MeetCode,
} from './types'

const BASE = '/api/kra'

async function fetchKra<T>(endpoint: string, params: Record<string, string>): Promise<T[]> {
  const searchParams = new URLSearchParams(params)
  const url = `${BASE}${endpoint}?${searchParams}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`)
  }

  const data: KraResponse<T> = await res.json()

  if (data.response.header.resultCode !== '00') {
    throw new Error(`API 오류: ${data.response.header.resultMsg}`)
  }

  const items = data.response.body.items?.item
  return Array.isArray(items) ? items : items ? [items] : []
}

/** 경주별 상세성적표 조회 */
export async function getRaceDetailResults(params: {
  meet: MeetCode
  rcDate: string
  rcNo?: string
  numOfRows?: string
  pageNo?: string
}): Promise<RaceDetailResult[]> {
  return fetchKra<RaceDetailResult>(
    '/racedetailresult/getracedetailresult',
    {
      meet: params.meet,
      rc_date: params.rcDate,
      ...(params.rcNo && { rc_no: params.rcNo }),
      numOfRows: params.numOfRows || '100',
      pageNo: params.pageNo || '1',
    },
  )
}

/** RC경마경주정보 조회 (과거 경주 결과) */
export async function getRcRaceResults(params: {
  meet: MeetCode
  rcDateFrom?: string
  rcDateTo?: string
  numOfRows?: string
  pageNo?: string
}): Promise<RcRaceResult[]> {
  return fetchKra<RcRaceResult>(
    '/API186/RaceResult',
    {
      meet: params.meet,
      ...(params.rcDateFrom && { rc_date_fr: params.rcDateFrom }),
      ...(params.rcDateTo && { rc_date_to: params.rcDateTo }),
      numOfRows: params.numOfRows || '100',
      pageNo: params.pageNo || '1',
    },
  )
}
