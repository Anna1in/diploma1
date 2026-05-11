const request = require('supertest');
const app = require('../server');
const dbHandler = require('./setup');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

const mockUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123'
};

describe('Auth Integration Tests', () => {
    describe('POST /api/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app).post('/api/register').send(mockUser);
            expect(res.statusCode).toBe(201);
            // Виправляємо: очікуємо message, а не token
            expect(res.body).toHaveProperty('message', 'User created');
        });

        it('should fail if email is duplicate', async () => {
            await request(app).post('/api/register').send(mockUser);
            const res = await request(app).post('/api/register').send(mockUser);
            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/login', () => {
        beforeEach(async () => {
            await request(app).post('/api/register').send(mockUser);
        });

        it('should login with valid credentials', async () => {
            const res = await request(app).post('/api/login').send({
                email: mockUser.email,
                password: mockUser.password
            });
            expect(res.statusCode).toBe(200);
            // Виправляємо: тут якраз має бути token
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('userId');
        });

        it('should fail with wrong password', async () => {
            const res = await request(app).post('/api/login').send({
                email: mockUser.email,
                password: 'wrongpassword'
            });
            expect(res.statusCode).toBe(401);
        });
    });
});
