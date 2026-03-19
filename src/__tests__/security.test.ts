import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ──────────────────────────────────────────────
// 테스트 케이스 8: 보안 검증
// ──────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

describe('TC8: API 키 보안 검증', () => {
  it('.gitignore에 .env가 등록되어 있다', () => {
    const gitignore = readFileSync(resolve(ROOT, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('.env')
    expect(gitignore).toContain('.env.local')
  })

  it('.env.example에 실제 API 키가 포함되지 않았다', () => {
    const envExample = readFileSync(resolve(ROOT, '.env.example'), 'utf-8')
    expect(envExample).toContain('YOUR_API_KEY_HERE')
    // 실제 공공데이터 키 형식 (영숫자+특수문자 조합, 보통 50자 이상)이 없는지 확인
    expect(envExample).not.toMatch(/[A-Za-z0-9+/=]{50,}/)
  })

  it('.env 파일이 저장소에 커밋되지 않았다 (존재하지 않거나 gitignore됨)', () => {
    // .env 파일이 있더라도 .gitignore에 등록되어 있으면 OK
    const gitignore = readFileSync(resolve(ROOT, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('.env')
  })

  it('소스코드에 VITE_ 접두어 API 키 환경변수가 없다 (클라이언트 노출 방지)', () => {
    const kraApi = readFileSync(resolve(ROOT, 'src/api/kraApi.ts'), 'utf-8')
    expect(kraApi).not.toContain('VITE_KRA_API_KEY')
    expect(kraApi).not.toContain('import.meta.env')
  })

  it('API 서비스가 프록시 경로(/api/kra)를 사용한다 (직접 외부 URL 호출 안 함)', () => {
    const kraApi = readFileSync(resolve(ROOT, 'src/api/kraApi.ts'), 'utf-8')
    expect(kraApi).not.toContain('apis.data.go.kr')
    expect(kraApi).toContain('/api/kra')
  })
})
