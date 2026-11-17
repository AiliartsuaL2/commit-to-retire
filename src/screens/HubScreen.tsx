import { useState } from 'react'
import { companyTypeById, industryById, rankById } from '../data'
import { canChooseTrack, formatSalary, type GameState } from '../engine'
import { useGame } from '../store/game'
import { Badge, Button, Card, Screen, StatBars, StatusHeader, Title } from '../ui'

export function HubScreen({ game }: { game: GameState }) {
  const { acceptOffer, declineOffers, chooseTrack, nextYear, retire } = useGame()
  const [confirmRetire, setConfirmRetire] = useState(false)

  return (
    <Screen
      footer={
        <Button onClick={nextYear} disabled={game.unemployed}>
          {game.unemployed ? '새 회사를 먼저 골라요' : `${game.calendarYear}년으로`}
        </Button>
      }
    >
      <StatusHeader game={game} />

      <Title eyebrow={`${game.careerYear - 1}년차를 마쳤어요`}>확인할 일</Title>

      {game.unemployed && (
        <Card className="bg-red-50">
          <p className="font-semibold text-red-600">회사를 떠나야 해요</p>
          <p className="text-sm text-red-500">아래 제안 중 하나를 골라야 다음 해로 갈 수 있어요.</p>
        </Card>
      )}

      {canChooseTrack(game) && (
        <Card className="flex flex-col gap-3">
          <div>
            <p className="font-semibold">🛤️ 커리어 갈림길</p>
            <p className="text-sm text-gray-500">테크리드 다음은 어느 길로 갈까요? 한 번 고르면 바꿀 수 없어요.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => chooseTrack('manager')} className="rounded-2xl bg-white p-3 text-left active:bg-gray-100">
              <p className="font-semibold">👔 매니저</p>
              <p className="text-xs text-gray-500">EM → 디렉터 → VP → CTO</p>
            </button>
            <button type="button" onClick={() => chooseTrack('ic')} className="rounded-2xl bg-white p-3 text-left active:bg-gray-100">
              <p className="font-semibold">🛠️ 엔지니어</p>
              <p className="text-xs text-gray-500">스태프 → 프린시펄 → 펠로우</p>
            </button>
          </div>
        </Card>
      )}

      {game.offers.length > 0 ? (
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-600">📨 이직 제안 {game.offers.length}건</p>
          {game.offers.map((o, i) => {
            const c = companyTypeById[o.company.type]
            const diff = o.salary - game.salary
            const diffPct = Math.round((diff / game.salary) * 100)
            const industryChange = o.company.industry !== game.company.industry
            return (
              <Card key={o.company.name} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {c.emoji} {o.company.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.label} · {industryById[o.company.industry].label} · {rankById[o.rank].label}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums">{formatSalary(o.salary)}</p>
                    <p className={`text-xs ${diff >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {diff >= 0 ? '+' : ''}
                      {diffPct}%
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.stockOption && <Badge tone="green">스톡옵션</Badge>}
                  <Badge>야근 {'🔥'.repeat(c.overtime)}</Badge>
                  {industryChange && <Badge tone="amber">업종 변경 · 도메인 일부 리셋</Badge>}
                  {game.flags.includes('mortgage') && diff < 0 && <Badge tone="red">대출 이자 주의</Badge>}
                </div>
                <Button variant="secondary" onClick={() => acceptOffer(i)}>
                  이 회사로 이직하기
                </Button>
              </Card>
            )
          })}
          {!game.unemployed && (
            <button type="button" onClick={declineOffers} className="py-2 text-sm text-gray-500">
              모두 거절하고 남기
            </button>
          )}
        </section>
      ) : (
        !game.unemployed && <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">올해는 이직 제안이 없어요.</p>
      )}

      <Card>
        <p className="mb-3 text-sm font-medium text-gray-600">능력치</p>
        <StatBars stats={game.stats} />
      </Card>

      {!game.unemployed &&
        (confirmRetire ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-gray-600">정말 은퇴할까요? 되돌릴 수 없어요.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirmRetire(false)}>
                계속 일하기
              </Button>
              <Button variant="danger" onClick={retire}>
                은퇴하기
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmRetire(true)} className="py-2 text-sm text-gray-400">
            지금 은퇴하기
          </button>
        ))}
    </Screen>
  )
}
