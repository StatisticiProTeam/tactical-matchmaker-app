// ============================================
// Reusable UI Components
// ============================================

const Components = {

  // --- Avatar Helper (photo or emoji) ---
  avatarHtml(player, size = '3rem') {
    if (player.photo) {
      return `<img src="${player.photo}" alt="${player.name}" style="width:${size};height:${size};border-radius:50%;object-fit:cover;">`;
    }
    return player.avatar || '⚽';
  },

  // --- Player Card (FIFA-style) ---
  playerCard(player, opts = {}) {
    const tier = ELO.getTier(player.elo);
    const clickable = opts.onClick ? `onclick="${opts.onClick}"` : '';
    const sizeClass = opts.small ? 'player-card-small' : '';

    return `
      <div class="player-card ${tier.class} ${sizeClass}" ${clickable} data-player-id="${player.id}">
        <div class="player-card-bg"></div>
        <div class="player-card-inner">
          <div class="card-tier">${tier.name}</div>
          <div class="card-rating">${player.elo}</div>
          <div class="card-avatar">${player.photo ? `<img src="${player.photo}" alt="${player.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (player.avatar || '⚽')}</div>
          <div class="card-name">${player.name}</div>
          <div class="card-position">${player.positionName || player.position}</div>
          <div class="card-city">📍 ${player.city}</div>
          <div class="card-stats">
            <div class="stat-item">
              <div class="stat-value">${player.technique?.toFixed(1) || '—'}</div>
              <div class="stat-label">TEC</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${player.fairPlay?.toFixed(1) || '—'}</div>
              <div class="stat-label">F-P</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${player.fitness?.toFixed(1) || '—'}</div>
              <div class="stat-label">FIZ</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // --- Star Rating Input ---
  starRating(name, category, currentValue = 0) {
    let html = `<div class="star-rating" data-category="${category}" data-name="${name}">`;
    for (let i = 5; i >= 1; i--) {
      const checked = i === currentValue ? 'checked' : '';
      html += `
        <input type="radio" id="${name}-${category}-${i}" name="${name}-${category}" value="${i}" ${checked}>
        <label for="${name}-${category}-${i}" title="${i} stele">★</label>
      `;
    }
    html += '</div>';
    return html;
  },

  // --- SVG Radar Chart ---
  radarChart(technique, fairPlay, fitness, size = 180) {
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.4;
    const labels = [
      { name: 'TEC', angle: -90 },
      { name: 'F-P', angle: 30 },
      { name: 'FIZ', angle: 150 },
    ];
    const values = [technique / 5, fairPlay / 5, fitness / 5];

    // Background hexagon layers
    let bgPaths = '';
    for (let layer = 1; layer <= 5; layer++) {
      const r = maxR * (layer / 5);
      const points = labels.map((l) => {
        const rad = (l.angle * Math.PI) / 180;
        return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
      }).join(' ');
      bgPaths += `<polygon points="${points}" fill="none" stroke="rgba(148,163,184,0.1)" stroke-width="1"/>`;
    }

    // Axis lines
    let axisLines = '';
    labels.forEach(l => {
      const rad = (l.angle * Math.PI) / 180;
      axisLines += `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(rad)}" y2="${cy + maxR * Math.sin(rad)}" stroke="rgba(148,163,184,0.15)" stroke-width="1"/>`;
    });

    // Data polygon
    const dataPoints = labels.map((l, i) => {
      const r = maxR * values[i];
      const rad = (l.angle * Math.PI) / 180;
      return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
    }).join(' ');

    // Labels
    let labelTexts = '';
    labels.forEach((l, i) => {
      const r = maxR + 18;
      const rad = (l.angle * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      labelTexts += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="Outfit">${l.name}</text>`;
    });

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="radar-chart">
        ${bgPaths}
        ${axisLines}
        <polygon points="${dataPoints}" fill="rgba(34,197,94,0.2)" stroke="#22c55e" stroke-width="2"/>
        ${labels.map((l, i) => {
      const r = maxR * values[i];
      const rad = (l.angle * Math.PI) / 180;
      return `<circle cx="${cx + r * Math.cos(rad)}" cy="${cy + r * Math.sin(rad)}" r="4" fill="#22c55e"/>`;
    }).join('')}
        ${labelTexts}
      </svg>
    `;
  },

  // --- Match Card ---
  matchCard(match) {
    const players = (match.players || []).map(id => DataStore.getPlayer(id)).filter(Boolean);
    const statusClass = match.status === 'open' ? 'badge-open' : match.status === 'full' ? 'badge-full' : 'badge-completed';
    const statusText = match.status === 'open' ? 'Deschis' : match.status === 'full' ? 'Complet' : 'Finalizat';
    const dateStr = new Date(match.date).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });

    const avatarHtml = players.slice(0, 5).map(p =>
      `<div class="mini-avatar" title="${p.name}">${p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (p.avatar || '⚽')}</div>`
    ).join('');

    const remaining = match.maxPlayers - players.length;

    return `
      <div class="match-card" data-match-id="${match.id}">
        <div class="match-header">
          <div class="match-title">${match.title}</div>
          <span class="match-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="match-details">
          <div class="match-detail">📅 ${dateStr}</div>
          <div class="match-detail">🕐 ${match.time}</div>
          <div class="match-detail">📍 ${match.location}</div>
          <div class="match-detail">🏙️ ${match.city}</div>
          ${match.ageCategory ? `<div class="match-detail">🎂 ${match.ageCategory === '5-7' ? '5–7 ani 🌟' : '7–12 ani ⚽'}</div>` : ''}
          ${match.fee ? `<div class="match-detail match-fee-badge">💰 ${match.fee} RON</div>` : ''}
        </div>
        <div class="match-players">
          <div class="player-avatars">${avatarHtml}</div>
          <span style="font-size:0.8rem;color:var(--text-secondary)">
            ${players.length}/${match.maxPlayers} jucători
            ${remaining > 0 ? `<span style="color:var(--green-400);"> — ${remaining} locuri libere</span>` : ''}
          </span>
        </div>
        <div class="match-footer">
          <div class="elo-range">ELO: ${match.eloMin} — ${match.eloMax}</div>
          ${match.status === 'open' ? `<button class="btn btn-primary btn-sm" onclick="App.joinMatch('${match.id}')">Intră în Meci</button>` : ''}
          ${match.status === 'completed' ? `<button class="btn btn-secondary btn-sm" onclick="App.navigate('rate', '${match.id}')">Notează Jucătorii</button>` : ''}
        </div>
      </div>
    `;
  },

  // --- Toast Notification ---
  toast(message, type = 'success') {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${icons[type] || '📢'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // --- Modal ---
  showModal(title, contentHtml, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'app-modal';
    overlay.innerHTML = `
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xl);">
          <h2 style="margin:0">${title}</h2>
          <button class="btn btn-icon btn-secondary" onclick="Components.closeModal()" style="font-size:1.2rem">✕</button>
        </div>
        <div class="modal-body">${contentHtml}</div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Components.closeModal();
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  },

  // --- Empty State ---
  emptyState(icon, title, subtitle, actionHtml = '') {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h3>${title}</h3>
        <p style="margin-top:var(--space-sm)">${subtitle}</p>
        ${actionHtml ? `<div style="margin-top:var(--space-lg)">${actionHtml}</div>` : ''}
      </div>
    `;
  },
};
