// ============================================
// Data Layer — localStorage CRUD + Seed Data
// ============================================

const DataStore = {
  KEYS: {
    PLAYERS: 'tmm_players',
    MATCHES: 'tmm_matches',
    RATINGS: 'tmm_ratings',
    CURRENT_USER: 'tmm_current_user',
  },

  // --- Generic CRUD ---
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch { return []; }
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  _getObj(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch { return null; }
  },

  _setObj(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // --- Players ---
  getPlayers() {
    return this._get(this.KEYS.PLAYERS);
  },

  getPlayer(id) {
    return this.getPlayers().find(p => p.id === id) || null;
  },

  savePlayer(player) {
    const players = this.getPlayers();
    const idx = players.findIndex(p => p.id === player.id);
    if (idx >= 0) {
      players[idx] = player;
    } else {
      players.push(player);
    }
    this._set(this.KEYS.PLAYERS, players);
    return player;
  },

  getPlayersByCity(city) {
    return this.getPlayers().filter(p =>
      p.city.toLowerCase() === city.toLowerCase()
    );
  },

  getPlayersByEloRange(min, max) {
    return this.getPlayers().filter(p => p.elo >= min && p.elo <= max);
  },

  getTopPlayers(count = 10) {
    return this.getPlayers()
      .sort((a, b) => b.elo - a.elo)
      .slice(0, count);
  },

  // --- Current User ---
  getCurrentUser() {
    // Check localStorage first (remember me), then sessionStorage (session only)
    let id = this._getObj(this.KEYS.CURRENT_USER);
    if (!id) {
      try { id = JSON.parse(sessionStorage.getItem(this.KEYS.CURRENT_USER)) || null; } catch { id = null; }
    }
    return id ? this.getPlayer(id) : null;
  },

  setCurrentUser(id, remember = false) {
    if (remember) {
      // Save in localStorage — persists forever
      this._setObj(this.KEYS.CURRENT_USER, id);
    } else {
      // Save in sessionStorage — clears when browser closes
      sessionStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(id));
    }
  },

  logout() {
    localStorage.removeItem(this.KEYS.CURRENT_USER);
    sessionStorage.removeItem(this.KEYS.CURRENT_USER);
  },

  // --- Matches ---
  getMatches() {
    return this._get(this.KEYS.MATCHES);
  },

  getMatch(id) {
    return this.getMatches().find(m => m.id === id) || null;
  },

  saveMatch(match) {
    const matches = this.getMatches();
    const idx = matches.findIndex(m => m.id === match.id);
    if (idx >= 0) {
      matches[idx] = match;
    } else {
      matches.push(match);
    }
    this._set(this.KEYS.MATCHES, matches);
    return match;
  },

  getMatchesByCity(city) {
    return this.getMatches().filter(m =>
      m.city.toLowerCase() === city.toLowerCase()
    );
  },

  getMatchesByPlayer(playerId) {
    return this.getMatches().filter(m =>
      m.players && m.players.includes(playerId)
    );
  },

  // --- Ratings ---
  getRatings() {
    return this._get(this.KEYS.RATINGS);
  },

  addRating(rating) {
    const ratings = this.getRatings();
    ratings.push(rating);
    this._set(this.KEYS.RATINGS, ratings);
    return rating;
  },

  getRatingsForPlayer(playerId) {
    return this.getRatings().filter(r => r.targetId === playerId);
  },

  hasRated(matchId, raterId, targetId) {
    return this.getRatings().some(r =>
      r.matchId === matchId && r.raterId === raterId && r.targetId === targetId
    );
  },

  // --- Utilities ---
  generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  },

  // --- Seed Data ---
  seedIfEmpty() {
    if (this.getPlayers().length > 0) return;

    const cities = ['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța'];
    const positions = ['GK', 'DEF', 'MID', 'ATK'];
    const positionNames = { GK: 'Portar', DEF: 'Fundaș', MID: 'Mijlocaș', ATK: 'Atacant' };

    const seedPlayers = [
      { name: 'Andrei Popescu', city: cities[0], position: 'ATK', elo: 1420, technique: 4.5, fairPlay: 4.2, fitness: 3.8, matchesPlayed: 47, avatar: '⚡' },
      { name: 'Mihai Ionescu', city: cities[0], position: 'MID', elo: 1350, technique: 4.2, fairPlay: 4.8, fitness: 4.0, matchesPlayed: 35, avatar: '🎯' },
      { name: 'Vlad Dumitrescu', city: cities[0], position: 'DEF', elo: 1180, technique: 3.5, fairPlay: 4.5, fitness: 4.3, matchesPlayed: 28, avatar: '🛡️' },
      { name: 'Alexandru Marin', city: cities[1], position: 'ATK', elo: 1540, technique: 4.8, fairPlay: 4.0, fitness: 4.5, matchesPlayed: 62, avatar: '🔥' },
      { name: 'Daniel Popa', city: cities[1], position: 'GK', elo: 1280, technique: 3.8, fairPlay: 4.6, fitness: 4.1, matchesPlayed: 41, avatar: '🧤' },
      { name: 'Cristian Stan', city: cities[1], position: 'MID', elo: 1620, technique: 4.9, fairPlay: 4.3, fitness: 4.7, matchesPlayed: 78, avatar: '💎' },
      { name: 'Florin Gheorghe', city: cities[2], position: 'DEF', elo: 1050, technique: 3.2, fairPlay: 4.7, fitness: 3.5, matchesPlayed: 15, avatar: '🏃' },
      { name: 'Radu Stoica', city: cities[2], position: 'ATK', elo: 990, technique: 3.0, fairPlay: 3.8, fitness: 3.2, matchesPlayed: 12, avatar: '⭐' },
      { name: 'George Nistor', city: cities[3], position: 'MID', elo: 1150, technique: 3.6, fairPlay: 4.1, fitness: 3.9, matchesPlayed: 22, avatar: '🌟' },
      { name: 'Bogdan Matei', city: cities[3], position: 'GK', elo: 1320, technique: 3.9, fairPlay: 4.4, fitness: 4.2, matchesPlayed: 38, avatar: '🧱' },
      { name: 'Sorin Dobre', city: cities[4], position: 'ATK', elo: 1480, technique: 4.6, fairPlay: 3.9, fitness: 4.4, matchesPlayed: 55, avatar: '🚀' },
      { name: 'Adrian Moldovan', city: cities[5], position: 'DEF', elo: 1100, technique: 3.4, fairPlay: 4.8, fitness: 3.7, matchesPlayed: 19, avatar: '🦁' },
    ];

    seedPlayers.forEach((p, i) => {
      this.savePlayer({
        id: `seed_${i}`,
        ...p,
        positionName: positionNames[p.position],
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });

    // Seed some matches
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    const seedMatches = [
      {
        id: 'match_1',
        title: 'Meci Seară — Teren Sintetic Titan',
        city: cities[0],
        location: 'Teren Sintetic Titan',
        date: new Date(now + 2 * day).toISOString(),
        time: '20:00',
        maxPlayers: 10,
        players: ['seed_0', 'seed_1', 'seed_2'],
        eloMin: 1000,
        eloMax: 1500,
        fee: 30,
        status: 'open',
        createdBy: 'seed_0',
      },
      {
        id: 'match_2',
        title: 'Fotbal Weekend — Parcul Central',
        city: cities[1],
        location: 'Teren Sintetic Parcul Central',
        date: new Date(now + 3 * day).toISOString(),
        time: '18:00',
        maxPlayers: 14,
        players: ['seed_3', 'seed_4', 'seed_5'],
        eloMin: 1200,
        eloMax: 1700,
        fee: 40,
        status: 'open',
        createdBy: 'seed_3',
      },
      {
        id: 'match_3',
        title: 'Meci Prietenos — Arena Sport',
        city: cities[2],
        location: 'Arena Sport Timișoara',
        date: new Date(now + 1 * day).toISOString(),
        time: '19:30',
        maxPlayers: 10,
        players: ['seed_6', 'seed_7'],
        eloMin: 800,
        eloMax: 1200,
        fee: 25,
        status: 'open',
        createdBy: 'seed_6',
      },
      {
        id: 'match_4',
        title: 'Liga Amatorilor — Etapa 5',
        city: cities[0],
        location: 'Complex Sportiv Ghencea',
        date: new Date(now - 2 * day).toISOString(),
        time: '21:00',
        maxPlayers: 10,
        players: ['seed_0', 'seed_1', 'seed_2', 'seed_3', 'seed_4', 'seed_5', 'seed_6', 'seed_7', 'seed_8', 'seed_9'],
        eloMin: 900,
        eloMax: 1600,
        fee: 35,
        status: 'completed',
        createdBy: 'seed_1',
      },
      {
        id: 'match_5',
        title: 'Meci Relaxat — Teren Herăstrău',
        city: cities[0],
        location: 'Teren Sintetic Herăstrău',
        date: new Date(now + 5 * day).toISOString(),
        time: '17:00',
        maxPlayers: 10,
        players: ['seed_0'],
        eloMin: 1100,
        eloMax: 1500,
        fee: 30,
        status: 'open',
        createdBy: 'seed_0',
      },
    ];

    seedMatches.forEach(m => this.saveMatch(m));

    // Seed some ratings for the completed match
    const ratingPairs = [
      { raterId: 'seed_0', targetId: 'seed_1' },
      { raterId: 'seed_1', targetId: 'seed_0' },
      { raterId: 'seed_2', targetId: 'seed_0' },
      { raterId: 'seed_3', targetId: 'seed_4' },
    ];

    ratingPairs.forEach(rp => {
      this.addRating({
        id: this.generateId(),
        matchId: 'match_4',
        ...rp,
        technique: 3 + Math.floor(Math.random() * 3),
        fairPlay: 3 + Math.floor(Math.random() * 3),
        fitness: 3 + Math.floor(Math.random() * 3),
        createdAt: new Date(now - 2 * day).toISOString(),
      });
    });
  },

  // --- Reset ---
  resetAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// Initialize seed data
DataStore.seedIfEmpty();
