import React, { useState, useEffect } from 'react';
import '../styles/Requests.css';

const getUserRole = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).role;
  } catch (error) {
    return null;
  }
};

export default function RequestDetailModal({ isOpen, onClose, requestId, onUpdated, initialTab = 'info', onEditClick }) {
  const [activeTab, setActiveTab] = useState(initialTab); 
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');

  const userRole = getUserRole();

  useEffect(() => {
    if (isOpen && requestId) {
      setActiveTab(initialTab);
      fetchRequestDetails();
      fetchComments();
      if (userRole === 'ADMIN' || userRole === 'SENIOR_TECHNICIAN') {
        fetchTechnicians();
      }
    }
  }, [isOpen, requestId, initialTab]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Не удалось загрузить данные заявки');
      
      const data = await res.json();
      setRequest(data.request);
      setHistory(data.history || []); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/requests/${requestId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/users/technicians`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Не удалось обновить статус');
      setRequest({ ...request, status: newStatus });
      fetchRequestDetails(); 
      onUpdated(); 
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ request_id: requestId, message: newComment })
      });
      if (!res.ok) throw new Error('Не удалось отправить комментарий');
      setNewComment('');
      fetchComments(); 
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) { alert('Выберите монтажника'); return; }
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/requests/${requestId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ technician_id: parseInt(selectedTech) })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка');
      }

      alert('Монтажник назначен!');
      setSelectedTech('');
      fetchRequestDetails();
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-window custom-detail-window">
        
        <div className="modal-header">
          <span className="modal-title">Заявка — {request ? request.client_name : 'Загрузка...'}</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="custom-tabs">
          <button className={`custom-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Информация</button>
          <button className={`custom-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>Комментарии <span className="tab-badge">{comments.length}</span></button>
          <button className={`custom-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>История</button>
        </div>

        <div className="custom-body">
          {loading ? <div className="loading-state">Загрузка данных...</div> : error ? <div className="validation-banner visible">{error}</div> : request && (
            <>
              {activeTab === 'info' && (
                <div className="tab-content">
                  {userRole !== 'TECHNICIAN' && onEditClick && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                      <button 
                        className="btn-edit-request" 
                        onClick={() => onEditClick(request)}
                      >
                        ✎ Изменить заявку
                      </button>
                    </div>
                  )}

                  <div className="info-card">
                    <div className="info-card-title">Клиент</div>
                    <div className="info-row"><span className="info-key">ФИО</span><span className="info-val">{request.client_name || '—'}</span></div>
                    <div className="info-row"><span className="info-key">Телефон</span><span className="info-val">{request.phone || '—'}</span></div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-title">Транспорт</div>
                    <div className="info-row"><span className="info-key">Марка</span><span className="info-val">{request.brand || '—'}</span></div>
                    <div className="info-row"><span className="info-key">Модель</span><span className="info-val">{request.model || '—'}</span></div>
                    <div className="info-row"><span className="info-key">Гос. номер</span><span className="info-val">{request.plate_number || '—'}</span></div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-title">Работы</div>
                    <div className="info-row"><span className="info-key">Город</span><span className="info-val">{request.city || 'Не указан'}</span></div>
                    <div className="info-row"><span className="info-key">Форма работы</span><span className="info-val">{request.work_type === 'INSTALLATION' ? 'Установка' : request.work_type === 'REMOVAL' ? 'Снятие' : 'Диагностика'}</span></div>
                    <div className="info-row"><span className="info-key">Формат</span><span className="info-val">{request.visit_type === 'ON_SITE' ? 'Выезд к клиенту' : 'В офисе'}</span></div>
                    <div className="info-row"><span className="info-key">Дата выполнения</span><span className="info-val">{formatDate(request.created_at).split(' ')[0]}</span></div>
                  </div>

                  {request.work_type === 'INSTALLATION' && (
                    <div className="info-card">
                      <div className="info-card-title">Установка</div>
                      <div className="info-row"><span className="info-key">Блокировка</span><span className="info-val">{request.has_blocking ? 'С блокировкой' : 'Без блокировки'}</span></div>
                      <div className="info-row"><span className="info-key">Маяк</span><span className="info-val">{request.has_beacon ? 'С маяком' : 'Без маяка'}</span></div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="tab-content flex-col">
                   <div className="comments-area">
                    {comments.length === 0 ? <div className="empty-state">Нет комментариев</div> : 
                      comments.map((c, i) => (
                        <div key={i} className="comment-bubble">
                          <strong>{c.author || 'Пользователь'}</strong> <span className="comment-date">{formatDate(c.created_at)}</span>
                          <p>{c.message}</p>
                        </div>
                      ))
                    }
                  </div>
                  <div className="comment-input-area">
                    <textarea 
                      placeholder="Написать комментарий..." 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>
                    <button className="btn-green" onClick={handleAddComment}>Отправить</button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="tab-content">
                   {history.length === 0 ? <div className="empty-state">История пуста</div> : (
                    <div className="history-timeline">
                      {history.map((h, i) => (
                        <div key={i} className="history-item">
                          <div className="history-dot"></div>
                          <div className="history-content">
                            <div className="history-action">{h.action === 'CREATED' ? 'Заявка создана' : h.action === 'STATUS_CHANGED' ? `Статус изменен: ${h.old_value} → ${h.new_value}` : h.action}</div>
                            <div className="history-meta">
                              {formatDate(h.created_at)} <span className="history-author">{h.user_name || 'Система'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {request && (
          <div className="custom-footer">
            
            {userRole !== 'TECHNICIAN' ? (
              <div className="footer-group">
                <span>Статус:</span>
                <select className="footer-select" value={request.status || 'NEW'} onChange={handleStatusChange}>
                  <option value="NEW">В ожидании</option>
                  <option value="IN_PROGRESS">В процессе установки</option>
                  <option value="COMPLETED">Работы завершены</option>
                  <option value="CANCELLED">Отмена заявки</option>
                </select>
              </div>
            ) : (
              <div className="footer-group">
                <span>Статус: <strong>{request.status === 'NEW' ? 'В ожидании' : request.status === 'IN_PROGRESS' ? 'В процессе установки' : request.status === 'COMPLETED' ? 'Завершено' : 'Отменено'}</strong></span>
              </div>
            )}

            {request.status === 'NEW' && (userRole === 'ADMIN' || userRole === 'SENIOR_TECHNICIAN') ? (
              <div className="footer-group">
                <span>Монтажник:</span>
                <select 
                  className="footer-select" 
                  value={selectedTech} 
                  onChange={(e) => setSelectedTech(e.target.value)}
                >
                  <option value="">— выбрать —</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button className="btn-green" onClick={handleAssign}>Назначить</button>
              </div>
            ) : request.assigned_to ? (
              <div className="footer-group">
                 <span style={{ color: '#5e9424', fontWeight: '500' }}>
                   ✓ Назначен монтажник (ID: {request.assigned_to})
                 </span>
              </div>
            ) : null}

          </div>
        )}
      </div>
    </div>
  );
}