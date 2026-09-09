import { useState } from 'react'
import { useSquad } from './SquadContext'
import PlayerCard from './PlayerCard'
import PointsBreakdown from './PointsBreakdown'
const PITCH_ROWS = ['FWD', 'MID', 'DEF', 'GK']

function FormationPicker() {
    const {
        squad,
        startingCodes,
        startingPlayers,
        benchPlayers,
        captainCode,
        captainPlayer,
        setCaptain,
        formationLabel,
        toggleStarter,
        isValidFormation,
        locked,
        lockFormation,
        resetDraft,
        totalPoints,
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

    function handleSetCaptain(player) {
        const result = setCaptain(player.player_code)
        if (!result.ok) alert(result.reason)
    }

    function handleLock() {
        const result = lockFormation()
        if (!result.ok) alert(result.reason)
    }

    function handleRestart() {
        if (window.confirm('Start a brand new draft? This will clear your current squad and result.')) {
            resetDraft()
        }
    }

    const benchNow = locked ? benchPlayers : squad.filter((p) => !startingCodes.includes(p.player_code))
    const canLock = isValidFormation && !!captainCode

    return (
        <div className="formation-stage">
            <div className="formation-header">
                <h2>{locked ? 'Final result' : 'Pick your Starting XI'}</h2>
                <p className="formation-sub">
                    Formation <strong>{formationLabel}</strong>
                    {!locked && <> · {startingCodes.length}/11 selected — tap a player to start or bench them</>}
                    {locked && <> · bench points don't count towards your total · tap a player for their points breakdown</>}
                </p>
                {!locked && (
                    <p className="formation-sub formation-captain-hint">
                        {captainPlayer
                            ? <>Captain: <strong>{captainPlayer.web_name}</strong> (2x points) — tap the "C" badge on another starter to change</>
                            : 'Tap the "C" badge on a starter to make them captain'}
                    </p>
                )}
            </div>

            <div className="pitch">
                {PITCH_ROWS.map((position) => {
                    const playersAtPosition = startingPlayers.filter((p) => p.position === position)
                    return (
                        <div className="pitch-row" key={position}>
                            {playersAtPosition.map((player) => (
                                <PlayerCard
                                    key={player.player_code}
                                    player={player}
                                    variant="compact"
                                    showPoints={locked}
                                    selected
                                    isCaptain={player.player_code === captainCode}
                                    showCaptainToggle={!locked}
                                    onCaptainClick={() => handleSetCaptain(player)}
                                    onClick={() => handleClick(player)}
                                />
                            ))}
                        </div>
                    )
                })}
            </div>

            <div className="bench-strip">
                <p className="bench-strip-label">Bench</p>
                <div className="bench-strip-cards">
                    {benchNow.map((player) => (
                        <PlayerCard
                            key={player.player_code}
                            player={player}
                            variant="compact"
                            showPoints={locked}
                            onClick={() => handleClick(player)}
                        />
                    ))}
                </div>
            </div>

            {!locked ? (
                <button className="lock-formation-btn" disabled={!canLock} onClick={handleLock}>
                    Lock in Starting XI
                </button>
            ) : (
                <div className="final-score">
                    <p className="final-score-label">Starting XI total</p>
                    <p className="final-score-value">{totalPoints} pts</p>
                    <p className="final-score-note">
                        Captain: {captainPlayer ? captainPlayer.web_name : '—'} (2x points) · On the bench: {benchPlayers.map((p) => p.web_name).join(', ')}
                    </p>
                    <button className="restart-draft-btn" onClick={handleRestart}>
                        Start New Draft
                    </button>
                </div>
            )}

            {breakdownPlayer && (
                <PointsBreakdown player={breakdownPlayer} onClose={() => setBreakdownPlayer(null)} />
            )}
        </div>
    )
}

export default FormationPicker