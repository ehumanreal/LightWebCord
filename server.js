require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client, GatewayIntentBits, WebhookClient } = require('discord.js');
const path = require('path');

// --- KONFIGURACJA ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Pozwala na połączenia z dowolnego adresu (np. DuckDNS)
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3002;

// --- KONFIGURACJA KANAŁÓW ---
const CHANNELS = [
    { id: process.env.DISCORD_CHANNEL_ID, name: 'test' },
    // Możesz dodać więcej kanałów tutaj:
    // { id: '123456789012345678', name: 'Inny kanał' },
    // { id: '123456789012345678', name: 'Inny kanał' },
];
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// --- SERWOWANIE STRONY ---
app.use(express.static(path.join(__dirname, 'public')));

// --- DISCORD BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,   // Potrzebne do listy użytkowników
        GatewayIntentBits.GuildPresences  // Potrzebne do statusów online
    ]
});

// Opcjonalny Webhook do wysyłania wiadomości (ładniejszy wygląd autora)
const webhookClient = WEBHOOK_URL ? new WebhookClient({ url: WEBHOOK_URL }) : null;

// Przechowywanie użytkowników WWW (socket.id -> username)
const webUsers = new Map();

client.once('clientReady', () => {
    console.log(`✅ Bot zalogowany jako: ${client.user.tag}`);
    console.log(`📡 Skonfigurowane kanały: ${CHANNELS.map(c => c.name).join(', ')}`);
});

// Przekazywanie wiadomości z Discorda na stronę WWW
client.on('messageCreate', (message) => {
    // Ignoruj boty (w tym wiadomości wysłane przez Webhooka ze strony)
    if (message.author.bot) return;
    
    // Sprawdź czy kanał jest na naszej liście
    const targetChannel = CHANNELS.find(c => c.id === message.channel.id);
    if (!targetChannel) return; // Ignoruj kanały spoza listy

    io.emit('discord_message', {
        channelId: message.channel.id, // Ważne: mówimy stronie, do którego kanału to trafiło
        user: message.author.username,
        content: message.content,
        avatar: message.author.displayAvatarURL({ size: 64 }),
        color: message.member?.displayHexColor || '#ffffff'
    });
});

// Aktualizacja listy użytkowników (gdy ktoś zmieni status na Discordzie)
client.on('presenceUpdate', () => broadcastUserList());
client.on('guildMemberAdd', () => broadcastUserList());
client.on('guildMemberRemove', () => broadcastUserList());

// Funkcja wysyłająca listę użytkowników do wszystkich
async function broadcastUserList() {
    // 1. Pobierz użytkowników z Discorda (z pierwszego serwera, na którym jest bot)
    const guild = client.guilds.cache.first();
    let discordUsers = [];
    
    if (guild) {
        // Pobieramy tylko tych co są online/idle/dnd (nie offline)
        guild.members.cache.forEach(member => {
            if (member.presence && member.presence.status !== 'offline') {
                discordUsers.push({
                    username: member.user.username,
                    status: member.presence.status, // online, idle, dnd
                    avatar: member.user.displayAvatarURL({ size: 32 }),
                    color: member.displayHexColor
                });
            }
        });
    }

    // 2. Pobierz użytkowników WWW
    const webUsersList = Array.from(webUsers.values()).map(name => ({
        username: name,
        status: 'web',
        avatar: null // Frontend wygeneruje domyślny
    }));

    io.emit('user_list_update', { discord: discordUsers, web: webUsersList });
}

// --- SOCKET.IO (KOMUNIKACJA ZE STRONĄ) ---
io.on('connection', (socket) => {
    console.log('👤 Nowy użytkownik na stronie www');

    // Wysyłamy listę kanałów nowemu użytkownikowi
    socket.emit('channel_list', CHANNELS);
    broadcastUserList(); // Odśwież listę, bo doszedł nowy socket

    // Rejestracja użytkownika (gdy wejdzie na stronę)
    socket.on('join_user', (username) => {
        webUsers.set(socket.id, username);
        broadcastUserList();
    });

    socket.on('disconnect', () => {
        webUsers.delete(socket.id);
        broadcastUserList();
    });

    // Odbieranie wiadomości ze strony i wysyłanie na Discorda
    socket.on('web_message', async (data) => {
        if (!data.message || data.message.trim() === '') return;
        
        // Aktualizuj nick w mapie (jeśli się zmienił)
        webUsers.set(socket.id, data.username);
        broadcastUserList();

        try {
            // Sprawdź czy mamy webhooka dla tego kanału (na razie obsługujemy webhook tylko dla głównego kanału z .env)
            if (webhookClient && data.channelId === process.env.DISCORD_CHANNEL_ID) {
                await webhookClient.send({
                    content: data.message,
                    username: `${data.username} (WEB)`,
                    avatarURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=random`
                });
            } else {
                // Fallback: Wersja przez Bota (dla innych kanałów lub braku webhooka)
                const channel = await client.channels.fetch(data.channelId);
                if (channel) {
                    await channel.send(`**${data.username} (WEB):** ${data.message}`);
                }
            }
        } catch (error) {
            console.error("❌ Błąd wysyłania do Discorda:", error);
        }
    });
});

// --- START ---
client.login(process.env.DISCORD_TOKEN);

server.listen(PORT, () => {
    console.log(`🚀 Serwer działa na porcie ${PORT}`);
    console.log(`🌍 Lokalnie: http://localhost:${PORT}`);
    console.log(`📡 DuckDNS: http://twoja-domena.duckdns.org:${PORT} (pamiętaj o przekierowaniu portu!)`);
});
