import { useSquad, BUDGET, POSITION_LIMITS } from './SquadContext'

function SquadSummary() {
    const { squad, spent, remainingBudget, positionCounts, removePlayer, isComplete } = useSquad()

    return (
        <div>
            <h2>Your Squad ({squad.length}/15)</h2>

            <p>
                Spent: £{spent.toFixed(1)}m / £{BUDGET}m
                &nbsp;(£{remainingBudget.toFixed(1)}m remaining)
            </p>

            <ul>
                {Object.entries(POSITION_LIMITS).map(([position, limit]) => (
                    <li key={position}>
                        {position}: {positionCounts[position] || 0} / {limit}
                    </li>
                ))}
            </ul>

            {isComplete && <p><strong>Squad complete!</strong></p>}

            <ul>
                {squad.map((player) => (
                    <li key={player.player_code}>
                        {player.web_name} ({player.position}, £{player.price}m, {player.team_name})
                        <button onClick={() => removePlayer(player.player_code)}>Remove</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default SquadSummary