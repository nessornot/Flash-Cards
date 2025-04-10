import React from 'react'
import './header.scss'


export default function Header() {
    return (
        <header className="header">
            <div className="header__row">
                <a href="/" className="header__logo">
                    <img src="/img/logo.png" alt="" className="header__logo__img"/>
                </a>
                <div className="header__git">
                    <a href="https://github.com/nessornot/Flash-Cards"
                       target="_blank" rel="noreferrer" className="header__git__link">
                        <span className="header__git__title">
                            github
                        </span>
                    </a>
                </div>
            </div>
        </header>
    );
}