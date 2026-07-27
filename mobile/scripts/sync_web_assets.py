#!/usr/bin/env python3
"""Copy the current static app into a mobile-owned bundle directory safely."""

from __future__ import annotations

import argparse
import base64
import shutil
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
MOBILE_ROOT = SCRIPT_DIR.parent
DEFAULT_SOURCE = MOBILE_ROOT.parent
DEFAULT_DESTINATION = MOBILE_ROOT / "ios" / "NurPismo" / "WebResources"


def ensure_mobile_destination(destination: Path) -> Path:
    destination = destination.resolve()
    mobile_root = MOBILE_ROOT.resolve()
    if destination == mobile_root or mobile_root not in destination.parents:
        raise ValueError(f"Destination must stay inside {mobile_root}")
    return destination


def reset_destination(destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for child in destination.iterdir():
        if child.is_dir() and not child.is_symlink():
            shutil.rmtree(child)
        else:
            child.unlink()


def copy_web_app(source: Path, destination: Path) -> None:
    if not (source / "index.html").is_file():
        raise FileNotFoundError(f"index.html was not found in {source}")

    reset_destination(destination)
    for child in source.iterdir():
        if child.name in {"mobile", "backend", ".git", ".github"} or child.name.startswith("."):
            continue
        target = destination / child.name
        if child.is_dir():
            shutil.copytree(child, target)
        elif child.is_file():
            shutil.copy2(child, target)


def decoded_name(encoded_file: Path, bundle_root: Path) -> Path:
    relative = encoded_file.relative_to(bundle_root)
    name_without_b64 = encoded_file.name[: -len(".b64")]
    if relative.parts and relative.parts[0] == "audio" and not name_without_b64.endswith(".mp3"):
        name_without_b64 += ".mp3"
    return encoded_file.with_name(name_without_b64)


def decode_fallbacks(destination: Path) -> None:
    for encoded_file in list(destination.rglob("*.b64")):
        decoded_file = decoded_name(encoded_file, destination)
        if not decoded_file.exists():
            compact = "".join(encoded_file.read_text(encoding="ascii").split())
            decoded_file.write_bytes(base64.b64decode(compact, validate=True))
        # Keep Base64 fallbacks in the web source tree, not in the app bundle.
        encoded_file.unlink()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--destination", type=Path, default=DEFAULT_DESTINATION)
    args = parser.parse_args()

    source = args.source.resolve()
    destination = ensure_mobile_destination(args.destination)
    copy_web_app(source, destination)
    decode_fallbacks(destination)
    print(f"Synced web app to {destination}")


if __name__ == "__main__":
    main()
