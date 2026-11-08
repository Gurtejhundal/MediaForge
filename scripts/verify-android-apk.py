"""Verify shipped bytes, not just a successful Gradle build. Standard library only."""
from pathlib import Path
import hashlib
import os
import re
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
apk = root / "android/app/build/outputs/apk/preview/app-preview.apk"
assets = root / "android/app/src/main/assets/public"
with zipfile.ZipFile(apk) as archive:
    assert archive.testzip() is None, "Corrupt APK ZIP"
    names = set(archive.namelist())
    checked = 0
    for file in assets.rglob("*"):
        if not file.is_file():
            continue
        relative = file.relative_to(assets).as_posix()
        assert not any(segment.startswith(".env") for segment in Path(relative).parts), "Environment file in bundle"
        member = f"assets/public/{relative}"
        assert member in names, f"Android packaging dropped required asset: {relative}"
        assert hashlib.sha256(archive.read(member)).digest() == hashlib.sha256(file.read_bytes()).digest(), member
        checked += 1
    assert any(name.startswith("assets/public/_next/static/chunks/") for name in names), "Missing Next runtime"
    assert any(name.startswith("assets/public/_next/static/media/") for name in names), "Missing bundled fonts"
    for name in ["LICENSE", "THIRD_PARTY_NOTICES.md", "THIRD_PARTY_LICENSES.txt"]:
        assert f"assets/public/licenses/{name}" in names, f"Missing license: {name}"
    assert not any(name.startswith("lib/") for name in names), "Recheck ABI claims: native libraries were added"

sdk = Path(os.environ["ANDROID_HOME"])
tools = sdk / "build-tools/35.0.0"
badging = subprocess.check_output([str(tools / "aapt2"), "dump", "badging", str(apk)], text=True)
assert "application-debuggable" not in badging, "Distributed renderer must not be debuggable"
assert re.search(r"^(?:minSdkVersion|sdkVersion):'26'$", badging, re.MULTILINE) and "targetSdkVersion:'36'" in badging
for line in badging.splitlines():
    if line.startswith("uses-permission:"):
        assert "android.permission.INTERNET" in line or "io.github.gurtejhundal.mediaforge.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION" in line, line
subprocess.run([str(tools / "apksigner"), "verify", "--verbose", "--print-certs", str(apk)], check=True)
print(f"Verified all {checked} bundled files against the APK, required runtime/fonts/licenses, permissions, signature and non-debuggable preview.")
