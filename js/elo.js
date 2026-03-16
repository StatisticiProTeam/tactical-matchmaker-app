// ============================================
// ELO Rating Engine
// ============================================

const ELO = {
    K_FACTOR: 32,

    // Tier definitions
    TIERS: [
        { name: 'Bronze', min: 0, max: 999, class: 'tier-bronze', icon: '🥉', color: '#cd7f32' },
        { name: 'Silver', min: 1000, max: 1199, class: 'tier-silver', icon: '🥈', color: '#c0c0c0' },
        { name: 'Gold', min: 1200, max: 1399, class: 'tier-gold', icon: '🥇', color: '#ffd700' },
        { name: 'Platinum', min: 1400, max: 1599, class: 'tier-platinum', icon: '💠', color: '#60a5fa' },
        { name: 'Diamond', min: 1600, max: 9999, class: 'tier-diamond', icon: '💎', color: '#c084fc' },
    ],

    // Get tier for ELO value
    getTier(elo) {
        return this.TIERS.find(t => elo >= t.min && elo <= t.max) || this.TIERS[0];
    },

    // Calculate expected score (probability of winning)
    expectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    },

    // Calculate new ELO after a match
    // actualScore: 1 = win, 0.5 = draw, 0 = loss
    calculateNewRating(currentRating, opponentRating, actualScore) {
        const expected = this.expectedScore(currentRating, opponentRating);
        return Math.round(currentRating + this.K_FACTOR * (actualScore - expected));
    },

    // Calculate composite rating from peer reviews
    // ratings: array of { technique, fairPlay, fitness } (each 1-5)
    calculateCompositeRating(ratings) {
        if (!ratings || ratings.length === 0) return { technique: 3, fairPlay: 3, fitness: 3, overall: 3 };

        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

        const technique = avg(ratings.map(r => r.technique));
        const fairPlay = avg(ratings.map(r => r.fairPlay));
        const fitness = avg(ratings.map(r => r.fitness));

        // Weighted: technique 40%, fairPlay 30%, fitness 30%
        const overall = technique * 0.4 + fairPlay * 0.3 + fitness * 0.3;

        return {
            technique: Math.round(technique * 10) / 10,
            fairPlay: Math.round(fairPlay * 10) / 10,
            fitness: Math.round(fitness * 10) / 10,
            overall: Math.round(overall * 10) / 10,
        };
    },

    // Update player ELO based on match peer ratings
    // Higher peer ratings → ELO goes up; lower → ELO goes down
    updatePlayerElo(player, newRatings) {
        const composite = this.calculateCompositeRating(newRatings);
        const performanceScore = composite.overall / 5; // 0-1 scale

        // Average ELO of all raters
        const avgRaterElo = newRatings.length > 0
            ? newRatings.reduce((sum, r) => {
                const rater = DataStore.getPlayer(r.raterId);
                return sum + (rater ? rater.elo : 1200);
            }, 0) / newRatings.length
            : player.elo;

        const newElo = this.calculateNewRating(player.elo, avgRaterElo, performanceScore);

        // Update player stats
        player.elo = Math.max(100, newElo); // Floor at 100
        player.technique = composite.technique;
        player.fairPlay = composite.fairPlay;
        player.fitness = composite.fitness;
        player.matchesPlayed = (player.matchesPlayed || 0) + 1;

        DataStore.savePlayer(player);
        return player;
    },

    // Get initial ELO based on self-assessment
    // level: 'beginner', 'intermediate', 'advanced', 'expert'
    getInitialElo(level) {
        const map = {
            beginner: 800,
            intermediate: 1100,
            advanced: 1300,
            expert: 1500,
        };
        return map[level] || 1000;
    },

    // Auto-balance teams based on ELO
    balanceTeams(playerIds) {
        const players = playerIds
            .map(id => DataStore.getPlayer(id))
            .filter(Boolean)
            .sort((a, b) => b.elo - a.elo);

        const teamA = [];
        const teamB = [];
        let sumA = 0;
        let sumB = 0;

        // Greedy balanced assignment
        players.forEach(p => {
            if (sumA <= sumB) {
                teamA.push(p);
                sumA += p.elo;
            } else {
                teamB.push(p);
                sumB += p.elo;
            }
        });

        return {
            teamA,
            teamB,
            avgEloA: teamA.length ? Math.round(sumA / teamA.length) : 0,
            avgEloB: teamB.length ? Math.round(sumB / teamB.length) : 0,
            difference: Math.abs(sumA - sumB),
        };
    },
};
