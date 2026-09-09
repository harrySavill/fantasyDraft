import { SquadProvider, useSquad } from './SquadContext'
import DraftBoard from './DraftBoard'
import SquadSummary from './SquadSummary'
import FormationPicker from './FormationPicker'

function AppContent() {
    const { isComplete } = useSquad()

    return (
        <div className={`app-shell${isComplete ? ' app-shell-formation' : ''}`}>
            <header className="app-header">
                <h1>Fantasy Draft</h1>
            </header>

            {isComplete ? (
                <FormationPicker />
            ) : (
                <div className="draft-layout">
                    <DraftBoard />
                    <SquadSummary />
                </div>
            )}
        </div>
    )
}

function App() {
    return (
        <SquadProvider>
            <AppContent />
        </SquadProvider>
    )
}

export default App