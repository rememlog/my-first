import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RaceResultTable } from '../components/RaceResultTable'
import type { RaceDetailResult } from '../api/types'

// ──────────────────────────────────────────────
// 테스트 케이스 9: RaceResultTable 컴포넌트 렌더링
// ──────────────────────────────────────────────

const mockResults: RaceDetailResult[] = [
  {
    meet: '1', rcDate: '20250301', rcNo: '3', ord: '2', startNo: '5',
    hrNo: '7', hrName: '태풍호', birthPlace: '한국', sex: '수',
    age: '4', budam: '57', jkNo: '101', jkName: '김기수',
    trNo: '201', trName: '박조교', owNo: '301', owName: '이마주',
    diffUnit: '1.0', hrWeight: '480', hrWeightDiff: '+3',
    winOdds: '5.2', plcOdds: '2.1', rcTime: '1:12.5',
    rating: '72', chulYn: 'Y',
  },
  {
    meet: '1', rcDate: '20250301', rcNo: '3', ord: '1', startNo: '3',
    hrNo: '3', hrName: '번개호', birthPlace: '한국', sex: '수',
    age: '5', budam: '57', jkNo: '102', jkName: '이기수',
    trNo: '202', trName: '최조교', owNo: '302', owName: '정마주',
    diffUnit: '0.0', hrWeight: '470', hrWeightDiff: '-2',
    winOdds: '3.1', plcOdds: '1.5', rcTime: '1:12.0',
    rating: '78', chulYn: 'Y',
  },
]

describe('TC9: RaceResultTable 컴포넌트', () => {
  it('경주번호와 경마장 이름이 표시된다', () => {
    render(<RaceResultTable rcNo="3" meetName="서울" results={mockResults} />)
    expect(screen.getByText('3R')).toBeInTheDocument()
    expect(screen.getByText(/서울/)).toBeInTheDocument()
  })

  it('착순 기준으로 정렬하여 표시한다', () => {
    render(<RaceResultTable rcNo="3" meetName="서울" results={mockResults} />)
    const rows = screen.getAllByRole('row')
    // header + 2 data rows
    expect(rows).toHaveLength(3)
    // 1착(번개호)이 첫 번째 데이터 행에 표시
    expect(rows[1]).toHaveTextContent('번개호')
    expect(rows[2]).toHaveTextContent('태풍호')
  })

  it('마체중 증감이 표시된다', () => {
    render(<RaceResultTable rcNo="3" meetName="서울" results={mockResults} />)
    expect(screen.getByText('(+3)')).toBeInTheDocument()
    expect(screen.getByText('(-2)')).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────
// 테스트 케이스 10: RaceResultPage 날짜 검증
// ──────────────────────────────────────────────

describe('TC10: 날짜 포맷 변환 로직', () => {
  it('rcDate를 YYYY.MM.DD 형식으로 포맷한다', () => {
    render(<RaceResultTable rcNo="1" meetName="서울" results={mockResults} />)
    expect(screen.getByText(/2025\.03\.01/)).toBeInTheDocument()
  })

  it('빈 결과 배열도 에러 없이 렌더링된다', () => {
    const { container } = render(
      <RaceResultTable rcNo="1" meetName="서울" results={[]} />,
    )
    expect(container.querySelector('.race-table-card')).toBeInTheDocument()
    // 데이터 행 없이 헤더만 존재
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1) // header only
  })
})
