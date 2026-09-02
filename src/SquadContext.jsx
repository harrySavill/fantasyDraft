import { createContext, useContext, useState } from 'react'

const SquadContext = createContext(null)

// Classic FPL squad rules
export const BUDGET = 100.0
export const SQUAD_SIZE = 15
export const POSITION_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 }
export const MAX_PER_TEAM = 3

export function SquadProvider({ children }) {
    const [squad, setSquad] = useState([])

    const spent = squad.reduce((total, p) => total + p.price, 0)
    const remainingBudget = Math.round((BUDGET - spent) * 10) / 10

    const positionCounts = squad.reduce((counts, p) => {
        counts[p.position] = (counts[p.position] || 0) + 1
        return counts
    }, {})

    const teamCounts = squad.reduce((counts, p) => {
        counts[p.team_name] = (counts[p.team_name] || 0) + 1
        return counts
    }, {})

    // Checks whether a player CAN be added, without actually adding them.
    // Returns { ok: true } or { ok: false, reason: '...' }
    function canAddPlayer(player) {
        if (squad.some((p) => p.player_code === player.player_code)) {
            return { ok: false, reason: 'Already in your squad' }
        }

        if (squad.length >= SQUAD_SIZE) {
            return { ok: false, reason: 'Squad is full (15 players)' }
        }

        const positionLimit = POSITION_LIMITS[player.position]
        const currentAtPosition = positionCounts[player.position] || 0
        if (currentAtPosition >= positionLimit) {
            return { ok: false, reason: `Already have ${positionLimit} ${player.position}s` }
        }

        const currentAtTeam = teamCounts[player.team_name] || 0
        if (currentAtTeam >= MAX_PER_TEAM) {
            return { ok: false, reason: `Already have ${MAX_PER_TEAM} players from ${player.team_name}` }
        }

        if (player.price > remainingBudget) {
            return { ok: false, reason: `Not enough budget (£${remainingBudget}m left)` }
        }

        return { ok: true }
    }

    function addPlayer(player) {
        const check = canAddPlayer(player)
        if (!check.ok) return check

        setSquad((current) => [...current, player])
        return { ok: true }
    }

    function removePlayer(playerCode) {
        setSquad((current) => current.filter((p) => p.player_code !== playerCode))
    }

    const isComplete =
        squad.length === SQUAD_SIZE &&
        Object.entries(POSITION_LIMITS).every(
            ([position, limit]) => (positionCounts[position] || 0) === limit
        )

    const value = {
        squad,
        spent,
        remainingBudget,
        positionCounts,
        teamCounts,
        canAddPlayer,
        addPlayer,
        removePlayer,
        isComplete,
    }

    return <SquadContext.Provider value={value}>{children}</SquadContext.Provider>
}

// Custom hook so components just call useSquad() instead of importing
// useContext + SquadContext everywhere
export function useSquad() {
    const context = useContext(SquadContext)
    if (!context) {
        throw new Error('useSquad must be used inside a SquadProvider')
    }
    return context
}