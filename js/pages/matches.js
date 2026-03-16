// ============================================
// Matches Page
// ============================================

const MatchesPage = {
  state: {
    cityFilter: '',
    eloMax: 2000,
    tab: 'open', // 'open' | 'my' | 'completed'
  },

  render() {
    const currentUser = DataStore.getCurrentUser();
    let allMatches = DataStore.getMatches();

    // Filter by tab
    if (this.state.tab === 'open') {
      allMatches = allMatches.filter(m => m.status === 'open');
    } else if (this.state.tab === 'my' && currentUser) {
      allMatches = allMatches.filter(m => m.players && m.players.includes(currentUser.id));
    } else if (this.state.tab === 'completed') {
      allMatches = allMatches.filter(m => m.status === 'completed');
    }

    // Filter by city
    if (this.state.cityFilter) {
      allMatches = allMatches.filter(m => m.city === this.state.cityFilter);
    }

    // Filter by ELO
    if (this.state.eloMax < 2000) {
      allMatches = allMatches.filter(m => m.eloMin <= this.state.eloMax);
    }

    // Sort by date
    allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

    const cities = [...new Set(DataStore.getMatches().map(m => m.city))].sort();

    return `
      <div class="page-content">
        <div class="container">
          <!-- Header -->
          <div class="matches-header animate-in">
            <div>
              <h1>Meciuri Disponibile ⚽</h1>
              <p>Găsește un meci pe nivelul tău sau creează-ți propriul meci</p>
            </div>
            ${currentUser ? `
              <button class="btn btn-primary" onclick="MatchesPage.showCreateMatchModal()">
                ➕ Creează Meci
              </button>
            ` : `
              <button class="btn btn-primary" onclick="App.navigate('register')">
                🚀 Înscrie-te pentru a juca
              </button>
            `}
          </div>

          <!-- Tabs -->
          <div class="tabs animate-in animate-delay-1">
            <button class="tab-btn ${this.state.tab === 'open' ? 'active' : ''}" onclick="MatchesPage.setTab('open')">🟢 Deschise</button>
            ${currentUser ? `<button class="tab-btn ${this.state.tab === 'my' ? 'active' : ''}" onclick="MatchesPage.setTab('my')">👤 Meciurile Mele</button>` : ''}
            <button class="tab-btn ${this.state.tab === 'completed' ? 'active' : ''}" onclick="MatchesPage.setTab('completed')">✅ Finalizate</button>
          </div>

          <!-- Filters -->
          <div class="matches-filters animate-in animate-delay-2" style="margin-bottom:var(--space-xl);">
            <div>
              <select class="form-select" style="width:auto;min-width:160px;" onchange="MatchesPage.filterCity(this.value)">
                <option value="">🏙️ Toate orașele</option>
                ${cities.map(c => `<option value="${c}" ${this.state.cityFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-sm);">
              <span style="font-size:0.85rem;color:var(--text-muted);white-space:nowrap;">ELO max: <strong style="color:var(--green-400);">${this.state.eloMax}</strong></span>
              <input type="range" class="range-slider" min="500" max="2000" step="50" value="${this.state.eloMax}"
                oninput="MatchesPage.filterElo(this.value)" style="width:150px;">
            </div>
          </div>

          <!-- Matches Grid -->
          ${allMatches.length > 0 ? `
            <div class="matches-grid">
              ${allMatches.map(m => Components.matchCard(m)).join('')}
            </div>
          ` : Components.emptyState(
      '🔍',
      'Niciun meci găsit',
      'Încearcă să schimbi filtrele sau creează propriul meci!',
      currentUser ? `<button class="btn btn-primary" onclick="MatchesPage.showCreateMatchModal()">➕ Creează un Meci</button>` : ''
    )}
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.state.tab = tab;
    App.renderPage();
  },

  filterCity(city) {
    this.state.cityFilter = city;
    App.renderPage();
  },

  filterElo(val) {
    this.state.eloMax = parseInt(val);
    App.renderPage();
  },

  showCreateMatchModal() {
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) return Components.toast('Trebuie să fii autentificat!', 'error');

    const cities = ['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța', 'Sibiu', 'Oradea'];

    Components.showModal('Creează un Meci ⚽', `
      <div class="form-group">
        <label class="form-label">Titlul Meciului</label>
        <input class="form-input" type="text" id="new-match-title" placeholder="ex: Meci Seară — Teren Titan">
      </div>
      <div class="form-group">
        <label class="form-label">Orașul</label>
        <select class="form-select" id="new-match-city">
          ${cities.map(c => `<option value="${c}" ${c === currentUser.city ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Locația / Teren</label>
        <input class="form-input" type="text" id="new-match-location" placeholder="ex: Teren Sintetic Titan">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input class="form-input" type="date" id="new-match-date">
        </div>
        <div class="form-group">
          <label class="form-label">Ora</label>
          <input class="form-input" type="time" id="new-match-time" value="20:00">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-md);">
        <div class="form-group">
          <label class="form-label">Nr. Jucători</label>
          <select class="form-select" id="new-match-players">
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="10" selected>10</option>
            <option value="12">12</option>
            <option value="14">14</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ELO Min</label>
          <input class="form-input" type="number" id="new-match-elomin" value="800" min="100" step="50">
        </div>
        <div class="form-group">
          <label class="form-label">ELO Max</label>
          <input class="form-input" type="number" id="new-match-elomax" value="1600" min="100" step="50">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">💰 Taxă Înscriere (RON)</label>
        <input class="form-input" type="number" id="new-match-fee" value="30" min="0" step="5" placeholder="ex: 30">
        <span style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;display:block;">Costul per jucător pentru teren + arbitru</span>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:var(--space-md);margin-top:var(--space-lg);">
        <button class="btn btn-secondary" onclick="Components.closeModal()">Anulează</button>
        <button class="btn btn-primary" onclick="MatchesPage.createMatch()">✅ Creează Meciul</button>
      </div>
    `);

    // Set default date to tomorrow
    const tomorrow = new Date(Date.now() + 86400000);
    const dateInput = document.getElementById('new-match-date');
    if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];
  },

  async createMatch() {
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) return;

    const title = document.getElementById('new-match-title')?.value;
    const city = document.getElementById('new-match-city')?.value;
    const location = document.getElementById('new-match-location')?.value;
    const date = document.getElementById('new-match-date')?.value;
    const time = document.getElementById('new-match-time')?.value;
    const maxPlayers = parseInt(document.getElementById('new-match-players')?.value) || 10;
    const eloMin = parseInt(document.getElementById('new-match-elomin')?.value) || 800;
    const eloMax = parseInt(document.getElementById('new-match-elomax')?.value) || 1600;
    const fee = parseInt(document.getElementById('new-match-fee')?.value) || 0;

    if (!title || !city || !location || !date) {
      return Components.toast('Completează toate câmpurile!', 'error');
    }

    try {
      const resp = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, city, location, date, time, maxPlayers, eloMin, eloMax, fee, createdBy: currentUser.id }),
      });

      const match = await resp.json();

      if (!resp.ok) {
        throw new Error(match.error || 'Eroare la crearea meciului');
      }

      // Sync to localStorage too
      DataStore.saveMatch(match);

      Components.closeModal();
      Components.toast('Meci creat cu succes! ⚽', 'success');
      App.renderPage();
    } catch (err) {
      Components.toast(err.message || 'Eroare la crearea meciului', 'error');
    }
  },
};
