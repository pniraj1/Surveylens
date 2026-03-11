import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { AD_UNITS, INTERSTITIAL_PHOTO_INTERVAL } from '../constants/AdConfig';

// --- Interstitial ---
let interstitial = InterstitialAd.createForAdRequest(AD_UNITS.INTERSTITIAL, {
  requestNonPersonalizedAdsOnly: false,
});
let interstitialLoaded = false;
let photoCount = 0;

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  interstitialLoaded = true;
});
interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  interstitialLoaded = false;
  interstitial.load(); // preload next
});
interstitial.load();

export function trackPhotoTaken() {
  photoCount++;
  if (photoCount % INTERSTITIAL_PHOTO_INTERVAL === 0 && interstitialLoaded) {
    interstitial.show();
  }
}

// --- Rewarded ---
let rewarded = RewardedAd.createForAdRequest(AD_UNITS.REWARDED, {
  requestNonPersonalizedAdsOnly: false,
});
let rewardedLoaded = false;

rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
  rewardedLoaded = true;
});
rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
  rewardedLoaded = false;
  rewarded.load();
});
rewarded.load();

export function showRewardedAd(onRewarded) {
  if (rewardedLoaded) {
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onRewarded && onRewarded();
    });
    rewarded.show();
  } else {
    console.log('Rewarded ad not ready yet');
  }
}

export { rewardedLoaded };
