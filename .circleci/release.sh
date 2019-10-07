git tag | xargs git tag -d
git fetch --tags
git reset --hard HEAD

mhash=$(git merge-base master HEAD)
dirpath=$(dirname $0)
version=$(git log $mhash.. | grep -v 'commit\|^Author:\|^Date:' | node $dirpath/version.js)

npm version $version -m 'Publish skip ci %s' && npm publish
git push && git push --tags