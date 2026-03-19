import type { RaceDetailResult } from '../api/types'
import './RaceResultTable.css'

interface Props {
  rcNo: string
  meetName: string
  results: RaceDetailResult[]
}

export function RaceResultTable({ rcNo, meetName, results }: Props) {
  const sorted = [...results].sort((a, b) => Number(a.ord) - Number(b.ord))
  const first = sorted[0]

  return (
    <div className="race-table-card">
      <div className="race-table-header">
        <span className="race-no">{rcNo}R</span>
        <span className="race-meta">
          {meetName} | {first?.rcDate?.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}
        </span>
      </div>

      <div className="race-table-scroll">
        <table className="race-table">
          <thead>
            <tr>
              <th>착순</th>
              <th>마번</th>
              <th>마명</th>
              <th>기수</th>
              <th>배당</th>
              <th>기록</th>
              <th>체중</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={`${r.hrNo}-${r.startNo}`} className={Number(r.ord) <= 3 ? `top-${r.ord}` : ''}>
                <td className="ord">{r.ord}</td>
                <td>{r.hrNo}</td>
                <td className="hr-name">{r.hrName}</td>
                <td>{r.jkName}</td>
                <td>{r.winOdds || '-'}</td>
                <td>{r.rcTime || '-'}</td>
                <td>
                  {r.hrWeight || '-'}
                  {r.hrWeightDiff && (
                    <span className={`weight-diff ${Number(r.hrWeightDiff) > 0 ? 'up' : Number(r.hrWeightDiff) < 0 ? 'down' : ''}`}>
                      ({r.hrWeightDiff})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
