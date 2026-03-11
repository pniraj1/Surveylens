# 📐 SurveyLens – Build Instructions

A professional camera app for surveyors with GPS tagging, project organization, watermarks, and AdMob ads.

---

## ✅ What You Need (Free)

| Tool | Where to get |
|------|-------------|
| Node.js (v18+) | https://nodejs.org |
| Expo CLI | Installed automatically |
| EAS CLI | `npm install -g eas-cli` |
| Expo account (free) | https://expo.dev |
| Android Studio (optional, for testing) | https://developer.android.com/studio |

---

## 🚀 Step-by-Step: Build Your AAB

### Step 1 – Install dependencies
```bash
cd surveylens
npm install
```

### Step 2 – Login to Expo
```bash
npx eas login
```
Create a free account at https://expo.dev if you don't have one.

### Step 3 – Configure your project
```bash
npx eas build:configure
```
This creates your project ID. Copy it and paste it into `app.json` under `extra.eas.projectId`.

### Step 4 – Update AdMob App ID
In `app.json`, replace `ca-app-pub-6365268430069678~XXXXXXXXXX` with your real AdMob **App ID** (found in your AdMob dashboard under App Settings).

Your Ad Unit IDs are already set in `src/constants/AdConfig.js`.

### Step 5 – Build the AAB (for Google Play)
```bash
npx eas build --platform android --profile production
```
- This uploads your code to Expo's cloud servers
- Takes ~10–15 minutes
- You'll get a download link for your `.aab` file when done
- **No need for Android Studio or local build tools**

### Step 6 – Build an APK (for direct install/testing)
```bash
npx eas build --platform android --profile preview
```
This gives you a `.apk` you can install directly on any Android phone.

---

## 📱 Test on Your Phone (Without Building)

```bash
npm install -g expo-go
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone. 

> ⚠️ Note: AdMob and camera watermarks work in the real build but may behave differently in Expo Go.

---

## 🗺️ App Screens

| Screen | What it does |
|--------|-------------|
| **Setup** | Create project with folder/subfolder |
| **Camera** | Capture photos with quality & flash controls |
| **Preview** | Review photo with metadata before saving |
| **Gallery** | Browse photos filtered by project |
| **Settings** | Toggle watermarks, quality, custom date/time |
| **Projects** | Manage all survey projects |
| **Batch** | Select multiple photos, rename, export |

---

## 💰 AdMob Configuration

| Ad Type | Placement | Unit ID |
|---------|-----------|---------|
| **Banner** | Bottom of Gallery & Settings | `ca-app-pub-6365268430069678/9574699422` |
| **Interstitial** | Every 10 photos captured | `ca-app-pub-6365268430069678/8814987800` |
| **Rewarded** | Watch to remove ads for session | `ca-app-pub-6365268430069678/6002644716` |

---

## 📂 Folder Structure

```
surveylens/
├── App.js                    ← Entry point, AdMob init
├── app.json                  ← Expo config, permissions
├── eas.json                  ← Build profiles
├── package.json
└── src/
    ├── constants/
    │   └── AdConfig.js       ← Your AdMob unit IDs
    ├── navigation/
    │   └── AppNavigator.js
    ├── screens/
    │   ├── SetupScreen.js
    │   ├── CameraScreen.js
    │   ├── PreviewScreen.js
    │   ├── GalleryScreen.js
    │   ├── SettingsScreen.js
    │   ├── ProjectsScreen.js
    │   └── BatchScreen.js
    ├── components/
    │   ├── AdBanner.js
    │   └── WatermarkOverlay.js
    └── utils/
        ├── adManager.js      ← Interstitial & rewarded logic
        ├── gpsUtils.js
        └── storageUtils.js
```

---

## ❓ Troubleshooting

**Build fails with "missing app ID"** → Make sure you replaced `~XXXXXXXXXX` in `app.json` with your real AdMob App ID.

**Camera not working in Expo Go** → This is expected. Build the APK using `eas build --profile preview` to test camera.

**GPS shows "Not available"** → Make sure location permissions are granted on the device.

**Ads not showing** → New AdMob accounts take 24–48 hours to activate. Test with AdMob test IDs first.

---

## 🔑 AdMob Test IDs (use while testing)

Replace in `AdConfig.js` during development:
```js
BANNER:       'ca-app-pub-3940256099942544/6300978111'
INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712'
REWARDED:     'ca-app-pub-3940256099942544/5224354917'
```
Switch back to your real IDs before production build.
