import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useSquad, POSITION_LIMITS, BUDGET } from './SquadContext'
import PlayerCard from './PlayerCard'

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']

const PRICE_BIAS_STRENGTH = 1.6

function weightedSample(items, weightFn, count) {
    const keyed = items.map((item) => {
        const weight = Math.max(weightFn(item), 0.0001)
        const u = Math.random()
        return { item, key: Math.pow(u, 1 / weight) }
    })
    keyed.sort((a, b) => b.key - a.key)
    return keyed.slice(0, count).map((k) => k.item)
}

function DraftBoard() {
    const [pool, setPool] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [candidates, setCandidates] = useState([])

    const { squad, addPlayer, remainingBudget, positionCounts, teamCounts, isComplete } = useSquad()

    useEffect(() => {
        async function fetchPool() {
            const { data, error } = await supabase
                .from('player_seasons')
                .select('player_code, season, position, price, team_name, total_points, players(web_name)')

            if (error) {
                setError(error.message)
            } else {
                const flattened = data.map((p) => ({ ...p, web_name: p.players.web_name }))
                setPool(flattened)
            }
            setLoading(false)
        }

        fetchPool()
    }, [])

    const nextPosition = POSITION_ORDER.find(
        (position) => (positionCounts[position] || 0) < POSITION_LIMITS[position]
    )

    useEffect(() => {
        if (!nextPosition || pool.length === 0) {
            setCandidates([])
            return
        }

        const draftedCodes = new Set(squad.map((p) => p.player_code))

        const eligible = pool.filter((player) => {
            if (player.position !== nextPosition) return false
            if (draftedCodes.has(player.player_code)) return false
            if (player.price > remainingBudget) return false
            if ((teamCounts[player.team_name] || 0) >= 3) return false
            return true
        })

        setCandidates(
            weightedSample(eligible, (player) => Math.pow(player.price, PRICE_BIAS_STRENGTH), 5)
        )
    }, [nextPosition, pool, squad, remainingBudget, teamCounts])

    function handleDraft(player) {
        const result = addPlayer(player)
        if (!result.ok) alert(result.reason)
    }

    if (loading) return <div className="draft-status">Loading players…</div>
    if (error) return <div className="draft-status draft-status-error">Error: {error}</div>
    if (isComplete) return null

    const budgetPct = Math.max(0, Math.min(100, (remainingBudget / BUDGET) * 100))

    return (
        <div className="draft-board">
            <div className="draft-board-header">
                <span className={`position-tag pos-${nextPosition}`}>{nextPosition}</span>
                <h2>Drafting your next {nextPosition}</h2>
                <div className="budget-meter">
                    <div className="budget-meter-fill" style={{ width: `${budgetPct}%` }} />
                    <span className="budget-meter-label">£{remainingBudget.toFixed(1)}m left</span>
                </div>
            </div>

            {candidates.length === 0 ? (
                <p className="draft-status">No valid players left for this slot (budget or club limit reached).</p>
            ) : (
                <div className="candidate-grid">
                    {candidates.map((player) => (
                        <PlayerCard
                            key={player.player_code}
                            player={player}
                            showPoints={false}
                            onClick={() => handleDraft(player)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default DraftBoard