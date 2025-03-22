# Script to push changes to GitHub
$env:GIT_PAGER = ""
Write-Host "Pushing UI changes to GitHub..."
git push origin main
Write-Host "Push completed successfully!" 