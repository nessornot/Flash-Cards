import React, {useEffect, useState} from 'react';
import Header from "../../components/Header/header";
import SideBar from "../../components/SideBar/SideBar";
import './CreateSet.scss'
import Card from "../../components/Card/Card";
import {getDeckById, rewordCards, saveDeck, updateDeck} from "../../services/deck";
import {useNavigate, useParams} from "react-router-dom";
import {createAI} from "../../services/auth";

export default function CreateSet() {
    const { id } = useParams(); // getting id if editing
    const [title, setTitle] = useState('');
    const [cards, setCards] = useState([{ question: '', answer: '' }]);
    const [isPublic, setIsPublic] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const navigate = useNavigate();

    const [ showPopUp, setShowPopUp ] = useState(false);
    const [ aiText, setAiText ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ isRewording, setIsRewording ] = useState(false);

    const handleReword = async () => {
        setIsRewording(true);
        try {
            const token = localStorage.getItem('jwtToken');
            const response = await rewordCards(token, cards);

            if (!response.ok) {
                throw new Error("GigaChat вернул ошибку");
            }

            const newCards = await response.json();
            setCards(newCards); // обновляем карточки
        } catch (err) {
            alert("Ошибка при переформулировке");
            console.error(err);
        } finally {
            setIsRewording(false); // скрываем индикатор
        }
    };


    const handleAI = async () => {
        if (!aiText || aiText.length < 10) {
            alert("Введите текст для анализа");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('jwtToken');
            const response = await createAI(token, aiText);
            const newCards = await response.json();

            if (Array.isArray(newCards)) {
                setCards((prev) => [...prev, ...newCards.map((c) => ({
                    question: c.question,
                    answer: c.answer
                }))]);
                setShowPopUp(false);
                setAiText("");
            } else {
                alert("(дебаг) Модель вернула неверный формат");
            }
        } catch (err) {
            alert("(дебаг) Ошибка при запросе к GigaChat");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            getDeckById(id).then((deck) => {
                setTitle(deck.title);
                setIsPublic(deck.is_public);
                const formattedCards = Object.entries(deck.cards).map(([q, a]) => ({
                    question: q,
                    answer: a
                }));
                setCards(formattedCards);
            }).catch(() => {
                alert("Не удалось загрузить набор");
            });
        }
    }, [id]);

    const handleCardChange = (index, field, value) => {
        const updated = [...cards];
        updated[index][field] = value;
        setCards(updated);
    };

    const addCard = () => {
        setCards([...cards, {question: '', answer: ''}]);
    };

    const removeCard = (index) => {
        const updated = cards.filter((_, i) => i !== index);
        setCards(updated);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            title,
            is_public: isPublic,
            cards: Object.fromEntries(cards.map(card => [card.question, card.answer]))
        };

        try {
            if (isEditMode) {
                await updateDeck(id, data);
                alert("Набор обновлён!");
                navigate('/library');
            } else {
                await saveDeck(data);
                alert("Набор создан!");
                setTitle('');
                setCards([{ question: '', answer: '' }]);
                navigate('/library');
            }
        } catch {
            alert("Ошибка при сохранении");
        }
    };

    return (
      <div className="createset">
          <Header />
          <div className="createset__content">
              <SideBar />
              <form className="createset__module" onSubmit={handleSubmit}>
                  <div className="module__header__row">
                      <div className="module__title">
                          Создать новый набор
                      </div>
                      <button className="module__create" type="submit">
                          Сохранить
                      </button>
                  </div>
                  <div className="module__info__column">
                      <input
                          type="text"
                          maxLength={25}
                          placeholder="Введите название..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="module__info__input"
                      />

                      <div className="module__info__row">
                          {/*<button id="btn-import" className="module__info__btn">*/}
                          {/*    <img src="/img/import.svg" alt=""/>*/}
                          {/*    Импортировать*/}
                          {/*</button>*/}
                          <button id="btn-aicreate" className="module__info__btn"
                                  onClick={() => setShowPopUp(true)}>
                              <img src="/img/aicreate.svg" alt=""/>
                              Создать из конспектов
                          </button>
                          <button id="btn-reword" className="module__info__btn" onClick={handleReword}
                                  disabled={isRewording}>
                              <img src="/img/aicreate.svg" alt=""/>
                              {isRewording ? "Переформулируем..." : "Переформулировать вопросы"}
                          </button>
                          <label className="module__info__checkbox">
                              <input
                                  type="checkbox"
                                  checked={isPublic}
                                  onChange={(e) => setIsPublic(e.target.checked)}
                              />
                              Сделать набор публичным
                          </label>
                      </div>
                  </div>
                  {showPopUp && (
                      <div className="popup__overlay">
                          <div className="popup__window">
                              <div className="popup__title">
                                  Вставьте текст конспекта
                              </div>
                              <textarea
                                  className="popup__textarea"
                                  maxLength={5000}
                                  value={aiText}
                                  onChange={(e) => setAiText(e.target.value)}
                                  placeholder="Введите до 5000 символов..."
                                  rows={10}
                                  style={{width: '100%'}}
                              />
                              <div className="popup__row">
                                  <button id="popup__create" className="popup__btn" onClick={handleAI} disabled={loading}>
                                      {loading ? "Генерация..." : "Создать на основе конспекта"}
                                  </button>
                                  <button id="popup__cancel" className="popup__btn" onClick={() => setShowPopUp(false)}>
                                      Отмена
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}
                  {cards.map((card, index) => (
                      <Card
                          key={index}
                          index={index}
                          question={card.question}
                          answer={card.answer}
                          onChange={handleCardChange}
                          onRemove={removeCard}
                      />
                  ))}
                  <div className="createset__wrapper">
                      <button className="createset__addcard" onClick={addCard}>
                          ДОБАВИТЬ КАРТОЧКУ
                      </button>
                  </div>
              </form>
          </div>
      </div>
    );
}