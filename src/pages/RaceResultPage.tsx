import { useState } from 'react'
import { getRaceDetailResults } from '../api/kraApi'
import type { RaceDetailResult, MeetCode } from '../api/types'
import { MEET_CODES, MEET_NAMES } from '../api/types'
import { RaceResultTable } from '../components/RaceResultTable'
import './RaceResultPage.css'

export function RaceResultPage() {
  const [meet, setMeet] = useState<MeetCode>(MEET_CODES.SEOUL)
  const [rcDate, setRcDate] = useState('')
  const [results, setResults] = useState<RaceDetailResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!rcDate) {
      setError('경주일자를 선택해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const dateStr = rcDate.replace(/-/g, '')
      const data = await getRaceDetailResults({ meet, rcDate: dateStr })
      setResults(data)
      if (data.length === 0) {
        setError('해당 일자에 경주 데이터가 없습니다.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 경주번호별로 그룹핑
  const groupedByRace = results.reduce<Record<string, RaceDetailResult[]>>((acc, item) => {
    const key = item.rcNo
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const raceNumbers = Object.keys(groupedByRace).sort(
    (a, b) => Number(a) - Number(b),
  )

  return (
    <div className="race-result-page">
      <div className="search-box">
        <h2>경주 성적 조회</h2>
        <div className="search-fields">
          <select value={meet} onChange={(e) => setMeet(e.target.value as MeetCode)}>
            {Object.entries(MEET_NAMES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <input
            type="date"
            value={rcDate}
            onChange={(e) => setRcDate(e.target.value)}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '조회 중...' : '조회'}
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>

      {raceNumbers.length > 0 && (
        <div className="race-results">
          {raceNumbers.map((rcNo) => (
            <RaceResultTable
              key={rcNo}
              rcNo={rcNo}
              meetName={MEET_NAMES[meet]}
              results={groupedByRace[rcNo]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
