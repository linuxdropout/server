git tag | xargs git tag -d
git fetch --tags
git reset --hard HEAD

npm version prerelease --preid beta && npm publish