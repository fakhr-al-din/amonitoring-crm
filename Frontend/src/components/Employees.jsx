import React, { useState, useEffect } from 'react';
import '../styles/Employees.css';


export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Узнаем роль текущего пользователя из токена
  const getUserRoleFromToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      // Декодируем JWT токен (его среднюю часть)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role; // Возвращает 'ADMIN', 'MANAGER' и т.д.
    } catch (e) {
      return null;
    }
  };

  const currentUserRole = getUserRoleFromToken();
  const isAdmin = currentUserRole === 'ADMIN';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // Замени адрес, если в бэкенде он другой (например /users)
      const res = await fetch('http://127.0.0.1:8000/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Не удалось загрузить сотрудников');
      
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Удалить сотрудника ${name}?`)) {
      alert(`Здесь будет запрос на удаление ID: ${id}`);
      // Логика удаления (похожая на reject-user)
    }
  };

  const handleEdit = (id) => {
    alert(`Открытие модалки редактирования для ID: ${id}`);
  };

  // Словари для бейджиков
  const roleLabels = {
    'ADMIN': 'Администратор',
    'MANAGER': 'Менеджер',
    'SENIOR_TECHNICIAN': 'Старший монтажник',
    'TECHNICIAN': 'Монтажник'
  };

  const roleClasses = {
    'ADMIN': 'role-admin',
    'MANAGER': 'role-manager',
    'SENIOR_TECHNICIAN': 'role-senior',
    'TECHNICIAN': 'role-tech'
  };
console.log("Компонент Сотрудники успешно открылся!");
  return (
    <div className="employees-page">
      <div className="employees-header">
        <h2>Сотрудники</h2>
        {/* Кнопку "Добавить" тоже прячем от не-админов, если это нужно */}
        {isAdmin && (
          <button className="add-emp-btn">+ Добавить сотрудника</button>
        )}
      </div>
      <p className="employees-subtitle">Сотрудники входят с логином и паролем.</p>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="employees-grid">
          {employees.map(emp => (
            <div key={emp.id} className={`emp-card ${emp.role === 'ADMIN' ? 'admin-card' : ''}`}>
              
              <div className="emp-name">{emp.name}</div>
              <div className="emp-email">@{emp.email.split('@')[0]}</div> {/* Показываем почту в виде @username как на скрине */}
              
              <div className={`role-badge ${roleClasses[emp.role] || 'role-tech'}`}>
                {roleLabels[emp.role] || emp.role}
              </div>

              {/* РЕНДЕРИМ КНОПКИ ТОЛЬКО ДЛЯ АДМИНА */}
              {isAdmin && (
                <div className="emp-actions">
                  <button className="btn-edit" onClick={() => handleEdit(emp.id)}>Изменить</button>
                  <button className="btn-delete" onClick={() => handleDelete(emp.id, emp.name)}>Удалить</button>
                </div>
              )}
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}