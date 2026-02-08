# LightWebCord 🌐

Lekki, przeglądarkowy klient Discorda, który pozwala na czatowanie na wybranych kanałach serwera bez konieczności logowania się na konto Discord. Idealny do szybkiej komunikacji, obsługi gości lub jako lekki interfejs na słabsze urządzenia.

## ✨ Funkcje

*   **Wielokanałowość**: Obsługa wielu kanałów z łatwym przełączaniem.
*   **Synchronizacja w czasie rzeczywistym**: Wiadomości pojawiają się natychmiast (Socket.io).
*   **Lista użytkowników**: Podgląd osób online na Discordzie oraz użytkowników na stronie WWW.
*   **Historia lokalna**: Wiadomości są zapamiętywane w przeglądarce po zmianie kanału.
*   **Formatowanie tekstu**: Obsługa pogrubienia, kursywy, kodu i linków.
*   **Ciemny motyw**: Nowoczesny wygląd wzorowany na Discordzie.
*   **Wsparcie dla DuckDNS itp**: Gotowy do działania przez internet.

## ⚙️ Wymagania

*   [Node.js](https://nodejs.org/) (wersja 16.9.0 lub nowsza)
*   Bot Discord z odpowiednimi uprawnieniami.

## 📥 Instalacja

1.  Pobierz pliki projektu.
2.  Otwórz terminal w folderze projektu.
3.  Zainstaluj wymagane biblioteki:
    ```bash
    npm install
    ```

## 🤖 Konfiguracja Bota Discord

Aby aplikacja działała poprawnie, bot musi mieć włączone **Privileged Gateway Intents** w [Discord Developer Portal](https://discord.com/developers/applications):

1.  Wejdź w zakładkę **Bot** swojej aplikacji.
2.  W sekcji **Privileged Gateway Intents** włącz:
    *   ✅ **Presence Intent** (do widzenia statusów online)
    *   ✅ **Server Members Intent** (do pobierania listy użytkowników)
    *   ✅ **Message Content Intent** (do czytania treści wiadomości)
3.  Zaproś bota na swój serwer z uprawnieniami administratora lub odpowiednimi do czytania/pisania na kanałach.

## 📝 Konfiguracja Projektu

### 1. Plik `.env`
Edytuj plik o nazwie `.env` w głównym folderze i uzupełnij go wg wzoru:

```env
DISCORD_TOKEN=twoj_token_bota
DISCORD_CHANNEL_ID=id_glownego_kanalu
PORT=3002
```

### 2. Konfiguracja Kanałów (`server.js`)
Aby dodać więcej kanałów, edytuj tablicę `CHANNELS` w pliku `server.js`:

```javascript
const CHANNELS = [
    { id: process.env.DISCORD_CHANNEL_ID, name: 'Ogólny' },
    { id: '123456789012345678', name: 'Gry' },
    { id: '987654321098765432', name: 'Muzyka' },
];
```

## 🚀 Uruchomienie

W terminalu wpisz:

```bash
npm start
```

Aplikacja będzie dostępna pod adresem:
*   Lokalnie: `http://localhost:3002`
*   W sieci: `http://twoje-ip:3002` (jeśli skonfigurowano przekierowanie portów).

## 🔒 Bezpieczeństwo

*   Aplikacja jest publicznie dostępna dla każdego, kto zna adres IP i port.
*   Nicki użytkowników WWW są oznaczone dopiskiem `(WEB)`.
*   Bot filtruje podstawowe ataki XSS przy wyświetlaniu wiadomości.