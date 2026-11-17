import { currentEvent, type GameState } from '../engine'
import { useGame } from '../store/game'
import { Badge, Button, Choice, Screen, StatusHeader } from '../ui'

const TONE_LABEL = {
  lucky: { text: '운이 좋았어요', tone: 'green' },
  unlucky: { text: '운이 나빴어요', tone: 'red' },
  skill: { text: '실력으로 해냈어요', tone: 'blue' },
} as const

export function EventScreen({ game }: { game: GameState }) {
  const lastOutcome = useGame((s) => s.lastOutcome)
  const choose = useGame((s) => s.choose)
  const continueAfterOutcome = useGame((s) => s.continueAfterOutcome)

  // 결과 문구 보여주기
  if (lastOutcome) {
    const tone = lastOutcome.tone ? TONE_LABEL[lastOutcome.tone] : null
    const remaining = game.pendingEvents.length
    return (
      <Screen footer={<Button onClick={continueAfterOutcome}>{remaining > 0 ? '다음 일' : '올해 마무리하기'}</Button>}>
        <StatusHeader game={game} />
        <div className="flex flex-1 flex-col justify-center gap-4 py-8 text-center">
          {tone && (
            <div>
              <Badge tone={tone.tone}>{tone.text}</Badge>
            </div>
          )}
          <p className="text-xl font-semibold leading-relaxed">{lastOutcome.text}</p>
        </div>
      </Screen>
    )
  }

  const event = currentEvent(game)
  if (!event) {
    // 이벤트가 하나도 안 뽑힌 해
    return (
      <Screen footer={<Button onClick={continueAfterOutcome}>올해 마무리하기</Button>}>
        <StatusHeader game={game} />
        <p className="py-12 text-center text-lg text-gray-600">조용히 지나간 한 해였어요.</p>
      </Screen>
    )
  }

  return (
    <Screen>
      <StatusHeader game={game} />

      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center gap-2">
          <Badge>{event.category}</Badge>
          <span className="text-xs text-gray-400">올해 남은 일 {game.pendingEvents.length}개</span>
        </div>
        <p className="text-5xl">{event.emoji}</p>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="leading-relaxed text-gray-700">{event.text}</p>
      </div>

      <div className="flex flex-col gap-2">
        {event.choices.map((c, i) => (
          <Choice key={c.label} onClick={() => choose(i)}>
            <p className="font-semibold">{c.label}</p>
          </Choice>
        ))}
      </div>
    </Screen>
  )
}
