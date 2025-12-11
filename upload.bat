@echo off
echo Configuring Git...
git config --global user.name "박제군"
git config --global user.email "korbill73@gmail.com"

echo Adding files...
git add .

echo Committing...
git commit -m "Balance: Descent -50%% more (93.75%% total), Item drops doubled to 3.5%%"

echo Checking remote...
git remote remove origin 2>nul
git remote add origin https://github.com/korbill73/galaga.git

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo Done!
pause
