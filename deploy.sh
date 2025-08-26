#!/bin/sh

# build
rm -rf public/*
zine release

# deploy
ssh -T git@github.com
git subtree push --prefix public origin gh-pages
