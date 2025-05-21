# MeetIt

MeetIt is a cross-platform mobile app for iOS and Android that helps friends and groups organize and attend meetups together. It provides features for creating and managing meetups, inviting people, chatting, and sharing media—all in one place.

## Features

- 📅 Create and manage meetups
- 👥 Invite friends to meetups
- 💬 Group chat for each meetup
- 🖼️ Share photos and videos with meetup attendees
- 👤 User accounts with phone number verification
- 🔔 Notifications for important updates

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: PocketBase (self-hostable backend)
- **Database**: SQLite (embedded in PocketBase)

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- PocketBase (for the backend)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd app
npm install
```

3. Set up PocketBase:
   - Download PocketBase from [pocketbase.io](https://pocketbase.io/docs/)
   - Extract the executable to a directory
   - Run PocketBase:
   ```bash
   ./pocketbase serve
   ```
   - Go to `http://127.0.0.1:8090/_/` to access the admin UI
   - Create an admin account
   - Import the schema from `pocketbase/schema.json`

4. Update the PocketBase URL in the app:
   - Open `src/api/pocketbase.ts`
   - Update the URL to your PocketBase server (default is `http://127.0.0.1:8090`)

### Running the App

```bash
npm start
```

Then scan the QR code with the Expo Go app on your phone or run on an emulator:

```bash
npm run android
# or
npm run ios
```

## Project Structure

```
app/
├── assets/             # App assets (images, fonts)
├── pocketbase/         # PocketBase schema and setup files
├── src/
│   ├── api/            # API services for backend communication
│   ├── components/     # Reusable UI components
│   ├── navigation/     # Navigation setup
│   ├── screens/        # App screens
│   └── theme/          # UI theme (colors, spacing, typography)
├── App.tsx             # Main app component
└── package.json        # Dependencies and scripts
```

## Testing

To run the app in development mode with mock data and without requiring a real backend:

1. Set `MOCK_API=true` in your environment
2. Run the app normally

## Deployment

### Expo Build

You can build standalone apps for iOS and Android using Expo:

```bash
expo build:android
expo build:ios
```

### PocketBase Deployment

For production, deploy PocketBase to a server:

1. Upload the PocketBase executable to your server
2. Set up a reverse proxy (Nginx, etc.) to expose it securely
3. Update the API URL in the app to point to your production server

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [PocketBase](https://pocketbase.io/) 