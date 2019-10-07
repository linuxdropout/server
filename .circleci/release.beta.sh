git tag | xargs git tag -d
git fetch --tags
git reset --hard HEAD

branch=$(git branch | grep '^\*' | cut -d ' ' -f2)

npm version prerelease --preid beta -m 'Publish [skip ci] %s' && npm publish && git push --set-upstream origin $branch && git push --tags