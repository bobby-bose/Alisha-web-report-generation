import socket
import threading
import os
import sys
import webbrowser

import webview
from werkzeug.serving import make_server

from main import app, db


def _get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class _ServerThread(threading.Thread):
    def __init__(self, host: str, port: int):
        super().__init__(daemon=True)
        self._server = make_server(host, port, app)

    def run(self) -> None:
        self._server.serve_forever()

    def shutdown(self) -> None:
        self._server.shutdown()


def _get_print_browser_controller() -> webbrowser.BaseBrowser | None:
    pref = os.environ.get("PRINT_BROWSER", "").strip()
    if not pref:
        return None

    key = pref.lower()
    if key in {"default", "system"}:
        return None

    if os.path.exists(pref):
        name = "preferred_print_browser"
        webbrowser.register(name, None, webbrowser.BackgroundBrowser(pref))
        return webbrowser.get(name)

    return webbrowser.get(key)


class _JsApi:
    def __init__(self) -> None:
        self._browser = _get_print_browser_controller()

    def open_print(self, url: str) -> bool:
        if self._browser is not None:
            return self._browser.open(url)
        return webbrowser.open(url)


def main() -> None:
    root = os.path.dirname(os.path.abspath(__file__))
    required_assets = [
        os.path.join(root, "static", "vendor", "bootstrap", "bootstrap.min.css"),
        os.path.join(root, "static", "vendor", "bootstrap", "bootstrap.bundle.min.js"),
    ]
    missing = [p for p in required_assets if not os.path.exists(p)]
    if missing:
        print("Missing offline UI assets.", file=sys.stderr)
        print("Run: python vendor_assets.py (once, while online)", file=sys.stderr)
        for p in missing:
            print(f"Missing: {p}", file=sys.stderr)
        raise SystemExit(1)

    with app.app_context():
        db.create_all()

    host = "127.0.0.1"
    port = _get_free_port()

    server_thread = _ServerThread(host, port)
    server_thread.start()

    js_api = _JsApi()

    window = webview.create_window(
        "Report Generation",
        f"http://{host}:{port}/",
        width=1200,
        height=800,
        resizable=True,
        js_api=js_api,
    )

    try:
        webview.start()
    finally:
        server_thread.shutdown()


if __name__ == "__main__":
    main()
