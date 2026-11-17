import { rankById } from '../data'
import { useGame } from '../store/game'
import { Button, Card, Screen } from '../ui'

const MILESTONES = ['신입', '시니어', '리드', 'CTO', '은퇴']

export function TitleScreen({ onNew, onContinue }: { onNew: () => void; onContinue: () => void }) {
  const game = useGame((s) => s.game)
  const reset = useGame((s) => s.reset)
  const resumable = game && game.phase !== 'retired'

  return (
    <Screen
      footer={
        <div className="flex flex-col gap-2">
          {resumable && <Button onClick={onContinue}>이어하기</Button>}
          <Button
            variant={resumable ? 'secondary' : 'primary'}
            onClick={() => {
              reset()
              onNew()
            }}
          >
            새로운 커리어 시작하기
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 pt-6">
        <p className="text-sm text-gray-500">신입 첫 출근, 모니터 앞에서 시작해요</p>
        <h1 className="text-4xl font-extrabold leading-tight">
          커밋에서
          <br />
          은퇴까지
        </h1>
        <p className="text-gray-600">
          한 해의 선택이 쌓여 커리어가 돼요.
          <br />
          야근, 레거시, 이직, 그리고 CTO까지 도전해 보세요.
        </p>
      </div>

      <Card className="flex flex-col items-center gap-5 py-8">
        <span className="text-6xl">💻</span>
        <div className="flex w-full items-center justify-between px-2">
          {MILESTONES.map((m, i) => (
            <div key={m} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? 'bg-transparent' : 'bg-blue-200'}`} />
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className={`h-0.5 flex-1 ${i === MILESTONES.length - 1 ? 'bg-transparent' : 'bg-blue-200'}`} />
              </div>
              <span className="text-xs text-gray-500">{m}</span>
            </div>
          ))}
        </div>
      </Card>

      {resumable && (
        <Card>
          <p className="text-sm text-gray-500">저장된 커리어</p>
          <p className="font-semibold">
            {game.profile.emoji} {game.profile.name} · {game.age}세 · {rankById[game.rank].label} · {game.company.name}
          </p>
        </Card>
      )}
    </Screen>
  )
}
