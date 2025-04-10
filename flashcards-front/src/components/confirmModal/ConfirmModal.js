import React from 'react';
import './ConfirmModal.scss';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="confirmmodal">
            <div className="modal">
                <div className="modal__msg">{message}</div>
                <div className="modal__buttons">
                    <button className="modal__confirm" onClick={onConfirm}>Удалить</button>
                    <button className="modal__cancel" onClick={onCancel}>Отмена</button>
                </div>
            </div>
        </div>
    );
}
