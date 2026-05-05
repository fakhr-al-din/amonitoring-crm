import React, { useState, useEffect } from 'react';

export default function RequestDetailModal({ isOpen, onClose, requestId, onUpdated }) {
  const [activeTab, setActiveTab] = useState('info'); // info | comments | history
  
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Загружаем данные
  useEffect(() => {
    if (isOpen && requestId) {
      setActiveTab('info');
      fetchRequestDetails();
      fetchComments();
    }
  }, [isOpen, requestId]);

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
      setHistory(data.history || []); // Забираем историю
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
      console.error('Ошибка загрузки комментариев', err);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Не удалось обновить статус');
      setRequest({ ...request, status: newStatus });
      fetchRequestDetails(); // Перезагружаем, чтобы обновить историю
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ request_id: requestId, message: newComment })
      });
      if (!res.ok) throw new Error('Не удалось отправить комментарий');
      setNewComment('');
      fetchComments(); 
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  // Функция для красивой даты
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-window custom-detail-window">
        
        {/* Шапка */}
        <div className="modal-header">
          <span className="modal-title">Заявка — {request ? request.client_name : 'Загрузка...'}</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        {/* Вкладки */}
        <div className="custom-tabs">
          <button className={`custom-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            Информация
          </button>
          <button className={`custom-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
            Комментарии <span className="tab-badge">{comments.length}</span>
          </button>
          <button className={`custom-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            История
          </button>
        </div>

        {/* Тело со скроллом */}
        <div className="custom-body">
          {loading ? <div className="loading-state">Загрузка данных...</div> : error ? <div className="validation-banner visible">{error}</div> : request && (
            <>
             {/* === ИНФОРМАЦИЯ === */}
              {activeTab === 'info' && (
                <div className="tab-content">
                  
                  {/* Кнопка редактирования (Заготовка для Задачи 5) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                    <button 
                      className="btn-green" 
                      style={{ background: '#f1f8e9', color: '#5e9424', border: '1px solid #c8e6c9' }}
                      onClick={() => alert('Здесь откроется форма редактирования (CreateRequestModal в режиме edit)')}
                    >
                      ✎ Изменить заявку
                    </button>
                  </div>

                  <div className="info-card">
                    <div className="info-card-title">Клиент</div>
                    <div className="info-row"><span className="info-key">ФИО</span><span className="info-val">{request.client_name || '—'}</span></div>
                    <div className="info-row"><span className="info-key">Телефон</span><span className="info-val">{request.phone || '—'}</span></div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-title">Транспорт</div>
                    {/* ЗАДАЧА 3: РАЗДЕЛИЛИ МАРКУ И МОДЕЛЬ */}
                    <div className="info-row"><span className="info-key">Марка</span><span className="info-val">{request.brand || '—'}</span></div>
                    <div className="info-row"><span className="info-key">Модель</span><span className="info-val">{request.model || '—'}</span></div>
                    <div className="info-row"><span className="info-key">Гос. номер</span><span className="info-val">{request.plate_number || '—'}</span></div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-title">Работы</div>
                    {/* ЗАДАЧА 4: ПЕРЕНЕСЛИ ГОРОД В БЛОК РАБОТ */}
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

              {/* === КОММЕНТАРИИ === */}
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

              {/* === ИСТОРИЯ === */}
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

        {/* Подвал */}
        {request && (
          <div className="custom-footer">
            <div className="footer-group">
              <span>Статус:</span>
              <select className="footer-select" value={request.status || 'NEW'} onChange={handleStatusChange}>
                <option value="NEW">В ожидании</option>
                <option value="IN_PROGRESS">В процессе установки</option>
                <option value="COMPLETED">Работы завершены</option>
                <option value="CANCELLED">Отмена заявки</option>
              </select>
            </div>
            <div className="footer-group">
              <span>Монтажник:</span>
              <select className="footer-select">
                <option value="">— выбрать —</option>
                {/* Сюда потом добавим список монтажников */}
              </select>
              <button className="btn-green">Назначить</button>
            </div>
          </div>
        )}

      </div>

      {/* ВШИТЫЕ СТИЛИ (Чтобы сразу работало как на макете) */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-detail-window {
          width: 700px;
          max-width: 95%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: #fcfcfc;
          border-radius: 8px;
          overflow: hidden;
        }
        .custom-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          padding: 0 20px;
          background: #fff;
        }
        .custom-tab {
          padding: 15px 20px;
          background: none;
          border: none;
          font-size: 14px;
          color: #888;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .custom-tab.active {
          color: #5e9424;
          font-weight: bold;
          border-bottom-color: #5e9424;
        }
        .tab-badge {
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 11px;
          margin-left: 5px;
        }
        .custom-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .info-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 15px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .info-card-title {
          color: #5e9424;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }
        .info-row {
          display: flex;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .info-row:last-child { margin-bottom: 0; }
        .info-key { width: 160px; color: #888; }
        .info-val { flex: 1; color: #222; font-weight: 500; }
        
        .custom-footer {
          padding: 15px 20px;
          background: #fff;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-group {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #555;
        }
        .footer-select {
          padding: 6px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          outline: none;
        }
        .btn-green {
          background: #5e9424;
          color: #fff;
          border: none;
          padding: 7px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-green:hover { background: #4d7a1d; }
        
        .flex-col { display: flex; flex-direction: column; height: 100%; }
        .comments-area { flex: 1; margin-bottom: 15px; }
        .comment-bubble { background: #fff; border: 1px solid #eee; padding: 12px; border-radius: 6px; margin-bottom: 10px; }
        .comment-date { font-size: 12px; color: #aaa; margin-left: 10px; }
        .comment-input-area { display: flex; flex-direction: column; gap: 10px; }
        .comment-input-area textarea { border: 1px solid #ccc; border-radius: 6px; padding: 10px; resize: vertical; min-height: 60px; font-family: inherit;}
        .comment-input-area button { align-self: flex-end; }
        
        .history-item { display: flex; gap: 15px; margin-bottom: 20px; }
        .history-dot { width: 10px; height: 10px; background: #8bc34a; border-radius: 50%; margin-top: 5px; }
        .history-content { background: #fff; border: 1px solid #eee; padding: 12px 15px; border-radius: 6px; flex: 1; }
        .history-action { font-weight: 500; font-size: 14px; margin-bottom: 5px; }
        .history-meta { font-size: 12px; color: #888; }
        .history-author { color: #5e9424; font-weight: 500; margin-left: 5px; }
        .empty-state { text-align: center; color: #aaa; padding: 40px 0; }
      `}} />
    </div>
  );
}