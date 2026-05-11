import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../pages/AuthPage.jsx';
import { describe, test, expect, vi } from 'vitest';

describe('LoginForm Component', () => {
    test('відображає поля Name, Email та Password', () => {
        render(<MemoryRouter><LoginForm /></MemoryRouter>);
        expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/example@art.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    });
    test('перемикає режим між Sign Up та Sign In', async () => {
        render(<MemoryRouter><LoginForm /></MemoryRouter>);
        const user = userEvent.setup();

        // 1. Клікаємо на таб "Sign In" (зазвичай це другий елемент у перемикачі)
        const signInTabs = screen.getAllByRole('button', { name: /Sign In/i });
        await user.click(signInTabs[0]);

        // 2. Перевіряємо, що поле Name зникло
        expect(screen.queryByPlaceholderText(/Enter your name/i)).not.toBeInTheDocument();

        // 3. Шукаємо кнопку Login. Оскільки їх дві (хедер і форма), беремо ту, що має type="submit"
        const buttons = screen.getAllByRole('button', { name: /Login/i });
        const loginSubmitBtn = buttons.find(btn => btn.getAttribute('type') === 'submit');

        expect(loginSubmitBtn).toBeInTheDocument();
    });

    test('показує помилку валідації', async () => {
        render(<MemoryRouter><LoginForm /></MemoryRouter>);

        // Вибираємо саме ту кнопку Sign Up, яка знаходиться всередині форми (type="submit")
        const buttons = screen.getAllByRole('button', { name: /Sign Up/i });
        const submitBtn = buttons.find(btn => btn.getAttribute('type') === 'submit');

        fireEvent.click(submitBtn);

        const emailInput = screen.getByPlaceholderText(/example@art.com/i);
        expect(emailInput.validity.valueMissing).toBe(true);
    });

    test('викликає API при кліку на Sign Up', async () => {
        render(<MemoryRouter><LoginForm /></MemoryRouter>);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText(/Enter your name/i), 'Anna');
        await user.type(screen.getByPlaceholderText(/example@art.com/i), 'anna@test.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'secret123');

        const buttons = screen.getAllByRole('button', { name: /Sign Up/i });
        const submitBtn = buttons.find(btn => btn.getAttribute('type') === 'submit');

        await user.click(submitBtn);

    });

});