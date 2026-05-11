module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    verbose: true,
    testMatch: ["**/tests/**/*.test.js"],
    collectCoverageFrom: ["**/*.js", "!**/node_modules/**", "!**/migrations/**"],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};