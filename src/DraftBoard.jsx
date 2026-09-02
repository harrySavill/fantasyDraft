import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useSquad, POSITION_LIMITS } from './SquadContext'

// Order slots get filled in
const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']

// Picks `count` random items from an array without repeats
function sampleRandom(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

function DraftBoard() {
    const [pool, setPool] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [candidates, setCandidates] = useState([])

    const { squad, addPlayer, remainingBudget, positionCounts, teamCounts, isComplete } = useSquad()

    // Load the full player pool once, on mount
    useEffect(() => {
        async function fetchPool() {
            const { data, error } = await supabase
                .from('player_seasons')
                .select('player_code, season, position, price, team_name, total_points, players(web_name)')
                .eq('season', '2023-24')

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

    // Work out which position still needs filling
    const nextPosition = POSITION_ORDER.find(
        (position) => (positionCounts[position] || 0) < POSITION_LIMITS[position]
    )

    // Whenever the squad changes (a player gets drafted) or the pool first
    // loads, generate a fresh set of 5 random candidates for the next slot
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

        setCandidates(sampleRandom(eligible, 5))
    }, [nextPosition, pool, squad, remainingBudget, teamCounts])

    function handleDraft(player) {
        const result = addPlayer(player)
        if (!result.ok) {
            alert(result.reason) // shouldn't normally happen, candidates are pre-filtered
        }
    }

    if (loading) return <p>Loading players...</p>
    if (error) return <p>Error: {error}</p>
    if (isComplete) return <p><strong>Squad complete! Draft finished.</strong></p>

    return (
        <div>
            <h2>Drafting: {nextPosition}</h2>
            <p>{remainingBudget.toFixed(1)}m remaining</p>

            {candidates.length === 0 ? (
                <p>No valid players left for this slot (budget or team limit reached).</p>
            ) : (
                <ul>
                    {candidates.map((player) => (
                        <li key={player.player_code}>
                            {player.web_name} - £{player.price}m - {player.team_name} - {player.total_points} pts
                            <button onClick={() => handleDraft(player)}>Draft</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default DraftBoard