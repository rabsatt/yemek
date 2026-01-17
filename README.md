# Meal Tracker

A web app to track your meals, places, and calories. Build a reusable library of places and meals for quick logging, and visualize your eating patterns.

## Features

- **Quick Meal Logging**: Select from your saved places and meals, or create new ones
- **Place Library**: Save restaurants, cafes, and home with usage tracking
- **Meal Library**: Store frequently eaten meals with default calories
- **Calorie Tracking**: Monitor daily intake with visual progress
- **Insights Dashboard**: View calorie trends, home vs. eating out ratio, and top places
- **Mobile-First Design**: Works great on phones with a native app feel
- **User Authentication**: Sign in with email/password or Google
- **Cloud Sync**: Data syncs across all your devices via Firebase

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication + Firestore)
- **Charts**: Recharts
- **Hosting**: GitHub Pages
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (optional)
4. Enable **Firestore Database**:
   - Go to Firestore Database > Create database
   - Start in production mode
   - Choose a location
5. Get your config:
   - Go to Project Settings > General > Your apps
   - Click "Add app" > Web
   - Copy the config values
6. Deploy security rules:
   - Go to Firestore Database > Rules
   - Paste the contents of `firestore.rules` from this repo

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Firebase config values.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to GitHub Pages

### 1. Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/meal-tracker.git
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to your repo's Settings > Secrets and variables > Actions, and add these secrets:

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_API_KEY` | Your Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `FIREBASE_PROJECT_ID` | your-project-id |
| `FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `FIREBASE_APP_ID` | Your app ID |

### 3. Enable GitHub Pages

1. Go to Settings > Pages
2. Under "Build and deployment", select "GitHub Actions"

### 4. Deploy

Push to main branch - the GitHub Action will automatically build and deploy!

Your app will be live at: `https://YOUR_USERNAME.github.io/meal-tracker/`

### 5. Update Firebase Auth Domain

In Firebase Console > Authentication > Settings > Authorized domains, add:
- `YOUR_USERNAME.github.io`

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── log/            # Meal logging flow
│   ├── places/         # Places library
│   ├── meals/          # Meals library
│   └── insights/       # Analytics dashboard
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── layout/        # App shell, navigation
│   ├── meal-entry/    # Logging flow components
│   ├── dashboard/     # Home screen components
│   └── insights/      # Chart components
├── contexts/          # React contexts (Auth)
├── lib/               # Firebase config and Firestore functions
└── types/             # TypeScript types
```

## Firestore Data Structure

```
users/
  {userId}/
    places/
      {placeId}/
        name, type, isHome, usageCount, ...
    meals/
      {mealId}/
        name, defaultCalories, category, placeId, usageCount, ...
    entries/
      {entryId}/
        placeId, place, mealItemId, mealItem, calories, eatenAt, mealType, ...
```

## Future Enhancements

- [x] User authentication
- [ ] Calorie goal settings
- [ ] Food photo attachments
- [ ] Barcode scanning
- [ ] Health app integrations
- [ ] Meal suggestions based on history
- [ ] Offline support with service worker
