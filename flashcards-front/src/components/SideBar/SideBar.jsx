import React from 'react'
import './SideBar.scss'
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";

export default function SideBar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/')
    }

    return (
        <aside className="sidebar">
            <nav className="sidebar__nav">
                <ul className="sidebar__list">
                    <li className="sidebar__item">
                        <img src="/img/library.svg" alt=""/>
                        <a id="li__lib" href="/library" className="sidebar__link">
                            Библиотека наборов
                        </a>
                    </li>
                    <li className="sidebar__item">
                        <img src="/img/create.svg" alt=""/>
                        <a id="li__create" href="/createset" className="sidebar__link">
                            Создать набор
                        </a>
                    </li>
                    <li id="sidebar__exit" className="sidebar__item" onClick={handleLogout}>
                        <img src="/img/exit.svg" alt=""/>
                        <a id="li__exit" href="" className="sidebar__link">
                            Выйти из аккаунта
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}