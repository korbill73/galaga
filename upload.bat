@echo off
echo Configuring Git...
git config --global user.name "박제군"
git config --global user.email "korbill73@gmail.com"

echo Adding files...
git add .

echo Committing...
git commit -m "Balance Update: Item drop 10%%→7%%, Enhanced shield with multi-layer gradient effects"

echo Checking remote...
git remote remove origin 2>nul
git remote add origin https://github.com/korbill73/galaga.git

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo Done!
pause
