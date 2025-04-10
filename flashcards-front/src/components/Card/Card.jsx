import React from 'react';
import './Card.scss';

export default function Card({ index, question, answer, onChange, onRemove }) {
    const handleInputChange = (field, value) => {
        onChange(index, field, value);
    };

    return (
        <div className="card">
            <div className="card__nav">
                <div className="card__index">{index + 1}</div>
                <button className="card__delete" onClick={() => onRemove(index)} type="button">
                    <img src="/img/deleteCard.svg" alt="Удалить карточку"/>
                </button>
            </div>
            <div className="card__content">
                <div className="card__input__wrapper">
                    <input
                        maxLength={250}
                        type="text"
                        className="card__question"
                        placeholder="_"
                        value={question}
                        onChange={(e) => handleInputChange('question', e.target.value)}
                        required
                    />
                    <div className="card__input__caption">ТЕРМИН</div>
                </div>
                <div className="card__input__wrapper">
                    <input
                        maxLength={250}
                        type="text"
                        className="card__answer"
                        placeholder="_"
                        value={answer}
                        onChange={(e) => handleInputChange('answer', e.target.value)}
                        required
                    />
                    <div className="card__input__caption">ОПРЕДЕЛЕНИЕ</div>
                </div>
            </div>
        </div>
    );
}
