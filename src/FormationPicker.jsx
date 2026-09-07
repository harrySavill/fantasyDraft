import { useSquad, FORMATION_RULES } from './SquadContext'
import PlayerCard from './PlayerCard'

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']

function FormationPicker() {
    const {
        squad,
        startingCodes,
        formationCounts,
        formationLabel,
        toggleStarter,
        isValidFormation,
        locked,
        lockFormation,
        totalPoints,
        benchPlayers,
    } = useSquad()

    function handleClick(player) {
        const result = toggleStarter(player)
        if (!result.ok) alert(result.reason)
    }

    function handleLock() {
        const result = lockFormation()
        if (!result.ok) alert(result.reason)
    }

    return (
        <div className="formation-stage">
            <div className="formation-header">
                <h2>{locked ? 'Final result' : 'Pick your Starting XI'}</h2>
                <p className="formation-sub">
                    Formation <strong>{formationLabel}</strong>
                    {!locked && <> · {startingCodes.length}/11 selected — tap a player to start or bench them</>}
                    {locked && <> · bench points don't count towards your total</>}
                </p>
            </div>

            {POSITION_ORDER.map((position) => {
                const playersAtPosition = squad.filter((p) => p.position === position)
                const rule = FORMATION_RULES[position]
                return (
                    <div className="formation-row" key={position}>
                        <div className="formation-row-label">
                            <span className={`position-tag pos-${position}`}>{position}</span>
                            {!locked && (
                                <span className="formation-row-count">
                                    {formationCounts[position] || 0} starting · needs {rule.min}-{rule.max}
                                </span>
                            )}
                        </div>
                        <div className="formation-row-cards">
                            {playersAtPosition.map((player) => {
                                const isStarting = startingCodes.includes(player.player_code)
                                return (
                                    <PlayerCard
                                        key={player.player_code}
                                        player={player}
                                        showPoints={locked}
                                        selected={isStarting}
                                        disabled={locked}
                                        onClick={() => handleClick(player)}
                                        footer={
                                            <div className={`player-card-tag ${isStarting ? 'tag-starting' : 'tag-bench'}`}>
                                                {isStarting ? 'Starting' : 'Bench'}
                                            </div>
                                        }
                                    />
                                )
                            })}
                        </div>
                    </div>
                )
            })}

            {!locked ? (
                <button className="lock-formation-btn" disabled={!isValidFormation} onClick={handleLock}>
                    Lock in Starting XI
                </button>
            ) : (
                <div className="final-score">
                    <p className="final-score-label">Starting XI total</p>
                    <p className="final-score-value">{totalPoints} pts</p>
                    <p className="final-score-note">
                        On the bench: {benchPlayers.map((p) => p.web_name).join(', ')}
                    </p>
                </div>
            )}
        </div>
    )
}

export default FormationPicker