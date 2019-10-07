git tag | xargs git tag -d && git fetch --tags

npm version prerelease --preid beta
git diff
# npm publish