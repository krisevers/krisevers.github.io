#!/bin/sh

# build
rm -rf public/*
zine release

# push to main branch
if [ "$1" = "-m" ] && [ -n "$2" ]; then
    message="$2"
else
    message="auto commit"
fi
git add *
git commit -m "$message"
git push

# deploy to gh_pages branch
ssh -T git@github.com
git subtree push --prefix public origin gh-pages
