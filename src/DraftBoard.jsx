import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useSquad, POSITION_LIMITS, BUDGET } from './SquadContext'
import PlayerCard from './PlayerCard'

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']

const PRICE_BIAS_STRENGTH = 5
const FETCH_PAGE_SIZE = 1000

async function fetchAllPlayerSeasons() {
    let allRows = []
    let from = 0

    while (true) {
        const to = from + FETCH_PAGE_SIZE - 1
        const { data, error } = await supabase
            .from('player_seasons')
            .select('player_code, season, position, price, team_name, total_points, players(web_name)')
            .range(from, to)

        if (error) throw error
        if (!data || data.length === 0) break

        allRows = allRows.concat(data)
        if (data.length < FETCH_PAGE_SIZE) break
        from += FETCH_PAGE_SIZE
    }

    return allRows
}

function pickOneSeasonPerPlayer(items) {
    const byPlayer = new Map()
    for (const item of items) {
        if (!byPlayer.has(item.player_code)) byPlayer.set(item.player_code, [])
        byPlayer.get(item.player_code).push(item)
    }
    const representatives = []
    for (const seasons of byPlayer.values()) {
        const randomIndex = Math.floor(Math.random() * seasons.length)
        representatives.push(seasons[randomIndex])
    }
    return representatives
}

function weightedSample(items, weightFn, count, keyFn = (item) => item.player_code) {
    const keyed = items.map((item) => {
        const weight = Math.max(weightFn(item), 0.0001)
        const u = Math.random()
        return { item, key: Math.pow(u, 1 / weight) }
    })
    keyed.sort((a, b) => b.key - a.key)

    const seen = new Set()
    const result = []
    for (const { item } of keyed) {
        const duplicateKey = keyFn(item)
        if (seen.has(duplicateKey)) continue
        seen.add(duplicateKey)
        result.push(item)
        if (result.length === count) break
    }
    return result
}

function getCheapestPriceByPosition(pool) {
    const cheapest = {}
    for (const player of pool) {
        if (cheapest[player.position] === undefined || player.price < cheapest[player.position]) {
            cheapest[player.position] = player.price
        }
    }
    return cheapest
}

function DraftBoard() {
    const [pool, setPool] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [candidates, setCandidates] = useState([])

    const { squad, addPlayer, remainingBudget, positionCounts, teamCounts, isComplete } = useSquad()

    useEffect(() => {
        async function fetchPool() {
            try {
                const rows = await fetchAllPlayerSeasons()
                const flattened = rows.map((p) => ({ ...p, web_name: p.players.web_name }))
                setPool(flattened)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
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
        const cheapestByPosition = getCheapestPriceByPosition(pool)

        const remainingNeedsAfterThisPick = {}
        for (const position of POSITION_ORDER) {
            const filledSoFar = positionCounts[position] || 0
            const willBeFilledByThisPick = position === nextPosition ? 1 : 0
            remainingNeedsAfterThisPick[position] = Math.max(
                POSITION_LIMITS[position] - filledSoFar - willBeFilledByThisPick,
                0
            )
        }

        const minCostForFutureSlots = POSITION_ORDER.reduce((total, position) => {
            const cheapest = cheapestByPosition[position] || 0
            return total + remainingNeedsAfterThisPick[position] * cheapest
        }, 0)

        const eligible = pool.filter((player) => {
            if (player.position !== nextPosition) return false
            if (draftedCodes.has(player.player_code)) return false
            if ((teamCounts[player.team_name] || 0) >= 3) return false
            if (player.price + minCostForFutureSlots > remainingBudget) return false
            return true
        })

        const oneSeasonPerPlayer = pickOneSeasonPerPlayer(eligible)

        setCandidates(
            weightedSample(oneSeasonPerPlayer, (player) => Math.pow(player.price, PRICE_BIAS_STRENGTH), 5)
        )
    }, [nextPosition, pool, squad, remainingBudget, teamCounts, positionCounts])

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
                            key={`${player.player_code}-${player.season}`}
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