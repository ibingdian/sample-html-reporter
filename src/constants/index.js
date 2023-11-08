module.exports = {
    ENVIRONMENT_CONFIG_MAP: {
        JEST_JUNIT_OUTPUT_DIR: 'outputDirectory',
        JEST_JUNIT_OUTPUT_NAME: 'outputName',
        JEST_JUNIT_OUTPUT_FILE: 'outputFile',
        JEST_JUNIT_UNIQUE_OUTPUT_NAME: 'uniqueOutputName',
    },
    DEFAULT_OPTIONS: {
        outputDirectory: process.cwd(),
        outputName: 'sample-html.html',
        uniqueOutputName: 'false',
    },
    FILENAME_VAR: 'filename',
    FILEPATH_VAR: 'filepath',
    TITLE_VAR: 'title',
    DISPLAY_NAME_VAR: 'displayName',
};