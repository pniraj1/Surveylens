import Constants from 'expo-constants';

// AdMob Ad Unit IDs loaded from environment (set in GitHub Secrets → app.json extra)
// Falls back to Google's official TEST IDs during development so you never see errors
const IS_DEV = __DEV__;

const TEST_IDS = {
  BANNER:       'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED:     'ca-app-pub-3940256099942544/5224354917',
};

const LIVE_IDS = {
  BANNER:       Constants.expoConfig?.extra?.admobBanner       || TEST_IDS.BANNER,
  INTERSTITIAL: Constants.expoConfig?.extra?.admobInterstitial || TEST_IDS.INTERSTITIAL,
  REWARDED:     Constants.expoConfig?.extra?.admobRewarded     || TEST_IDS.REWARDED,
};

export const AD_UNITS = IS_DEV ? TEST_IDS : LIVE_IDS;

// Show interstitial every N photos
export const INTERSTITIAL_PHOTO_INTERVAL = 10;

