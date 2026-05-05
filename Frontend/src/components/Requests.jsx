import React, { useState, useEffect } from 'react';
import '../styles/Requests.css';
import CreateRequestModal from './CreateRequestModal';
import RequestDetailModal from './RequestDetailModal';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  
  // Состояние модалок
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [editRequestData, setEditRequestData] = useState(null); // <-- НОВОЕ: Данные для редактирования

  // Состояние фильтров
  const [filters, setFilters] = useState({ client: '', status: '', city: '', autoType: '', format: '', dateFrom: '', dateTo: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        setFilteredRequests(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err);
    }
  };

  useEffect(() => {
    let result = requests;
    if (filters.client) {
      const search = filters.client.toLowerCase();
      result = result.filter(r => (r.client_name && r.client_name.toLowerCase().includes(search)) || (r.company_name && r.company_name.toLowerCase().includes(search)));
    }
    if (filters.status) result = result.filter(r => r.status === filters.status);
    if (filters.format) result = result.filter(r => r.visit_type === filters.format);
    setFilteredRequests(result);
  }, [filters, requests]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const resetFilters = () => setFilters({ client: '', status: '', city: '', autoType: '', format: '', dateFrom: '', dateTo: '' });

  const statusLabels = { 'NEW': 'В ожидании', 'IN_PROGRESS': 'В процессе установки', 'DONE': 'Работы завершены', 'CANCELLED': 'Отменено' };
  const statusClasses = { 'NEW': 'status-new', 'IN_PROGRESS': 'status-progress', 'DONE': 'status-done', 'CANCELLED': 'status-cancelled' };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
  };

  // <-- НОВОЕ: Обработчик клика по трем точкам (Редактирование)
  const handleEditClick = (e, req) => {
    e.stopPropagation(); // Чтобы не открывалась модалка деталей
    setEditRequestData(req);
    setCreateModalOpen(true);
  };

  return (
    <div className="requests-page-container">
      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="filters-bar">
        {/* ... (Твои фильтры остаются без изменений) ... */}
        <div className="filter-group"><label>Клиент</label><input className="filter-input" type="text" name="client" value={filters.client} onChange={handleFilterChange} /></div>
        <div className="filter-group"><label>Статус</label><select className="filter-select" name="status" value={filters.status} onChange={handleFilterChange}><option value="">Все статусы</option><option value="NEW">В ожидании</option><option value="IN_PROGRESS">В процессе установки</option><option value="DONE">Работы завершены</option></select></div>
        <div className="filter-group"><label>Город</label><select className="filter-select" name="city" value={filters.city} onChange={handleFilterChange}><option value="">Все города</option><option value="Алматы">Алматы</option><option value="Астана">Астана</option></select></div>
        <div className="filter-group"><label>Формат работы</label><select className="filter-select" name="format" value={filters.format} onChange={handleFilterChange}><option value="">Все форматы</option><option value="ON_SITE">Выезд к клиенту</option><option value="IN_OFFICE">В офисе</option></select></div>
        <button className="btn-reset" onClick={resetFilters}>Сбросить</button>
      </div>

      {/* СПИСОК КАРТОЧЕК */}
      <div className="requests-list">
        {filteredRequests.length === 0 ? <div style={{textAlign: 'center', color: '#888'}}>Заявки не найдены</div> : null}
        
        {filteredRequests.map(req => (
          <div key={req.id} className="request-card" onClick={() => setSelectedRequestId(req.id)}>
            <div className="card-column">
              <div className="card-item"><span className="card-label">Клиент</span><span className="card-value">{req.client_name || 'Не указано'}</span></div>
              <div className="card-item"><span className="card-label">Статус</span><div className={`status-badge ${statusClasses[req.status] || 'status-new'}`}>{statusLabels[req.status] || req.status}</div></div>
            </div>
            <div className="card-column">
              <div className="card-item"><span className="card-label">Авто</span><span className="card-value">{req.brand} {req.model}</span></div>
              <div className="card-item"><span className="card-label">Город</span><span className="card-value">{req.city || 'Не указан'}</span></div>
            </div>
            <div className="card-column">
              <div className="card-item"><span className="card-label">Дата</span><span className="card-value">{formatDate(req.created_at)}</span></div>
              <div className="card-item"><span className="card-label">Формат</span><span className="card-value">{req.visit_type === 'ON_SITE' ? 'Выезд к клиенту' : 'В офисе'}</span></div>
            </div>

            {/* <-- НОВОЕ: Оживили три точки */}
            <div className="card-actions" onClick={(e) => handleEditClick(e, req)}>
              &#8942;
            </div>
          </div>
        ))}
      </div>

      <div className="create-btn-container">
        <button className="btn-create-floating" onClick={() => setCreateModalOpen(true)}>Создать заявку</button>
      </div>

      {/* МОДАЛКИ */}
      <CreateRequestModal 
        isOpen={isCreateModalOpen} 
        editRequestData={editRequestData} // <-- Передаем данные для редактирования
        onClose={() => { setCreateModalOpen(false); setEditRequestData(null); }} 
        onCreated={() => { setCreateModalOpen(false); setEditRequestData(null); fetchRequests(); }} 
      />
      
      <RequestDetailModal 
        isOpen={!!selectedRequestId} 
        requestId={selectedRequestId} 
        onClose={() => setSelectedRequestId(null)} 
        onUpdated={() => fetchRequests()} 
      />
    </div>
  );
}