@echo off
echo Pushing latest changes to GitHub...

REM Add changes to staging
git add src\*.* public\*.* --verbose

REM Commit changes
git commit -m "Update project with new preset thumbnails and UI enhancements"

REM Push to GitHub
git push origin main

echo Done pushing changes to GitHub!