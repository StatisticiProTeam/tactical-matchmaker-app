// ============================================
// Express Server + Stripe Checkout Integration
// ============================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const ServerData = require('./server-data');

// Validate Stripe key exists
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_REPLACE_ME') {
    console.warn('\n⚠️  ATENȚIE: Cheia Stripe nu e configurată!');
    console.warn('   Editează fișierul .env și pune cheia ta de test de pe:');
    console.warn('   https://dashboard.stripe.com/test/apikeys\n');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Seed data on startup
ServerData.seedIfEmpty();

// ---- API Routes ----

// Get public Stripe key (for frontend)
app.get('/api/config', (req, res) => {
    res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY });
});

// Get all matches (server-side source of truth)
app.get('/api/matches', (req, res) => {
    res.json(ServerData.getMatches());
});

// Get all players (strip passwords!)
app.get('/api/players', (req, res) => {
    const players = ServerData.getPlayers().map(p => {
        const { passwordHash, ...safe } = p;
        return safe;
    });
    res.json(players);
});

// ---- Auth Routes ----

// Register a new player
app.post('/api/register', async (req, res) => {
    try {
        const { name, password, city, position, positionName, level, avatar } = req.body;

        if (!name || !password || !city || !position) {
            return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Parola trebuie să aibă minim 4 caractere' });
        }

        // Check if name already taken
        const existing = ServerData.getPlayerByName(name);
        if (existing) {
            return res.status(400).json({ error: 'Un jucător cu acest nume există deja!' });
        }

        const eloMap = { beginner: 800, intermediate: 1100, advanced: 1300, expert: 1500 };
        const passwordHash = await bcrypt.hash(password, 10);

        const player = {
            id: 'player_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
            name: name.trim(),
            city,
            position,
            positionName: positionName || position,
            elo: eloMap[level] || 1100,
            technique: 3.0,
            fairPlay: 3.0,
            fitness: 3.0,
            matchesPlayed: 0,
            avatar: avatar || '⚽',
            passwordHash,
            createdAt: new Date().toISOString(),
        };

        ServerData.savePlayer(player);

        // Return player without password
        const { passwordHash: _, ...safePlayer } = player;
        res.json(safePlayer);
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ error: 'Introdu numele și parola' });
        }

        const player = ServerData.getPlayerByName(name);
        if (!player) {
            return res.status(401).json({ error: 'Jucătorul nu a fost găsit' });
        }

        const valid = await bcrypt.compare(password, player.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Parola este incorectă' });
        }

        // Return player without password
        const { passwordHash, ...safePlayer } = player;
        res.json(safePlayer);
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Create a Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { matchId, playerId } = req.body;

        if (!matchId || !playerId) {
            return res.status(400).json({ error: 'matchId și playerId sunt obligatorii' });
        }

        const match = ServerData.getMatch(matchId);
        if (!match) {
            return res.status(404).json({ error: 'Meciul nu a fost găsit' });
        }

        const player = ServerData.getPlayer(playerId);
        if (!player) {
            return res.status(404).json({ error: 'Jucătorul nu a fost găsit' });
        }

        // Validations
        if (match.players.includes(playerId)) {
            return res.status(400).json({ error: 'Ești deja înscris în acest meci' });
        }

        if (match.players.length >= match.maxPlayers) {
            return res.status(400).json({ error: 'Meciul este plin' });
        }

        if (player.elo < match.eloMin || player.elo > match.eloMax) {
            return res.status(400).json({ error: `ELO-ul tău (${player.elo}) nu e în range-ul meciului` });
        }

        const fee = match.fee || 0;

        if (fee <= 0) {
            // Free match — just add player directly
            match.players.push(playerId);
            if (match.players.length >= match.maxPlayers) match.status = 'full';
            ServerData.saveMatch(match);
            ServerData.addPayment({
                id: 'free_' + Date.now(),
                matchId, playerId, amount: 0, status: 'free',
                createdAt: new Date().toISOString(),
            });
            return res.json({ free: true, success: true });
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'ron',
                    product_data: {
                        name: `⚽ ${match.title}`,
                        description: `Taxă înscriere: ${match.location}, ${match.city} — ${match.time}`,
                    },
                    unit_amount: fee * 100, // Stripe uses cents (bani)
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${getBaseUrl(req)}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getBaseUrl(req)}/cancel.html`,
            metadata: {
                matchId,
                playerId,
            },
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (err) {
        console.error('Stripe error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Verify payment and add player to match
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId lipsă' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Plata nu a fost finalizată' });
        }

        const { matchId, playerId } = session.metadata;
        const match = ServerData.getMatch(matchId);

        if (!match) {
            return res.status(404).json({ error: 'Meciul nu a fost găsit' });
        }

        // Check if already added (idempotent)
        if (!match.players.includes(playerId)) {
            match.players.push(playerId);
            if (match.players.length >= match.maxPlayers) match.status = 'full';
            ServerData.saveMatch(match);
        }

        // Log payment
        ServerData.addPayment({
            id: session.id,
            matchId,
            playerId,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: 'paid',
            stripeSessionId: session.id,
            createdAt: new Date().toISOString(),
        });

        const player = ServerData.getPlayer(playerId);
        res.json({
            success: true,
            matchTitle: match.title,
            playerName: player?.name,
            amount: session.amount_total / 100,
        });
    } catch (err) {
        console.error('Verify error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Create a match (server-side)
app.post('/api/matches', (req, res) => {
    try {
        const { title, city, location, date, time, maxPlayers, eloMin, eloMax, fee, createdBy } = req.body;

        if (!title || !city || !location || !date || !createdBy) {
            return res.status(400).json({ error: 'Câmpuri obligatorii lipsă' });
        }

        const match = {
            id: 'match_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
            title, city, location,
            date: new Date(date).toISOString(),
            time: time || '20:00',
            maxPlayers: maxPlayers || 10,
            players: [],
            eloMin: eloMin || 800,
            eloMax: eloMax || 1600,
            fee: fee || 0,
            status: 'open',
            createdBy,
        };

        ServerData.saveMatch(match);
        res.json(match);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper
function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    return `${proto}://${req.headers.host}`;
}

// Fallback — serve index.html for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start
app.listen(PORT, () => {
    console.log(`\n⚽ Tactical Match-Maker Server`);
    console.log(`   🌐 http://localhost:${PORT}`);
    console.log(`   💳 Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? '🔴 LIVE' : '🟡 TEST'}`);
    console.log(`   📁 Data: ${path.join(__dirname, 'data')}\n`);
});
