import os
import urllib.request
import urllib.error
import sys


ASSETS = [
    (
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
        os.path.join("static", "vendor", "bootstrap", "bootstrap.min.css"),
    ),
    (
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
        os.path.join("static", "vendor", "bootstrap", "bootstrap.bundle.min.js"),
    ),
]


def _download(url: str, dest_path: str) -> None:
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    try:
        with urllib.request.urlopen(url) as r:
            data = r.read()
        with open(dest_path, "wb") as f:
            f.write(data)
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
        raise RuntimeError(f"Failed to download {url} -> {dest_path}: {e}")


def main() -> None:
    root = os.path.dirname(os.path.abspath(__file__))

    failures = 0
    for url, rel_dest in ASSETS:
        abs_dest = os.path.join(root, rel_dest)
        try:
            _download(url, abs_dest)
        except RuntimeError as e:
            failures += 1
            print(str(e), file=sys.stderr)
            continue

        if not os.path.exists(abs_dest) or os.path.getsize(abs_dest) == 0:
            failures += 1
            print(f"Download produced an empty file: {rel_dest}", file=sys.stderr)
            continue

        print(f"Saved: {rel_dest} ({os.path.getsize(abs_dest)} bytes)")

    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
