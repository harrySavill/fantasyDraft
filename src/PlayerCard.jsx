import { useState } from 'react'

function PlayerCard({
                        player,
                        showPoints = false,
                        selected = false,
                        disabled = false,
                        onClick,
                        footer,
                        variant = 'default',
                        isCaptain = false,
                        showCaptainToggle = false,
                        onCaptainClick,
                    }) {
    const [imgFailed, setImgFailed] = useState(false)
    const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.player_code}.png`

    if (variant === 'compact') {
        return (
            <div className={`player-card-compact${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}>
                {showCaptainToggle && (
                    <button
                        type="button"
                        className={`player-card-compact-captain${isCaptain ? ' is-captain' : ''}`}
                        onClick={onCaptainClick}
                        disabled={disabled}
                        aria-label={isCaptain ? `${player.web_name} is captain` : `Make ${player.web_name} captain`}
                    >
                        C
                    </button>
                )}

                <button
                    type="button"
                    className="player-card-compact-main"
                    onClick={onClick}
                    disabled={disabled}
                >
                    <div className="player-card-compact-photo">
                        {!imgFailed ? (
                            <img src={photoUrl} alt="" loading="lazy" onError={() => setImgFailed(true)} />
                        ) : (
                            <span className="player-card-compact-initials">
                                {player.web_name.slice(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <p className="player-card-compact-name">
                        {player.web_name}
                        {isCaptain && <span className="player-card-compact-c-tag"> (C)</span>}
                    </p>

                    {showPoints && (
                        <span className="player-card-compact-points">
                            {player.total_points * (isCaptain ? 2 : 1)} pts
                        </span>
                    )}
                </button>

                {footer}
            </div>
        )
    }

    return (
        <button
            type="button"
            className={`player-card pos-${player.position}${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            <div className="player-card-shine" />

            <div className="player-card-top">
                <span className="player-card-pos">{player.position}</span>
                <span className="player-card-price">£{player.price}m</span>
            </div>

            <div className="player-card-photo">
                {!imgFailed ? (
                    <img src={photoUrl} alt="" onError={() => setImgFailed(true)} />
                ) : (
                    <span className="player-card-initials">
                        {player.web_name.slice(0, 2).toUpperCase()}
                    </span>
                )}
            </div>

            <div className="player-card-body">
                <p className="player-card-name">{player.web_name}</p>
                <p className="player-card-meta">
                    {player.team_name} <span className="dot">·</span> {player.season}
                </p>
            </div>

            {showPoints && (
                <div className="player-card-points">{player.total_points} pts</div>
            )}

            {footer}
        </button>
    )
}

export default PlayerCard