import React, {useEffect, useState } from "react";
import Header from "../../components/Header/header";
import SideBar from '../../components/SideBar/SideBar'
import "./Library.scss"
import CardsSet from "../../components/CardsSet/CardsSet";
import RedirectIfAuth from "../../components/RedirectIfAuth/RedirectIfAuth";
import {deleteDeck, getUserDecks} from "../../services/deck";
import ConfirmModal from "../../components/confirmModal/ConfirmModal";


export default function Library() {
    const [decks, setDecks] = useState([]);
    const [deckToDelete, setDeckToDelete] = useState(null);

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const result = await getUserDecks();
                setDecks(result);
            } catch (err) {
                console.error('Ошибка загрузки наборов', err);
            }
        };

        fetchDecks();
    }, []);

    const requestDelete = (id) => {
        setDeckToDelete(id);
    };

    const confirmDelete = async () => {
        try {
            await deleteDeck(deckToDelete);
            setDecks((prev) => prev.filter((deck) => deck.id !== deckToDelete));
            setDeckToDelete(null);
        } catch (err) {
            console.error('Ошибка при удалении набора:', err);
            alert('Не удалось удалить набор.');
        }
    };

    const cancelDelete = () => {
        setDeckToDelete(null);
    };

    return(
        <div className="library">
            <Header />
            <div className="library__content">
                <SideBar />
                <div className="library__content__main">
                    <div className="library__title">
                        Мои наборы
                    </div>
                    {decks.length === 0 ? (
                        <div>У вас пока нет наборов</div>
                        ) : (
                        decks.map((deck) => (
                        <CardsSet
                            id={deck.id}
                            key={deck.id}
                            title={deck.title}
                            author={deck.author_name}
                            count={deck.cards_count}
                            isPublic={deck.is_public}
                            onDelete={requestDelete}
                        />
                        ))
                    )}
                    {deckToDelete !== null && (
                        <ConfirmModal
                            message="Вы уверены, что хотите удалить набор?"
                            onConfirm={confirmDelete}
                            onCancel={cancelDelete}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}