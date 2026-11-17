import { useState } from 'react'
import { EndingScreen } from './screens/EndingScreen'
import { EventScreen } from './screens/EventScreen'
import { HubScreen } from './screens/HubScreen'
import { SetupScreen } from './screens/SetupScreen'
import { TitleScreen } from './screens/TitleScreen'
import { YearEndScreen } from './screens/YearEndScreen'
import { YearStartScreen } from './screens/YearStartScreen'
import { useGame } from './store/game'

type View = 'title' | 'setup' | 'game'

export default function App() {
  const game = useGame((s) => s.game)
  const reset = useGame((s) => s.reset)
  const [view, setView] = useState<View>('title')

  // 새 게임이 만들어지면 바로 게임 화면으로
  const current: View = view === 'setup' && game ? 'game' : view

  if (current === 'title' || !game) {
    if (current === 'setup') return <SetupScreen onBack={() => setView('title')} />
    return <TitleScreen onNew={() => setView('setup')} onContinue={() => setView('game')} />
  }

  const startOver = () => {
    reset()
    setView('setup')
  }

  switch (game.phase) {
    case 'year_start':
      return <YearStartScreen game={game} />
    case 'event':
      return <EventScreen game={game} />
    case 'year_end':
      return <YearEndScreen game={game} />
    case 'hub':
      return <HubScreen game={game} />
    case 'retired':
      return <EndingScreen game={game} onNew={startOver} />
  }
}
