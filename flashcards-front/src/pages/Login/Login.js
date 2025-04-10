import React, {useState} from 'react'
import Header from "../../components/Header/header";
import "./Login.scss"
import { loginUser } from "../../services/auth";
import { useNavigate} from "react-router-dom";
import RedirectIfAuth from "../../components/RedirectIfAuth/RedirectIfAuth";

export default function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await loginUser(name, password);
        if (response.status === 401) {
            alert("Введен неверный пароль");
            return;
        }

        if (!response.ok) {
            const text = await response.text();
            console.error("Ошибка сервера:", text);
            return;
        }

        const data = await response.json();
        localStorage.setItem('jwtToken', data.token)

        navigate('/library')
        console.log(data.token); // должен вывести ответ от бекенда
    };

    return (
        <RedirectIfAuth>
        <div className="login">
            <Header />
            <div className="login__content">
                <div className="container">
                    <div className="login__content__column">
                        <div className="login__title">
                            Авторизация
                        </div>
                        <form className="login__form" onSubmit={handleSubmit}>

                            {/*--- name ---*/}
                            <div className="login__form__group">
                                <label
                                    htmlFor="login-username"
                                    className="login__form__group__title">
                                    Имя пользователя
                                </label>
                                <input id="login-username" type="text"
                                       placeholder="Введите имя..."
                                       className="login__form__group__input"
                                       value={name} required
                                onChange={(e) => setName(e.target.value)}/>
                            </div>

                            {/*--- password ---*/}
                            <div className="login__form__group">
                                <label
                                    htmlFor="login-password"
                                    className="login__form__group__title">
                                    Пароль
                                </label>
                                <input id="login-password" type="password"
                                       placeholder="Введите пароль..."
                                       className="login__form__group__input"
                                       value={password} required
                                onChange={(e) => setPassword(e.target.value)}/>
                            </div>

                            {/*--- submit ---*/}
                            <button className="login__submit" type="submit">
                                Войти
                            </button>

                        </form>
                        <div className="login__noAccount">
                            Нет аккаунта?
                            <a href="/register" className="login__noAccount__link">
                                Зарегистрироваться
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </RedirectIfAuth>
    );
}
