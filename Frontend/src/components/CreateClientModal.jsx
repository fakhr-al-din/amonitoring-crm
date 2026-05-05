import React, { useState } from 'react';
import '../styles/CreateClientModal.css'; // <--- ПОДКЛЮЧАЕМ СТИЛИ ЗДЕСЬ

export default function CreateClientModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    type: 'TOO',
    name: '',
    company_name: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка создания клиента');
      }
      
      onCreated(); 
      setFormData({ type: 'TOO', name: '', company_name: '', phone: '', email: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-window create-client-modal">
        <div className="modal-header">
          <span className="modal-title">Добавить клиента</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="custom-body create-client-body">
          {error && <div className="validation-banner visible">{error}</div>}
          <form onSubmit={handleSubmit} className="create-client-form">
            
            <div>
              <label className="create-client-label">Тип клиента</label>
              <select name="type" value={formData.type} onChange={handleChange} className="create-client-input">
                <option value="TOO">ТОО</option>
                <option value="IP">ИП</option>
                <option value="INDIVIDUAL">Физ. лицо</option>
              </select>
            </div>

            <div>
              <label className="create-client-label">ФИО представителя</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="create-client-input" />
            </div>

            {(formData.type === 'TOO' || formData.type === 'IP') && (
              <div>
                <label className="create-client-label">Название компании (опционально)</label>
                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="create-client-input" />
              </div>
            )}

            <div>
              <label className="create-client-label">Телефон</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="create-client-input" />
            </div>

            <button type="submit" className="btn-green create-client-submit">Сохранить</button>
          </form>
        </div>
      </div>
    </div>
  );
}