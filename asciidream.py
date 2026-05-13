"""
Asciidream — single-exe host.

Loads the bundled asciidream.html into a native webview window and
exposes a tiny API for save/open file dialogs. No network, no telemetry.
"""

import base64
import mimetypes
import os
import sys
import threading
import webbrowser
import webview


def resource_path(rel: str) -> str:
    """Resolve a bundled resource path, supporting PyInstaller --onefile."""
    base = getattr(sys, "_MEIPASS", None) or os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, rel)


class Api:
    """Methods called from the HTML side via window.pywebview.api.*"""

    def __init__(self):
        self._window = None

    def attach(self, window):
        self._window = window

    def quit(self):
        """Hard shutdown — destroy the window and exit the process cleanly.

        Returns nothing so the JS side doesn't sit waiting on a promise.
        """
        try:
            if self._window:
                self._window.destroy()
        except Exception:
            pass

    def minimize(self):
        try:
            if self._window:
                self._window.minimize()
        except Exception:
            pass

    def toggle_maximize(self):
        try:
            if not self._window:
                return {"maximized": False}
            new_state = not getattr(self._window, "_asciidream_maximized", False)
            if new_state:
                if hasattr(self._window, "maximize"):
                    self._window.maximize()
            else:
                if hasattr(self._window, "restore"):
                    self._window.restore()
            setattr(self._window, "_asciidream_maximized", new_state)
            return {"maximized": new_state}
        except Exception as e:
            return {"err": str(e)}

    def get_position(self):
        """Current window screen position (used by JS drag fallback)."""
        try:
            return {"x": int(self._window.x), "y": int(self._window.y)}
        except Exception:
            return {"x": 0, "y": 0}

    def move_window(self, x, y):
        """Move the window to (x, y) screen coordinates."""
        try:
            self._window.move(int(x), int(y))
        except Exception:
            pass

    def save_file(self, suggested_name, data_url, start_dir=""):
        """Save a data: URL to disk via a native Save-As dialog.

        `start_dir` opens the dialog in that folder so users don't have to
        navigate back to it every time.
        """
        try:
            head, _, payload = data_url.partition(",")
            if "base64" in head:
                blob = base64.b64decode(payload)
            else:
                from urllib.parse import unquote
                blob = unquote(payload).encode("utf-8")
            ext = os.path.splitext(suggested_name)[1].lstrip(".") or "txt"
            file_types = (
                f"{ext.upper()} (*.{ext})",
                "All files (*.*)",
            )
            path = self._window.create_file_dialog(
                webview.SAVE_DIALOG,
                directory=start_dir or "",
                save_filename=suggested_name,
                file_types=file_types,
            )
            if not path:
                return {"ok": False, "err": "cancelled"}
            if isinstance(path, (list, tuple)):
                path = path[0]
            with open(path, "wb") as f:
                f.write(blob)
            return {"ok": True, "path": path, "dirname": os.path.dirname(path)}
        except Exception as e:
            return {"ok": False, "err": str(e)}

    def open_file(self, extensions=None, start_dir=""):
        """Open a text file via native dialog; returns {path, content, dirname}."""
        try:
            extensions = extensions or ["glyph", "json", "txt"]
            file_types = (
                "Asciidream project (*." + ";*.".join(extensions) + ")",
                "All files (*.*)",
            )
            paths = self._window.create_file_dialog(
                webview.OPEN_DIALOG,
                directory=start_dir or "",
                allow_multiple=False,
                file_types=file_types,
            )
            if not paths:
                return {"ok": False, "err": "cancelled"}
            path = paths[0] if isinstance(paths, (list, tuple)) else paths
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            return {
                "ok": True,
                "path": path,
                "content": content,
                "dirname": os.path.dirname(path),
            }
        except Exception as e:
            return {"ok": False, "err": str(e)}

    def open_image(self, start_dir=""):
        """Open an image file via native dialog and return it as a data URL.

        The dialog opens in `start_dir` if given (use the result's `dirname`
        to remember where the user was last browsing).
        """
        try:
            file_types = (
                "Image files (*.png;*.jpg;*.jpeg;*.gif;*.bmp;*.webp)",
                "All files (*.*)",
            )
            paths = self._window.create_file_dialog(
                webview.OPEN_DIALOG,
                directory=start_dir or "",
                allow_multiple=False,
                file_types=file_types,
            )
            if not paths:
                return {"ok": False, "err": "cancelled"}
            path = paths[0] if isinstance(paths, (list, tuple)) else paths
            with open(path, "rb") as f:
                blob = f.read()
            mime, _ = mimetypes.guess_type(path)
            if not mime or not mime.startswith("image/"):
                mime = "image/png"
            data_url = "data:%s;base64,%s" % (
                mime,
                base64.b64encode(blob).decode("ascii"),
            )
            return {
                "ok": True,
                "path": path,
                "dirname": os.path.dirname(path),
                "filename": os.path.basename(path),
                "dataURL": data_url,
                "size": len(blob),
            }
        except Exception as e:
            return {"ok": False, "err": str(e)}

    def open_url_in_browser(self, url):
        # opt-in only, used for help; never auto-called
        try:
            webbrowser.open(url)
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "err": str(e)}


def main():
    html_path = resource_path("asciidream.html")
    if not os.path.exists(html_path):
        # try cwd as a fallback during dev
        alt = os.path.join(os.getcwd(), "asciidream.html")
        html_path = alt if os.path.exists(alt) else html_path
    api = Api()
    window = webview.create_window(
        title="Asciidream",
        url=html_path,
        js_api=api,
        width=1440,
        height=900,
        min_size=(900, 600),
        background_color="#0e1116",
        confirm_close=False,
        frameless=True,
        easy_drag=False,  # we draw our own draggable titlebar in HTML
    )
    api.attach(window)
    # `http_server=False`: we use file:// URLs only — truly offline.
    webview.start(debug=False)


if __name__ == "__main__":
    main()
