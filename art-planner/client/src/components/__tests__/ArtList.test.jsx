import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GalleryPage from '../../pages/GalleryPage.jsx';
import API from '../../api/axiosConfig';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// 1. Мокаємо API модуль
vi.mock('../../api/axiosConfig', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    }
}));

describe('GalleryPage Component', () => {
    beforeEach(() => {
        // 2. Встановлюємо userId, щоб fetchArts не ігнорував запит
        localStorage.setItem('userId', 'user123');
        vi.clearAllMocks();
    });

    test('завантажує та відображає список малюнків у папці My Arts', async () => {
        const mockArts = [
            { _id: '1', customName: 'Nature', originalPath: 'test.jpg', status: 'pending' }
        ];

        // 3. Налаштовуємо відповідь API
        API.get.mockResolvedValue({ data: mockArts });

        render(
            <MemoryRouter>
                <GalleryPage />
            </MemoryRouter>
        );

        // 4. Клікаємо по папці
        const folder = screen.getByText(/My Arts/i);
        fireEvent.click(folder);

        // 5. Тепер Nature має з'явитися, бо userId існує і API повернуло дані
        const artTitle = await screen.findByText(/Nature/i, {}, { timeout: 3000 });
        expect(artTitle).toBeInTheDocument();
    });
    test('відкриває модальне вікно підтвердження видалення', async () => {
        const mockArts = [{ _id: '1', customName: 'Nature', originalPath: 'test.jpg', status: 'pending' }];
        API.get.mockResolvedValue({ data: mockArts });

        render(<MemoryRouter><GalleryPage /></MemoryRouter>);
        localStorage.setItem('userId', 'user123');

        // Відкриваємо папку
        fireEvent.click(screen.getByText(/My Arts/i));

        // Чекаємо малюнок
        await screen.findByText(/Nature/i);

        // Знаходимо кнопку видалення.
        // Вона має специфічні класи "absolute top-2 left-2"
        const allButtons = screen.getAllByRole('button');
        const deleteBtn = allButtons.find(btn => btn.className.includes('top-2'));

        fireEvent.click(deleteBtn);

        // Перевіряємо модалку
        expect(screen.getByText(/Чи впевнені ви в видаленні/i)).toBeInTheDocument();
    });
});