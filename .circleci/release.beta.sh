git tag | xargs git tag -d
git fetch --tags
git reset --hard HEAD

npm version prerelease --preid beta -m 'Publish skip ci %s' && npm publish
git push && git push --tags