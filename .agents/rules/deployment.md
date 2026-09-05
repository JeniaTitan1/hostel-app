# Deployment & Completion Instructions

At the end of every response after completing a task and pushing changes to git, ALWAYS provide the following copy-paste block for the user to pull and apply on their second WSL/server environment:

```bash
git pull origin master && git checkout public/build/manifest.json && php artisan optimize:clear
```
or multiline:
```bash
git pull origin master
git checkout public/build/manifest.json
php artisan optimize:clear
```
