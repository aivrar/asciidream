# Publishing Asciidream to GitHub

This document is for you (the maintainer), not the user-facing audience. It walks through pushing the repo, creating a release with the .exe attached, and seeding the wiki.

> Run all commands from `E:\Asciidream`. Replace `aivrar/asciidream` with the actual repo path if you pick a different name.

---

## Prerequisites

```cmd
gh auth status
```

You should be authenticated as `aivrar`. If not:

```cmd
gh auth login
```

Pick GitHub.com, HTTPS, login with a browser.

---

## 1. Initial commit + push the repo

```cmd
cd E:\Asciidream

REM stage and commit
git init
git add .
git commit -m "Initial release of Asciidream v1.0.0"

REM create the GitHub repo and push (public)
gh repo create aivrar/asciidream --public --source=. --remote=origin --push --description "ASCII / Unicode generative art studio for Windows. Single portable .exe. Offline-first, deterministic."
```

If the repo already exists and you just want to push:

```cmd
git remote add origin https://github.com/aivrar/asciidream.git
git branch -M main
git push -u origin main
```

---

## 2. Cut the v1.0.0 release with the .exe attached

```cmd
gh release create v1.0.0 ^
  dist\Asciidream.exe ^
  --title "Asciidream v1.0.0" ^
  --notes-file RELEASE_NOTES.md
```

Users hitting your README's *Releases* link will land on this page and see `Asciidream.exe` listed under Assets. One click downloads.

To update the release later (e.g. v1.0.1):

```cmd
build.bat
gh release create v1.0.1 dist\Asciidream.exe --title "Asciidream v1.0.1" --notes "Patch notes here."
```

---

## 3. Seed the wiki

GitHub wikis are a separate git repo at `<repo>.wiki.git`. The pages I wrote are in `wiki/*.md`.

First enable the wiki on the repo (one-time):

```cmd
gh api -X PATCH repos/aivrar/asciidream -f has_wiki=true
```

Then clone the wiki, drop in the markdown, and push:

```cmd
REM Important: the wiki repo is created lazily by GitHub. Create the first
REM page through the web UI once — visit:
REM   https://github.com/aivrar/asciidream/wiki
REM   click "Create the first page" → save anything → return here.

cd %TEMP%
git clone https://github.com/aivrar/asciidream.wiki.git
cd asciidream.wiki

xcopy /Y E:\Asciidream\wiki\*.md .
mkdir images 2>nul
xcopy /Y E:\Asciidream\screenshots\*.png images\

REM Wiki uses *spaces* in filenames; GitHub maps them to "Page Name".
REM My pages are already named with hyphens (Quick-Start.md, etc.) which
REM GitHub treats as "Quick Start". Internal links use that form.

git add -A
git commit -m "Initial wiki"
git push
```

> The wiki pages reference screenshots via raw URLs of the main repo's `screenshots/` folder (e.g. `https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/01-main-window.png`). The `xcopy /Y screenshots\*.png images\` step above isn't strictly necessary if you keep that arrangement — the wiki pulls images from the main repo. Keep both copies if you prefer wiki-local image hosting.

---

## 4. Optional: pin the repo on your profile

In the web UI: your profile → Customize your pins → tick Asciidream.

---

## Sanity checklist before sharing

- [ ] `dist\Asciidream.exe` is the build you actually want (run it once locally to confirm).
- [ ] `README.md` doesn't reference paths only valid locally (search for `E:\` or `dist/` in the README — there should be none).
- [ ] The screenshots in `screenshots/` all render correctly (you can run `take-screenshots.js` again to regenerate them).
- [ ] Release page shows the .exe under Assets and the size looks right (~16 MB).
- [ ] Wiki sidebar / Home page links work — click each "Pages" link on the Home page.
- [ ] Open the release link from the README — should resolve to `/releases/latest`.

---

## Regenerating screenshots later

Anything that changes the UI invalidates the screenshots. Re-run:

```cmd
node take-screenshots.js
```

Then commit + push:

```cmd
git add screenshots
git commit -m "Refresh screenshots"
git push
```

For the wiki repo:

```cmd
cd %TEMP%\asciidream.wiki
xcopy /Y E:\Asciidream\screenshots\*.png images\
git add images
git commit -m "Refresh screenshots"
git push
```

---

## Cleanup before push (recommended)

```cmd
REM Remove temp build files (also covered by .gitignore but be explicit)
del /Q _dino.png _test.gif _check.js 2>nul
rmdir /S /Q build 2>nul
del /Q Asciidream.spec 2>nul
del /Q build.log dist_ready.flag 2>nul

REM Verify with git status
git status
```

Only these should be tracked:

```
.gitignore
LICENSE
PUBLISH.md            ← you can git rm this if you don't want it public
README.md
RELEASE_NOTES.md
ASCII_PATTERN_STUDIO_SPEC.md
asciidream.html
asciidream.py
build.bat
package.json
package-lock.json
take-screenshots.js
dist/Asciidream.exe   ← optional; you can keep the .exe out of the repo
                        and only upload it via gh release create
screenshots/*.png
wiki/*.md
```

If you'd rather not commit the .exe at all (only release it), add `dist/` to `.gitignore` and the `gh release create` flow above still works since you point it at `dist\Asciidream.exe` explicitly.
