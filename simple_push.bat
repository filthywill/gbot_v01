@echo off
set GIT_TERMINAL_PROMPT=0
set GIT_PAGER=
echo Pushing entire project to GitHub...
git push -u origin main --quiet
echo Push completed. Check GitHub repository to verify. 