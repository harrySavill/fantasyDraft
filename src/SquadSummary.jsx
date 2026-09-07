import { useSquad, BUDGET, POSITION_LIMITS } from './SquadContext'

function SquadSummary() {
    const { squad, spent, remainingBudget, positionCounts, isComplete } = useSquad()

    return (
        <div className="squad-summary">
            <h2>Your Squad <span className="squad-summary-count">{squad.length}/15</span></h2>

            <div className="squad-summary-budget">
                <span>£{spent.toFixed(1)}m spent</span>
                <span>£{remainingBudget.toFixed(1)}m of £{BUDGET}m left</span>
            </div>

            <div className="squad-summary-positions">
                {Object.entries(POSITION_LIMITS).map(([position, limit]) => (
                    <div className="squad-summary-position" key={position}>
                        <span className={`position-tag pos-${position}`}>{position}</span>
                        <span>{positionCounts[position] || 0} / {limit}</span>
                    </div>
                ))}
            </div>

            {isComplete && <p className="squad-summary-complete">Squad complete — pick your Starting XI below.</p>}

            <ul className="squad-summary-list">
                {squad.map((player) => (
                    <li key={player.player_code}>
                        <span className={`position-tag pos-${player.position} small`}>{player.position}</span>
                        <span className="squad-summary-name">{player.web_name}</span>
                        <span className="squad-summary-detail">£{player.price}m · {player.team_name} · {player.season}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default SquadSummary