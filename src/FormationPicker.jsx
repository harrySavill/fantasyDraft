import { useState } from 'react'
import { useSquad, FORMATION_RULES } from './SquadContext'
import PlayerCard from './PlayerCard'
import PointsBreakdown from './PointsBreakdown'

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
        captainCode,
        setCaptain,
    } = useSquad()

    const [breakdownPlayer, setBreakdownPlayer] = useState(null)

    function handleClick(player) {
        if (locked) {
            setBreakdownPlayer(player)
            return
        }
        const result = toggleStarter(player)
        if (!result.ok) alert(result.reason)
    }

    function handleCaptainClick(e, player) {
        e.stopPropagation()
        const result = setCaptain(player)
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
                    {!locked && <> · {startingCodes.length}/11 selected — tap a player to start or bench them, then pick a captain</>}
                    {locked && <> · bench points don't count towards your total — tap a player for their points breakdown</>}
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
                                const isCaptain = player.player_code === captainCode
                                return (
                                    <PlayerCard
                                        key={player.player_code}
                                        player={player}
                                        showPoints={locked}
                                        selected={isStarting}
                                        hint={locked ? 'Tap for breakdown' : undefined}
                                        onClick={() => handleClick(player)}
                                        footer={
                                            <>
                                                <div className={`player-card-tag ${isStarting ? 'tag-starting' : 'tag-bench'}`}>
                                                    {isStarting ? 'Starting' : 'Bench'}
                                                </div>
                                                {!locked && isStarting && (
                                                    <button
                                                        type="button"
                                                        className={`captain-btn${isCaptain ? ' is-captain' : ''}`}
                                                        onClick={(e) => handleCaptainClick(e, player)}
                                                    >
                                                        {isCaptain ? '★ Captain' : 'Make captain'}
                                                    </button>
                                                )}
                                                {locked && isCaptain && (
                                                    <div className="captain-badge">★ Captain · 2×</div>
                                                )}
                                            </>
                                        }
                                    />
                                )
                            })}
                        </div>
                    </div>
                )
            })}

            {!locked ? (
                <button className="lock-formation-btn" disabled={!isValidFormation || !captainCode} onClick={handleLock}>
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

            {breakdownPlayer && (
                <PointsBreakdown player={breakdownPlayer} onClose={() => setBreakdownPlayer(null)} />
            )}
        </div>
    )
}

export default FormationPicker