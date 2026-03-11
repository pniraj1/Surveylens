#!/bin/bash
# Run this ONCE on your own computer to generate your signing keystore
# Keep the output values - you need them to set GitHub Secrets

echo "=== SurveyLens Keystore Generator ==="
echo ""

# Generate keystore
keytool -genkeypair \
  -v \
  -keystore surveylens-release.keystore \
  -alias surveylens \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=SurveyLens, OU=App, O=SurveyLens, L=City, S=State, C=US"

echo ""
echo "=== Now encode it for GitHub ==="
BASE64=$(base64 -i surveylens-release.keystore)
echo ""
echo "Copy these into GitHub → Settings → Secrets → Actions → New repository secret:"
echo ""
echo "Secret name: ANDROID_KEYSTORE_BASE64"
echo "Secret value: (the long base64 string below)"
echo "---"
echo "$BASE64"
echo "---"
echo ""
echo "Secret name: ANDROID_KEY_ALIAS"
echo "Secret value: surveylens"
echo ""
echo "Secret name: ANDROID_STORE_PASSWORD"
echo "Secret value: (the password you just entered for the keystore)"
echo ""
echo "Secret name: ANDROID_KEY_PASSWORD"
echo "Secret value: (the password you entered for the key)"
echo ""
echo "=== IMPORTANT: Save surveylens-release.keystore somewhere safe ==="
echo "If you lose it, you can NEVER update your app on Google Play"
