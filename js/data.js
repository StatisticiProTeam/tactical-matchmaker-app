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

  // --- Sync from Server ---
  async syncFromServer() {
    try {
      // Fetch real players from server
      const pResp = await fetch('/api/players');
      if (pResp.ok) {
        const players = await pResp.json();
        this._set(this.KEYS.PLAYERS, players);
      }

      // Fetch real matches from server
      const mResp = await fetch('/api/matches');
      if (mResp.ok) {
        const matches = await mResp.json();
        this._set(this.KEYS.MATCHES, matches);
      }
    } catch (err) {
      console.log('Sync offline — using cached data');
    }
  },

  // --- Reset ---
  resetAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// Clear old seed/demo data and sync from server
localStorage.removeItem('tmm_matches');
localStorage.removeItem('tmm_ratings');
// Remove demo players (keep only real ones from server)
const oldPlayers = JSON.parse(localStorage.getItem('tmm_players') || '[]');
const realPlayers = oldPlayers.filter(p => !p.id?.startsWith('seed_'));
localStorage.setItem('tmm_players', JSON.stringify(realPlayers));

DataStore.syncFromServer();
