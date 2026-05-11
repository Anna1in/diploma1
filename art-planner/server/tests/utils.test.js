const { validateEmail } = require('../utils/validate');

describe('Email Validation Helper', () => {

    test('should return true for valid addresses', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('anna.diploma@knu.ua')).toBe(true);
    });

    test('should return false if the @ character is missing', () => {
        expect(validateEmail('testexample.com')).toBe(false);
    });

    test('should return false if there is no domain or dot', () => {
        expect(validateEmail('test@com')).toBe(false);
        expect(validateEmail('test@server.')).toBe(false);
    });

    test('should return false for an empty string or null', () => {
        expect(validateEmail('')).toBe(false);
        expect(validateEmail(null)).toBe(false);
    });

});