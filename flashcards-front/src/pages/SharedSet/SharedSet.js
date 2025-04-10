import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import Header from "../../components/Header/header";
import SideBar from "../../components/SideBar/SideBar";
import './SharedSet.scss'

export default function SharedSet() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_URL}/shared/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Набор не найден или не публичен");
                return res.json();
            })
            .then(setDeck)
            .catch((err) => alert(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('jwtToken');
            const res = await fetch(`${process.env.REACT_APP_URL}/shared/${id}/copy`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error("Не удалось скопировать набор");
            }

            alert("Набор добавлен в вашу библиотеку");
            navigate('/library');
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Загрузка...</p>;

    if (!deck) return <p>Набор не найден</p>;

    return (
        <div className="sharedset">
            <Header />
            <div className="sharedset__wrapper">
                <SideBar/>
                <div className="sharedset__content">
                    <div className="set__title">
                        {deck.title}
                    </div>
                    <ul>
                        {Object.entries(deck.cards).map(([q, a], idx) => (
                            <li className="set__li" key={idx}>
                                <strong className="li__title">Q:</strong> {q} <br/>
                                <strong className="li__title">A:</strong> {a}
                            </li>
                        ))}
                    </ul>
                    <button className="set__btn" onClick={handleSave} disabled={saving}>
                        {saving ? "Сохраняем..." : "Сохранить в библиотеку"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// <div className="createset">
//     <Header/>
//     <div className="createset__content">
//         <SideBar/>
//         <form className="createset__module" onSubmit={handleSubmit}>
