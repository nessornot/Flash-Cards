import React from 'react'
import Header from "../../components/Header/header";
import "./Home.scss"

export default function Home() {
    return (
        <div className="home">
            <Header />
            <div className="container">
                <div className="home__content">
                    <div className="home__content__column">
                        <div className="home__descriptor">
                            Чем больше усилий ты вложишь сейчас, тем ярче будет твой успех в будущем
                        </div>
                        <div className="home__title">
                            flash cards
                        </div>
                        <div className="home__pretitle">
                            Учись эффективнее
                        </div>
                        <a href="/register" className="home__register">
                        <span className="home__register__title">
                            Зарегистрироваться
                        </span>
                        </a>
                        <a href="/login" className="home__auth">
                        <span className="home__auth__title">
                            У меня уже есть аккаунт
                        </span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}