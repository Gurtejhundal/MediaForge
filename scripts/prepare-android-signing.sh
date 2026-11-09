#!/usr/bin/env bash
set -euo pipefail
# Never write a raw signing key/password into repository artifacts or logs.
version=$(node -p "require('./package.json').version")
if [ -n "${MEDIAFORGE_ANDROID_KEYSTORE_BASE64:-}" ]; then
  test -n "${MEDIAFORGE_ANDROID_STORE_PASSWORD:-}"
  test -n "${MEDIAFORGE_ANDROID_KEY_ALIAS:-}"
  export MEDIAFORGE_ANDROID_KEYSTORE="$RUNNER_TEMP/mediaforge-release.p12"
  printf '%s' "$MEDIAFORGE_ANDROID_KEYSTORE_BASE64" | base64 --decode > "$MEDIAFORGE_ANDROID_KEYSTORE"
  chmod 600 "$MEDIAFORGE_ANDROID_KEYSTORE"
elif [ "${GITHUB_REF:-}" = refs/heads/main ] && [ -f ".github/android-release-requests/android-v${version}.json" ]; then
  # Bootstrap is explicitly limited to the first durable-key release. Later
  # versions require the retained keystore via Actions secrets, never a new key.
  # A failed API call must not silently create another certificate. A draft can
  # be resumed only for this exact source; an existing public release is immutable.
  gh api "repos/${GITHUB_REPOSITORY}/releases?per_page=100" > "$RUNNER_TEMP/mediaforge-releases.json"
  signing_state=$(node <<'JS'
const fs = require('node:fs');
const releases = JSON.parse(fs.readFileSync(`${process.env.RUNNER_TEMP}/mediaforge-releases.json`));
if (!Array.isArray(releases) || releases.length >= 100) throw Error('Cannot safely establish first signing release state');
const existing = releases.find(release => release.tag_name === 'android-v0.3.0');
if (existing && existing.draft && existing.target_commitish !== process.env.GITHUB_SHA) {
  throw Error('Only an unpublished Android draft at this exact source may bootstrap signing');
}
console.log(existing && !existing.draft ? 'preserve' : 'bootstrap');
JS
)
  if [ "$signing_state" = preserve ]; then
    echo 'Public Android release preserved; this verification build uses an independent temporary certificate.'
    exit 0
  fi
  test "$version" = '0.3.0'
  export MEDIAFORGE_ANDROID_KEYSTORE="$RUNNER_TEMP/mediaforge-release.p12"
  export MEDIAFORGE_ANDROID_STORE_PASSWORD
  MEDIAFORGE_ANDROID_STORE_PASSWORD=$(openssl rand -hex 32)
  echo "::add-mask::$MEDIAFORGE_ANDROID_STORE_PASSWORD"
  export MEDIAFORGE_ANDROID_KEY_ALIAS=mediaforge
  keytool -genkeypair -noprompt -keystore "$MEDIAFORGE_ANDROID_KEYSTORE" -storetype PKCS12 -alias "$MEDIAFORGE_ANDROID_KEY_ALIAS" -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=MediaForge' -storepass:env MEDIAFORGE_ANDROID_STORE_PASSWORD -keypass:env MEDIAFORGE_ANDROID_STORE_PASSWORD
  chmod 600 "$MEDIAFORGE_ANDROID_KEYSTORE"
  mkdir -p android-signing-backup
  export MEDIAFORGE_ANDROID_BACKUP_ZIP="$RUNNER_TEMP/mediaforge-signing-private.zip"
  python3 <<'PY'
import os, pathlib, zipfile
with zipfile.ZipFile(os.environ['MEDIAFORGE_ANDROID_BACKUP_ZIP'], 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    archive.write(os.environ['MEDIAFORGE_ANDROID_KEYSTORE'], 'mediaforge-release.p12')
    archive.writestr('password.txt', os.environ['MEDIAFORGE_ANDROID_STORE_PASSWORD'])
pathlib.Path(os.environ['MEDIAFORGE_ANDROID_BACKUP_ZIP']).chmod(0o600)
PY
  openssl cms -encrypt -binary -aes-256-cbc -in "$MEDIAFORGE_ANDROID_BACKUP_ZIP" -outform DER -out android-signing-backup/MediaForge-Android-signing-backup.cms .github/android-backup-recovery-public.pem
  rm "$MEDIAFORGE_ANDROID_BACKUP_ZIP"
  keytool -list -v -keystore "$MEDIAFORGE_ANDROID_KEYSTORE" -storepass:env MEDIAFORGE_ANDROID_STORE_PASSWORD | sed -n '/SHA256:/p' > android-signing-backup/certificate-fingerprint.txt
  test -s android-signing-backup/certificate-fingerprint.txt
else
  echo 'Verification preview uses a temporary debug key; publication requires a durable release key.'
  exit 0
fi
{
  echo "MEDIAFORGE_ANDROID_KEYSTORE=$MEDIAFORGE_ANDROID_KEYSTORE"
  echo "MEDIAFORGE_ANDROID_STORE_PASSWORD=$MEDIAFORGE_ANDROID_STORE_PASSWORD"
  echo "MEDIAFORGE_ANDROID_KEY_ALIAS=$MEDIAFORGE_ANDROID_KEY_ALIAS"
  echo 'MEDIAFORGE_ANDROID_DURABLE_SIGNING=1'
} >> "$GITHUB_ENV"
