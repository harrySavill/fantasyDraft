import { useEffect } from 'react'

const GOAL_POINTS = { GK: 6, DEF: 6, MID: 5, FWD: 4 }
const CLEAN_SHEET_POINTS = { GK: 4, DEF: 4, MID: 1, FWD: 0 }

function estimateAppearancePoints(minutes) {
    if (!minutes || minutes <= 0) return 0
    const fullGames = Math.floor(minutes / 90)
    const remainder = minutes % 90
    return fullGames * 2 + (remainder > 0 ? 1 : 0)
}

function buildRows(player) {
    const pos = player.position
    const rows = []
    const has = (field) => player[field] !== undefined && player[field] !== null

    if (has('goals_scored') && player.goals_scored > 0) {
        rows.push({
            key: 'goals',
            icon: '⚽',
            label: 'Goals',
            count: `${player.goals_scored} × ${GOAL_POINTS[pos] ?? 4}pts`,
            points: player.goals_scored * (GOAL_POINTS[pos] ?? 4),
        })
    }

    if (has('assists') && player.assists > 0) {
        rows.push({
            key: 'assists',
            icon: '🎯',
            label: 'Assists',
            count: `${player.assists} × 3pts`,
            points: player.assists * 3,
        })
    }

    if ((pos === 'GK' || pos === 'DEF' || pos === 'MID') && has('clean_sheets') && player.clean_sheets > 0) {
        const per = CLEAN_SHEET_POINTS[pos] ?? 0
        if (per > 0) {
            rows.push({
                key: 'clean_sheets',
                icon: '🧤',
                label: 'Clean sheets',
                count: `${player.clean_sheets} × ${per}pts`,
                points: player.clean_sheets * per,
            })
        }
    }

    if ((pos === 'GK' || pos === 'DEF') && has('goals_conceded') && player.goals_conceded > 0) {
        const penalty = Math.floor(player.goals_conceded / 2)
        if (penalty > 0) {
            rows.push({
                key: 'goals_conceded',
                icon: '🥅',
                label: 'Goals conceded',
                count: `${player.goals_conceded} conceded`,
                points: -penalty,
            })
        }
    }

    if (pos === 'GK' && has('saves') && player.saves > 0) {
        const savePts = Math.floor(player.saves / 3)
        if (savePts > 0) {
            rows.push({
                key: 'saves',
                icon: '🧱',
                label: 'Saves',
                count: `${player.saves} saves`,
                points: savePts,
            })
        }
    }

    if (has('penalties_saved') && player.penalties_saved > 0) {
        rows.push({
            key: 'pen_saved',
            icon: '🛑',
            label: 'Penalties saved',
            count: `${player.penalties_saved} × 5pts`,
            points: player.penalties_saved * 5,
        })
    }

    if (has('bonus') && player.bonus > 0) {
        rows.push({
            key: 'bonus',
            icon: '⭐',
            label: 'Bonus points',
            count: `${player.bonus} bonus`,
            points: player.bonus,
        })
    }

    if (has('penalties_missed') && player.penalties_missed > 0) {
        rows.push({
            key: 'pen_missed',
            icon: '✗',
            label: 'Penalties missed',
            count: `${player.penalties_missed} × -2pts`,
            points: -player.penalties_missed * 2,
        })
    }

    if (has('own_goals') && player.own_goals > 0) {
        rows.push({
            key: 'own_goals',
            icon: '❌',
            label: 'Own goals',
            count: `${player.own_goals} × -2pts`,
            points: -player.own_goals * 2,
        })
    }

    if (has('yellow_cards') && player.yellow_cards > 0) {
        rows.push({
            key: 'yellow',
            icon: '🟨',
            label: 'Yellow cards',
            count: `${player.yellow_cards} × -1pt`,
            points: -player.yellow_cards,
        })
    }

    if (has('red_cards') && player.red_cards > 0) {
        rows.push({
            key: 'red',
            icon: '🟥',
            label: 'Red cards',
            count: `${player.red_cards} × -3pts`,
            points: -player.red_cards * 3,
        })
    }

    if (has('minutes')) {
        const appearancePoints = estimateAppearancePoints(player.minutes)
        rows.push({
            key: 'appearances',
            icon: '👟',
            label: 'Appearances',
            count: `${player.minutes} mins played`,
            points: appearancePoints,
        })
    }

    const itemisedTotal = rows.reduce((sum, r) => sum + r.points, 0)
    const total = player.total_points || 0
    const remainder = total - itemisedTotal

    if (remainder !== 0) {
        rows.push({
            key: 'other',
            icon: '❔',
            label: 'Other adjustments',
            count: 'rounding & rule variations',
            points: remainder,
        })
    }

    rows.sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    return { rows, total }
}

function PointsBreakdown({ player, onClose }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        function handleKey(e) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleKey)
        }
    }, [onClose])

    if (!player) return null

    const { rows, total } = buildRows(player)
    const maxAbs = Math.max(...rows.map((r) => Math.abs(r.points)), 1)
    const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.player_code}.png`

    return (
        <div className="breakdown-backdrop" onClick={onClose}>
            <div
                className="breakdown-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Points breakdown for ${player.web_name}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="breakdown-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>

                <div className="breakdown-header">
                    <div className="breakdown-photo">
                        <img src={photoUrl} alt="" onError={(e) => { e.target.style.display = 'none' }} />
                    </div>
                    <div>
                        <span className={`position-tag pos-${player.position} small`}>{player.position}</span>
                        <h3>{player.web_name}</h3>
                        <p>{player.team_name} · {player.season}</p>
                    </div>
                </div>

                <div className="breakdown-total">
                    <span className="breakdown-total-label">Total points</span>
                    <span className="breakdown-total-value">{total}</span>
                </div>

                <div className="breakdown-list">
                    {rows.map((row) => (
                        <div className="breakdown-row" key={row.key}>
                            <span className="breakdown-row-icon">{row.icon}</span>
                            <div className="breakdown-row-main">
                                <div className="breakdown-row-top">
                                    <span className="breakdown-row-label">{row.label}</span>
                                    <span className={`breakdown-row-points ${row.points < 0 ? 'is-negative' : 'is-positive'}`}>
                                        {row.points > 0 ? '+' : ''}{row.points}
                                    </span>
                                </div>
                                <span className="breakdown-row-count">{row.count}</span>
                                <div className="breakdown-bar-track">
                                    <div
                                        className={`breakdown-bar-fill ${row.points < 0 ? 'is-negative' : 'is-positive'}`}
                                        style={{ width: `${(Math.abs(row.points) / maxAbs) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PointsBreakdown