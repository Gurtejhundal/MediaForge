#!/usr/bin/env bash
set -eu
adb shell svc wifi disable
adb shell svc data disable
mkdir -p android-captures
adb shell rm -f /sdcard/Download/MediaForge-test-captures/android-qr.png /sdcard/Download/MediaForge-test-captures/android-import.png /sdcard/Download/MediaForge-test-captures/android-workbench.png
set +e
(cd android && "${MEDIAFORGE_GRADLE:-./gradlew}" :app:connectedPreviewAndroidTest --no-daemon)
result=$?
set -e
for file in android-qr.png android-import.png android-workbench.png; do
  adb exec-out cat "/sdcard/Download/MediaForge-test-captures/$file" > "android-captures/$file" || rm -f "android-captures/$file"
done
python3 - <<'PYCODE'
from pathlib import Path
for file in Path("android-captures").glob("*.png"):
    if not file.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"): file.unlink()
PYCODE
adb shell dumpsys webviewupdate > android-captures/webview-version.txt
adb logcat -d -t 300 > android-captures/logcat.txt
exit "$result"
