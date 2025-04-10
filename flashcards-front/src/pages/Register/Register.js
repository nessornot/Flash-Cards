import React, { useState } from 'react'
import './Register.scss'
import Header from "../../components/Header/header"
import RedirectIfAuth from "../../components/RedirectIfAuth/RedirectIfAuth";
import {loginUser, registerUser} from "../../services/auth"
import { useNavigate} from "react-router-dom";

export default function Register() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    // ЗАДЕБАЖИТЬ авто логин при регистрации (DONE)
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await registerUser(name, password);
            if (response.status === 409) {
                alert("Данное имя пользователя занято");
                return;
            }

            const loginResponse = await loginUser(name, password);
            const data = await loginResponse.json();

            localStorage.setItem('jwtToken', data.token);

            navigate('/library');
        } catch (error) {
            alert("Ошибка при регистрации или входе")
            console.log(error)
        }
    };

    return (
        <RedirectIfAuth>
        <div className="register">
            <Header />
            <div className="register__content">
                <div className="container">
                    <div className="register__content__column">
                        <div className="register__title">
                            Регистрация
                        </div>
                        <form className="register__form" onSubmit={handleSubmit}>

                            <div className="register__form__group">
                                <label className="register__form__group__title"
                                       htmlFor="register-username">
                                    Имя пользователя
                                </label>
                                <input id="register-username" type="text" required // input
                                       placeholder="Введите имя..." value={name}
                                       onChange={(e) => setName(e.target.value)}/>
                            </div>

                            <div className="register__form__group">
                                <label className="register__form__group__title"
                                       htmlFor="register-password">
                                    Пароль
                                </label>
                                <input id="register-password" type="password" required // input
                                       placeholder="Введите пароль..." value={password}
                                onChange={(e) => setPassword(e.target.value)}/>
                            </div>

                            <button className="register__submit" type="submit">
                                        Зарегистрироваться
                            </button>

                        </form>
                        <div className="register__haveAccount">
                            Есть аккаунт?
                            <a href="/login" className="register__haveAccount__link">
                                Войти
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </RedirectIfAuth>
    );
}
