import './LearnSet.scss';
import React, {useEffect, useState} from 'react';
import Header from "../../components/Header/header";
import SideBar from "../../components/SideBar/SideBar";
import { useParams } from 'react-router-dom'
import {getDeckById} from "../../services/deck";

export default function LearnSet() {
    const { id } = useParams();
    const [ cards, setCards ] = useState([]);
    const [ title, setTitle ] = useState('');
    const [ currentIndex, setCurrentIndex ] = useState(0);
    const [ showAnswer, setShowAnswer ] = useState(false);

    useEffect(() => {
        async function fetchDeck() {
            try {
                const deck = await getDeckById(id);
                setTitle(deck.title);
                const entries = Object.entries(deck.cards).map(([q, a]) => ({ question: q, answer: a}));
                setCards(entries);
            } catch (err) {
                console.error("Ошибка при загрузке набора: ", err);
            }
        }

        fetchDeck();
    }, [id]);

    const handlePrev = () => {
        setShowAnswer(false);
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setShowAnswer(false);
        setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
    };

    const handleCardClick = () => {
        setShowAnswer((prev) => !prev);
    };

    const handleShuffle = () => {
        setShowAnswer(false);
        setCurrentIndex(0);
        setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    };

    const currentCard = cards[currentIndex];

    return (
        <div className="learnset">
            <Header />
            <div className="learnset__row">
                <SideBar />
                <div className="learnset__content">
                    <div className="learnset__column">
                        <div className="learnset__title">
                            Заучивание
                        </div>
                        <div className="learnset__intro">
                            <div className="set__title">{title}</div>
                            <button className="set__shuffle" onClick={handleShuffle}>
                                <img src="/img/shuffle.svg" alt="Перемешать набор"/>
                            </button>
                        </div>
                        <div className={`learnset__card ${showAnswer ? "flipped" : ""}`} onClick={handleCardClick}>
                            <div className="learnset__card-inner">
                                <div className="learnset__card-front">
                                    {currentCard?.question}
                                </div>
                                <div className="learnset__card-back">
                                    {currentCard?.answer}
                                </div>
                            </div>
                        </div>
                        <div className="learnset__nav">
                            <button className="learnset__arrow" onClick={handlePrev} disabled={currentIndex === 0}>
                                <img src="/img/leftArrow.svg" alt=""/>
                            </button>
                            <div className="learnset__count">
                                {cards.length > 0 ? `${currentIndex + 1}/${cards.length}` : '0/0'}
                            </div>
                            <button className="learnset__arrow" onClick={handleNext}
                                    disabled={currentIndex === cards.length - 1}>
                                <img src="/img/rightArrow.svg" alt=""/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}