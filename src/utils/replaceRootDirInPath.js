
const path = require('path');

module.exports = {
    replaceRootDirInPath : (rootDir,filePath) => {
        if (!/^<rootDir>/.test(filePath)) {
            return filePath;
        }
        return path.resolve(
            rootDir,
            path.normalize('./' + filePath.substr('<rootDir>'.length))
        )
    }
}