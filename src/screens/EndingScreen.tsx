import { achievements, companyTypeById, educationById, rankById } from '../data'
import { formatSalary, type FameGrade, type GameState, type RetireReason } from '../engine'
import { Button, Card, Screen, StatBars } from '../ui'

const REASON: Record<RetireReason, string> = {
  age: '60세, 정년을 채우고 은퇴했어요',
  voluntary: '스스로 키보드를 내려놓았어요',
  burnout: '세 번째 번아웃 끝에 업계를 떠났어요',
  startup_quit: '창업 실패 후 다른 길을 찾았어요',
}

const GRADE_STYLE: Record<FameGrade, string> = {
  S: 'from-amber-300 to-amber-500',
  A: 'from-blue-400 to-blue-600',
  B: 'from-slate-400 to-slate-600',
  C: 'from-gray-300 to-gray-400',
  D: 'from-orange-300 to-red-400',
}

export function EndingScreen({ game, onNew }: { game: GameState; onNew: () => void }) {
  const r = game.retirement!
  const unlocked = new Set(game.achievements)
  const first = game.history[0]

  return (
    <Screen footer={<Button onClick={onNew}>새 인생 시작하기</Button>}>
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <span className="text-6xl">{game.profile.emoji}</span>
        <p className="text-sm text-gray-500">{REASON[r.reason]}</p>
        <div className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-5xl font-black text-white shadow-lg ${GRADE_STYLE[r.fameGrade]}`}>
          {r.fameGrade}
        </div>
        <h1 className="text-2xl font-bold">{r.title}</h1>
        <p className="text-sm text-gray-500">명성 점수 {r.fameScore}</p>
      </div>

      <Card className="grid grid-cols-2 gap-y-3 text-sm">
        <span className="text-gray-500">이름</span>
        <span className="text-right font-semibold">{game.profile.name}</span>
        <span className="text-gray-500">출발</span>
        <span className="text-right font-semibold">
          {educationById[game.profile.education].label} · {first ? companyTypeById[first.company.type].label : '-'}
        </span>
        <span className="text-gray-500">최고 직책</span>
        <span className="text-right font-semibold">{rankById[game.bestRank].label}</span>
        <span className="text-gray-500">경력</span>
        <span className="text-right font-semibold">
          {game.history.length}년 · 이직 {game.counters.jobChanges}회
        </span>
        <span className="text-gray-500">마지막 연봉</span>
        <span className="text-right font-semibold">{formatSalary(game.salary)}</span>
        <span className="text-gray-500">모은 자산</span>
        <span className="text-right font-semibold">{formatSalary(Math.max(0, game.assets))}</span>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-gray-600">최종 능력치</p>
        <StatBars stats={game.stats} />
      </Card>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-600">
          업적 {unlocked.size} / {achievements.length}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((a) => {
            const on = unlocked.has(a.id)
            return (
              <div key={a.id} className={`rounded-2xl p-3 ${on ? 'bg-amber-50' : 'bg-gray-50 opacity-40'}`}>
                <p className="text-sm font-semibold">
                  {on ? a.emoji : '🔒'} {a.title}
                </p>
                <p className="text-xs text-gray-500">{on ? a.description : '???'}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-600">커리어 연표</p>
        <Card className="flex flex-col gap-2 text-sm">
          {game.history.map((h) => (
            <div key={h.calendarYear} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-xs text-gray-400 tabular-nums">{h.calendarYear}</span>
              <span className="min-w-0 flex-1 truncate">
                {companyTypeById[h.company.type].emoji} {h.company.name} · {rankById[h.rank].label}
              </span>
              <span className="w-5 text-right font-bold">{h.grade}</span>
            </div>
          ))}
        </Card>
      </section>
    </Screen>
  )
}
