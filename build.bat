@echo off
setlocal
cd /d "%~dp0"

echo === Asciidream build ===
echo.
echo Step 1: ensure dependencies
python -m pip install -q --upgrade pywebview pyinstaller || goto :error

echo.
echo Step 2: clean previous build artifacts
if exist build rmdir /s /q build
if exist dist  rmdir /s /q dist
if exist Asciidream.spec del /q Asciidream.spec

echo.
echo Step 3: run PyInstaller (--onefile --windowed)
python -m PyInstaller ^
  --onefile ^
  --windowed ^
  --name Asciidream ^
  --icon=NONE ^
  --add-data "asciidream.html;." ^
  --hidden-import webview.platforms.edgechromium ^
  --hidden-import webview.platforms.mshtml ^
  --hidden-import webview.platforms.winforms ^
  asciidream.py || goto :error

echo.
echo === DONE ===
echo Built: %CD%\dist\Asciidream.exe
echo.
echo Run it with: dist\Asciidream.exe
exit /b 0

:error
echo.
echo *** BUILD FAILED ***
exit /b 1
