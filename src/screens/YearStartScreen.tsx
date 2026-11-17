import { useState } from 'react'
import { focuses } from '../data'
import type { FocusId, GameState } from '../engine'
import { useGame } from '../store/game'
import { Button, Card, Choice, Screen, StatBars, StatusHeader, Title } from '../ui'

export function YearStartScreen({ game }: { game: GameState }) {
  const startYear = useGame((s) => s.startYear)
  const [focus, setFocus] = useState<FocusId | null>(null)

  return (
    <Screen
      footer={
        <Button disabled={!focus} onClick={() => focus && startYear(focus)}>
          {game.calendarYear}년 시작하기
        </Button>
      }
    >
      <StatusHeader game={game} />

      <Title eyebrow={`${game.careerYear}년차 · ${game.calendarYear}년`}>올해는 무엇에 집중할까요?</Title>

      {game.stamina < 35 && (
        <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">체력이 바닥이에요. 이대로면 번아웃이 올 수 있어요.</p>
      )}

      <div className="flex flex-col gap-2">
        {focuses.map((f) => (
          <Choice key={f.id} selected={focus === f.id} onClick={() => setFocus(f.id)}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{f.emoji}</span>
              <div>
                <p className="font-semibold">{f.label}</p>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            </div>
          </Choice>
        ))}
      </div>

      <Card>
        <p className="mb-3 text-sm font-medium text-gray-600">능력치</p>
        <StatBars stats={game.stats} />
      </Card>
    </Screen>
  )
}
