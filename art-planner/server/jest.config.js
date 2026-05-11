module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    verbose: true,
    testMatch: ["**/tests/**/*.test.js"],
    collectCoverageFrom: ["**/*.js", "!**/node_modules/**", "!**/migrations/**"],
    coverageThreshold: {
        global: {
            statements: 50,
            branches: 40,
            functions: 30,
            lines: 50,
        }
    }
};