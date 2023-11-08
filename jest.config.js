/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  projects: [
    {
      displayName: "SampleHtmlReporter",
      testMatch: ["<rootDir>/__tests__/*.js"],
      testPathIgnorePatterns: [
        '<rootDir>/node_modules/'
      ],
      testEnvironment: 'node'
    }
  ],
  reporters: ['default', '.']

};

module.exports = config;
