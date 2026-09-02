import { SquadProvider } from './SquadContext'
import DraftBoard from './DraftBoard'
import SquadSummary from './SquadSummary'

function App() {
    return (
        <SquadProvider>
            <DraftBoard />
            <SquadSummary />
        </SquadProvider>
    )
}

export default App