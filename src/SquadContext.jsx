import { createContext, useContext, useState } from 'react'

const SquadContext = createContext(null)

export const BUDGET = 100.0
export const SQUAD_SIZE = 15
export const POSITION_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 }
export const MAX_PER_TEAM = 3

export const STARTING_XI_SIZE = 11
export const FORMATION_RULES = {
    GK: { min: 1, max: 1 },
    DEF: { min: 3, max: 5 },
    MID: { min: 2, max: 5 },
    FWD: { min: 1, max: 3 },
}

export function SquadProvider({ children }) {
    const [squad, setSquad] = useState([])
    const [startingCodes, setStartingCodes] = useState([])
    const [locked, setLocked] = useState(false)

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

    const isComplete =
        squad.length === SQUAD_SIZE &&
        Object.entries(POSITION_LIMITS).every(
            ([position, limit]) => (positionCounts[position] || 0) === limit
        )


    const startingPlayers = squad.filter((p) => startingCodes.includes(p.player_code))
    const benchPlayers = squad.filter((p) => !startingCodes.includes(p.player_code))

    const formationCounts = startingPlayers.reduce((counts, p) => {
        counts[p.position] = (counts[p.position] || 0) + 1
        return counts
    }, {})

    const formationLabel = ['DEF', 'MID', 'FWD']
        .map((pos) => formationCounts[pos] || 0)
        .join('-')

    function toggleStarter(player) {
        if (locked) return { ok: false, reason: 'Your starting XI is locked in' }

        const isStarting = startingCodes.includes(player.player_code)
        if (isStarting) {
            setStartingCodes((current) => current.filter((code) => code !== player.player_code))
            return { ok: true }
        }

        if (startingCodes.length >= STARTING_XI_SIZE) {
            return { ok: false, reason: 'Starting XI is already full (11 players)' }
        }
        const rule = FORMATION_RULES[player.position]
        const current = formationCounts[player.position] || 0
        if (current >= rule.max) {
            return { ok: false, reason: `A valid formation allows at most ${rule.max} ${player.position}` }
        }

        setStartingCodes((current) => [...current, player.player_code])
        return { ok: true }
    }

    const isValidFormation =
        startingCodes.length === STARTING_XI_SIZE &&
        Object.entries(FORMATION_RULES).every(([pos, rule]) => {
            const count = formationCounts[pos] || 0
            return count >= rule.min && count <= rule.max
        })

    function lockFormation() {
        if (!isValidFormation) {
            return { ok: false, reason: 'Pick a valid formation of exactly 11 players first' }
        }
        setLocked(true)
        return { ok: true }
    }

    const totalPoints = startingPlayers.reduce((total, p) => total + (p.total_points || 0), 0)

    const value = {
        squad,
        spent,
        remainingBudget,
        positionCounts,
        teamCounts,
        canAddPlayer,
        addPlayer,
        isComplete,
        startingCodes,
        startingPlayers,
        benchPlayers,
        formationCounts,
        formationLabel,
        toggleStarter,
        isValidFormation,
        locked,
        lockFormation,
        totalPoints,
    }

    return <SquadContext.Provider value={value}>{children}</SquadContext.Provider>
}

export function useSquad() {
    const context = useContext(SquadContext)
    if (!context) {
        throw new Error('useSquad must be used inside a SquadProvider')
    }
    return context
}