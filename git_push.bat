@echo off
echo Pushing latest UI changes to GitHub...
git config --global core.pager ""
git push origin main
echo Push completed!
pause 