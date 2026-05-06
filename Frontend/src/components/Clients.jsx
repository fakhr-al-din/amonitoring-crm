import React, { useState, useEffect } from 'react';
import '../styles/Clients.css'; 
import CreateClientModal from './CreateClientModal';
import RequestDetailModal from './RequestDetailModal';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedClient, setSelectedClient] = useState(null); 
  const [clientRequests, setClientRequests] = useState([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить список клиентов');
      }

      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/clients/${client.id}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClientRequests(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки заявок клиента:', err);
    }
  };

  const statusLabels = { 'NEW': 'В ожидании', 'IN_PROGRESS': 'В процессе установки', 'COMPLETED': 'Работы завершены', 'CANCELLED': 'Отменено' };
  
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="clients-page-container">
      
      {!selectedClient ? (
        <>
          <div className="clients-header-bar">
            <h2>Клиенты</h2>
            <div className="clients-header-actions">
              <span className="subtitle-text">Клиенты из заявок и созданные вручную</span>
              <button className="btn-green" onClick={() => setCreateModalOpen(true)}>+ Добавить клиента</button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              Загрузка клиентов...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#c53030' }}>
              {error}
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              Нет клиентов
            </div>
          ) : (
            <div className="clients-grid">
              {clients.map(client => (
                <div 
                  key={client.id} 
                  className="client-card" 
                  /* УБРАЛИ onClick отсюда и добавили обычный курсор */
                  style={{ cursor: 'default' }}
                >
                  <div className="client-card-title">
                    {client.company_name || client.name}
                  </div>
                  <div className="client-card-type">
                    {client.type} {client.company_name ? ` · ${client.name}` : ''}
                  </div>
                  <div className="client-card-info">
                    {client.phone} {client.email ? ` · ${client.email}` : ''}
                  </div>
                  
                  {/* Подвал карточки с бейджиком и НОВОЙ КНОПКОЙ */}
                  <div className="client-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                    <div>
                      <span className="request-count-label">Заявок:</span>
                      <span className={`request-count-badge ${client.request_count > 0 ? 'active' : ''}`} style={{ marginLeft: '8px' }}>
                        {client.request_count || 0}
                      </span>
                    </div>
                    
                    {/* Кнопка "Детали" */}
                    <button 
                      className="btn-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClientClick(client);
                      }}
                    >
                      Детали
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="client-detail-view">
          <div className="clients-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button className="btn-back" onClick={() => setSelectedClient(null)}>
                &larr; Назад
              </button>
              <h2>{selectedClient.company_name || selectedClient.name}</h2>
            </div>
            <div className="clients-header-actions">
              <span className="subtitle-text">Клиенты из заявок и созданные вручную</span>
              <button className="btn-green" onClick={() => setCreateModalOpen(true)}>+ Добавить клиента</button>
            </div>
          </div>

          {/* Добавили position: 'relative' чтобы кнопка позиционировалась внутри блока */}
          <div className="client-info-box" style={{ position: 'relative' }}>
            
            {/* НОВАЯ КНОПКА "РЕДАКТИРОВАТЬ" В ПРАВОМ ВЕРХНЕМ УГЛУ */}
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
              <button 
                className="btn-edit-request"
                onClick={() => alert('Здесь будет открываться форма редактирования клиента!')}
              >
                ✎ Редактировать
              </button>
            </div>

            <div className="info-row"><span className="info-key">ФИО / Название</span><span className="info-val">{selectedClient.company_name || selectedClient.name}</span></div>
            <div className="info-row"><span className="info-key">Тип</span><span className="info-val">{selectedClient.type}</span></div>
            <div className="info-row"><span className="info-key">Телефон</span><span className="info-val">{selectedClient.phone}</span></div>
            <div className="info-row"><span className="info-key">Город</span><span className="info-val">{clientRequests.length > 0 && clientRequests[0].city ? clientRequests[0].city : 'Неизвестно'}</span></div>
          </div>

          <h3 className="section-title">Заявки клиента</h3>
          <div className="client-requests-list">
            {clientRequests.length === 0 ? <div style={{ color: '#888', padding: '20px' }}>Нет заявок</div> : null}
            
            {clientRequests.map(req => (
              <div key={req.id} className="client-request-row" onClick={() => setSelectedRequestId(req.id)}>
                <div className="req-date">{formatDate(req.created_at)}</div>
                <div className="req-auto">{req.brand} {req.model}</div>
                <div className="req-status">
                  <span className={`status-pill ${req.status.toLowerCase()}`}>
                    {statusLabels[req.status] || req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateClientModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onCreated={() => { setCreateModalOpen(false); fetchClients(); }} 
      />

      <RequestDetailModal 
        isOpen={!!selectedRequestId} 
        requestId={selectedRequestId} 
        onClose={() => setSelectedRequestId(null)} 
        onUpdated={() => {
          if (selectedClient) handleClientClick(selectedClient);
        }} 
      />
    </div>
  );
}