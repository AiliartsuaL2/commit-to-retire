import { BURNOUT_RESET_STAMINA, BURNOUTS_TO_RETIRE, events, platformLabels, rankById } from '../data'
import { formatSalary, type FeedPlatform, type FeedTrigger, type GameState, type Grade } from '../engine'
import { useGame } from '../store/game'
import { Badge, Button, Card, Screen, StatBars } from '../ui'

const GRADE_STYLE: Record<Grade, string> = {
  S: 'text-amber-500',
  A: 'text-blue-500',
  B: 'text-gray-800',
  C: 'text-gray-500',
  D: 'text-red-500',
}

const TRIGGER_BADGE: Record<FeedTrigger, { text: string; tone: 'blue' | 'red' | 'green' | 'amber' | 'gray' }> = {
  promoted: { text: '🎉 승진', tone: 'blue' },
  jobChanged: { text: '💼 이직', tone: 'gray' },
  burnout: { text: '🫠 번아웃', tone: 'red' },
  companyClosed: { text: '🪦 회사 폐업', tone: 'red' },
  layoff: { text: '📉 권고사직', tone: 'red' },
  exit: { text: '💰 엑싯', tone: 'green' },
  incident: { text: '🚨 장애', tone: 'amber' },
}

const PLATFORM_STYLE: Record<FeedPlatform, string> = {
  blinder: 'bg-rose-500',
  okko: 'bg-indigo-500',
  jobplanet: 'bg-emerald-500',
  linkedout: 'bg-sky-600',
  github: 'bg-gray-800',
}

const eventTitle = Object.fromEntries(events.map((e) => [e.id, `${e.emoji} ${e.title}`]))

export function YearEndScreen({ game }: { game: GameState }) {
  const acknowledge = useGame((s) => s.acknowledgeYear)
  const record = game.history[game.history.length - 1]
  const raise = record.salaryAfter - record.salaryBefore
  const raisePct = Math.round((raise / record.salaryBefore) * 100)

  return (
    <Screen footer={<Button onClick={acknowledge}>{game.retirement ? '은퇴식으로' : '확인'}</Button>}>
      <header className="flex flex-col gap-1">
        <p className="text-sm text-gray-500">
          {record.calendarYear}년 · {record.age}세 · {rankById[record.rank].label}
        </p>
        <h1 className="text-2xl font-bold">
          올해 고과는 <span className={`text-4xl font-black ${GRADE_STYLE[record.grade]}`}>{record.grade}</span>
        </h1>
      </header>

      {record.triggers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {record.triggers.map((t) => (
            <Badge key={t} tone={TRIGGER_BADGE[t].tone}>
              {TRIGGER_BADGE[t].text}
            </Badge>
          ))}
        </div>
      )}

      {record.triggers.includes('burnout') && (
        <Card className="bg-red-50">
          <p className="font-semibold text-red-600">
            번아웃이 왔어요 ({game.counters.burnouts}/{BURNOUTS_TO_RETIRE})
          </p>
          <p className="text-sm text-red-500">
            올해 고과는 D로 처리됐고 체력은 {BURNOUT_RESET_STAMINA}에서 다시 시작해요. {BURNOUTS_TO_RETIRE}번째 번아웃이면 은퇴해요.
          </p>
        </Card>
      )}

      <Card className="flex flex-col gap-1">
        <p className="text-sm text-gray-500">연봉</p>
        <p className="text-lg font-semibold tabular-nums">
          {formatSalary(record.salaryBefore)} → {formatSalary(record.salaryAfter)}
          <span className={`ml-2 text-sm ${raise > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {raise > 0 ? `+${raisePct}%` : '동결'}
          </span>
        </p>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-gray-600">능력치 변화</p>
        <StatBars stats={record.statsAfter} before={record.statsBefore} />
      </Card>

      {record.events.length > 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-600">올해 있었던 일</p>
          {record.events.map((e) => (
            <div key={e.eventId}>
              <p className="text-sm font-semibold">{e.title ?? eventTitle[e.eventId]}</p>
              <p className="text-sm text-gray-600">{e.outcomeText}</p>
            </div>
          ))}
        </Card>
      )}

      {record.feed.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-600">커뮤니티 반응</p>
          {record.feed.map((post, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className={`rounded px-1.5 py-0.5 font-bold text-white ${PLATFORM_STYLE[post.platform]}`}>
                  {platformLabels[post.platform]}
                </span>
                <span className="text-gray-500">{post.author}</span>
              </div>
              <p className="text-sm leading-relaxed">{post.text}</p>
              <p className="mt-2 text-xs text-gray-400">♥ {post.likes}</p>
            </div>
          ))}
          <p className="text-center text-xs text-gray-400">실제 커뮤니티를 패러디한 게임 속 가상 반응이에요</p>
        </section>
      )}
    </Screen>
  )
}
