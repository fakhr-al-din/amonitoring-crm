import React, { useState, useEffect } from 'react';

export default function CreateRequestModal({ isOpen, onClose, onCreated, editRequestData }) {
  const [clientKind, setClientKind] = useState('new');
  const [clientsList, setClientsList] = useState([]);
  const [clientVehicles, setClientVehicles] = useState([]); 
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');

  const isEditMode = !!editRequestData; 

  const [formData, setFormData] = useState({
    client_id: '', client_type: 'ТОО', client_name: '', phone: '', city: '', company_name: '',
    work_type: 'Установка', work_format: 'Выезд к клиенту', work_address: '', work_date: '',
    car_type: 'Легковое', car_brand: '', car_model: '', car_vin: '', car_plate: '', car_year: '',
    blocking: 'С блокировкой', beacon: 'С маяком', sensors: '',
    monitoring_email: '', monitoring_password: '', manager_comment: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      
      if (isEditMode) {
        setClientKind('existing');
        setFormData({
          ...formData,
          client_id: editRequestData.client_id,
          client_name: editRequestData.client_name || '',
          phone: editRequestData.phone || '',
          city: editRequestData.city || '',
          work_type: editRequestData.work_type === 'INSTALLATION' ? 'Установка' : editRequestData.work_type === 'REMOVAL' ? 'Снятие' : 'Диагностика',
          work_format: editRequestData.visit_type === 'ON_SITE' ? 'Выезд к клиенту' : 'В офисе',
          car_brand: editRequestData.brand || '',
          car_model: editRequestData.model || '',
          car_plate: editRequestData.plate_number || '',
          beacon: editRequestData.has_beacon ? 'С маяком' : 'Без маяка',
          blocking: editRequestData.has_blocking ? 'С блокировкой' : 'Без блокировки',
        });
      }
    }
  }, [isOpen, editRequestData]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/clients', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setClientsList(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchClientVehicles = async (clientId) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/vehicles?client_id=${clientId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setClientVehicles(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleExistingClientSelect = (e) => {
    const selectedId = e.target.value;
    const client = clientsList.find(c => c.id === Number(selectedId));
    if (client) {
      setFormData({ ...formData, client_id: client.id, client_type: client.type || 'Физ. лицо', client_name: client.name || '', phone: client.phone || '', company_name: client.company_name || client.company || '' });
      fetchClientVehicles(client.id);
    } else {
      setFormData({ ...formData, client_id: '', client_name: '', phone: '', company_name: '' });
      setClientVehicles([]);
    }
  };

  const handleClose = () => {
    setClientKind('new'); setError(''); setClientVehicles([]);
    setFormData({
      client_id: '', client_type: 'ТОО', client_name: '', phone: '', city: '', company_name: '',
      work_type: 'Установка', work_format: 'Выезд к клиенту', work_address: '', work_date: '',
      car_type: 'Легковое', car_brand: '', car_model: '', car_vin: '', car_plate: '', car_year: '',
      blocking: 'С блокировкой', beacon: 'С маяком', sensors: '',
      monitoring_email: '', monitoring_password: '', manager_comment: ''
    });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.client_name || !formData.phone || (!isEditMode && (!formData.work_date || !formData.car_brand || !formData.car_model))) {
      setError('Заполните обязательные поля (имя, телефон, дата, марка, модель)');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      // === РЕЖИМ РЕДАКТИРОВАНИЯ ===
      if (isEditMode) {
        const updateRes = await fetch(`http://127.0.0.1:8000/requests/${editRequestData.id}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({
            status: editRequestData.status,
            city: formData.city,
            installation: { has_beacon: formData.beacon === 'С маяком', has_blocking: formData.blocking === 'С блокировкой' }
          })
        });
        
        if (!updateRes.ok) {
          const errText = await updateRes.text();
          throw new Error(`Ошибка редактирования (Бэкенд): ${errText}`);
        }
        onCreated(); handleClose();
        return;
      }

      // === РЕЖИМ СОЗДАНИЯ ===
      let finalClientId = formData.client_id ? parseInt(formData.client_id, 10) : null;

      // 1. Клиент
      if (clientKind === 'new') {
        const clientRes = await fetch('http://127.0.0.1:8000/clients/', {
          method: 'POST', headers, body: JSON.stringify({ type: 'INDIVIDUAL', name: formData.client_name, company_name: formData.company_name || null, phone: formData.phone, email: null })
        });
        if (!clientRes.ok) throw new Error(`Ошибка Клиента: ${await clientRes.text()}`);
        const clientData = await clientRes.json();
        finalClientId = parseInt(clientData.id || clientData.client_id, 10);
      }

      // 2. Автомобиль
      const vehicleRes = await fetch('http://127.0.0.1:8000/vehicles', {
        method: 'POST', headers, body: JSON.stringify({
          client_id: finalClientId, brand: formData.car_brand, model: formData.car_model, plate_number: formData.car_plate || "Нет", vin: formData.car_vin || null, year: formData.car_year ? parseInt(formData.car_year, 10) : null, type: formData.car_type
        })
      });
      if (!vehicleRes.ok) throw new Error(`Ошибка Автомобиля: ${await vehicleRes.text()}`);
      const vehicleData = await vehicleRes.json();
      const finalVehicleId = parseInt(vehicleData.id || vehicleData.vehicle_id, 10);

      // 3. Заявка
      const requestRes = await fetch('http://127.0.0.1:8000/requests', {
        method: 'POST', headers, body: JSON.stringify({
          client_id: finalClientId, vehicle_id: finalVehicleId,
          work_type: formData.work_type === 'Установка' ? 'INSTALLATION' : formData.work_type === 'Снятие' ? 'REMOVAL' : 'DIAGNOSTIC',
          visit_type: formData.work_format === 'Выезд к клиенту' ? 'ON_SITE' : 'IN_OFFICE',
          city: formData.city, 
          installation: { has_beacon: formData.beacon === 'С маяком', has_blocking: formData.blocking === 'С блокировкой' }
        })
      });
      if (!requestRes.ok) throw new Error(`Ошибка Заявки: ${await requestRes.text()}`);
      const requestData = await requestRes.json();

      // 4. Отправка комментария (Убрана блокировка, уходит всегда, если есть текст)
      if (formData.manager_comment) {
        const commentRes = await fetch('http://127.0.0.1:8000/requests/comments', {
          method: 'POST', headers, body: JSON.stringify({ request_id: requestData.request_id, message: formData.manager_comment })
        });
        if (!commentRes.ok) throw new Error(`Ошибка Комментария: ${await commentRes.text()}`);
      }

      onCreated(); handleClose();   
    } catch (err) { 
      // ТЕПЕРЬ ВСЕ ОШИБКИ БУДУТ ВЫВОДИТЬСЯ ЧЕТКО НА ЭКРАН!
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const isExisting = clientKind === 'existing';

  return (
    <div className="modal-overlay open">
      <div className="modal-window">
        <div className="modal-header">
          <div className="modal-title">{isEditMode ? 'Редактирование заявки' : 'Создание заявки'}</div>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>
        
        {/* КРАСНЫЙ БАННЕР С ОШИБКОЙ */}
        {error && <div className="validation-banner visible" style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderBottom: '1px solid #ef9a9a', whiteSpace: 'pre-wrap' }}>{error}</div>}
        
        <div className="modal-body" style={{ background: '#f7f7f7', padding: '20px' }}>
          <form id="request-form" onSubmit={handleSubmit}>
            
            {/* 1. Данные клиента */}
            <div className="form-section">
              <h3 className="form-section-title">1. Данные клиента</h3>
              {!isEditMode && (
                <div className="form-row">
                  <label className="radio-label req-mark"><input type="radio" value="new" checked={clientKind === 'new'} onChange={() => setClientKind('new')} /> Новый клиент</label>
                  <label className="radio-label"><input type="radio" value="existing" checked={clientKind === 'existing'} onChange={() => setClientKind('existing')} /> Существующий клиент</label>
                </div>
              )}

              {isExisting && !isEditMode && (
                <div className="form-row align-center">
                  <span className="field-label req-mark">Выберите клиента:</span>
                  <select className="form-input" style={{ width: '240px' }} onChange={handleExistingClientSelect} value={formData.client_id}>
                    <option value="">— выберите —</option>
                    {clientsList.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-row align-center">
                <span className="field-label req-mark">ФИО:</span>
                <input className="form-input" type="text" name="client_name" value={formData.client_name} onChange={handleChange} readOnly={isExisting || isEditMode} />
              </div>
              <div className="form-row align-center">
                <span className="field-label req-mark">Контактный номер:</span>
                <input className="form-input" type="tel" name="phone" value={formData.phone} onChange={handleChange} readOnly={isExisting || isEditMode} />
              </div>
            </div>

            {/* 2. Организация работ */}
            <div className="form-section">
              <h3 className="form-section-title">2. Организация работ</h3>
              
             <div className="form-row align-center">
            <span className="field-label req-mark">Город:</span>
            
            <select 
              className="form-input" 
              name="city" 
              value={formData.city} 
              onChange={handleChange} 
            >
              <option value="">— город —</option>
              <option>Алматы</option>
              <option>Астана</option>
              <option>Шымкент</option>
              <option>Караганда</option>
            </select>
          </div>

              <div className="form-row align-center">
                <span className="field-label req-mark">Форма работы</span>
                <label className="radio-label"><input type="radio" name="work_type" value="Установка" checked={formData.work_type === 'Установка'} onChange={handleChange} disabled={isEditMode}/> Установка</label>
                <label className="radio-label"><input type="radio" name="work_type" value="Диагностика" checked={formData.work_type === 'Диагностика'} onChange={handleChange} disabled={isEditMode}/> Диагностика</label>
              </div>
              <div className="form-row align-center">
                <span className="field-label req-mark">Формат:</span>
                <label className="radio-label"><input type="radio" name="work_format" value="Выезд к клиенту" checked={formData.work_format === 'Выезд к клиенту'} onChange={handleChange} disabled={isEditMode}/> Выезд к клиенту</label>
                <label className="radio-label"><input type="radio" name="work_format" value="В офисе" checked={formData.work_format === 'В офисе'} onChange={handleChange} disabled={isEditMode}/> В офисе</label>
              </div>
              {!isEditMode && (
                <div className="form-row align-center">
                  <span className="field-label req-mark">Дата выполнения:</span>
                  <input className="form-input short" type="date" name="work_date" value={formData.work_date} onChange={handleChange} />
                </div>
              )}
            </div>

            {/* 3. Транспорт */}
            <div className="form-section">
              <h3 className="form-section-title">3. Данные транспорта</h3>
              
              <div className="form-row align-center">
                <span className="field-label req-mark">Марка:</span>
                <input className="form-input" type="text" name="car_brand" value={formData.car_brand} onChange={handleChange} readOnly={isEditMode}/>
              </div>
              <div className="form-row align-center">
                <span className="field-label req-mark">Модель:</span>
                <input className="form-input" type="text" name="car_model" value={formData.car_model} onChange={handleChange} readOnly={isEditMode}/>
              </div>
              
              {/* Кнопка Диагностики */}
              {isExisting && clientVehicles.length > 0 && !isEditMode && (
                <div className="form-row" style={{ marginTop: '10px' }}>
                  <button type="button" className="btn-green" onClick={() => alert('Открытие списка сохраненных авто...')} style={{background: '#f0f4c3', color: '#558b2f', border: '1px solid #cddc39', width: '100%', padding: '10px'}}>
                    🔍 Найдено авто: {clientVehicles.length}. Начать диагностику
                  </button>
                </div>
              )}

              <div className="form-row align-center">
                <span className="field-label">Гос. номер:</span>
                <input className="form-input" type="text" name="car_plate" value={formData.car_plate} onChange={handleChange} readOnly={isEditMode}/>
              </div>
            </div>

            {/* 4. Установка */}
            <div className="form-section">
              <h3 className="form-section-title">4. Параметры установки</h3>
              <div className="form-row align-center">
                <label className="radio-label"><input type="radio" name="blocking" value="С блокировкой" checked={formData.blocking === 'С блокировкой'} onChange={handleChange} /> С блокировкой</label>
                <label className="radio-label"><input type="radio" name="blocking" value="Без блокировки" checked={formData.blocking === 'Без блокировки'} onChange={handleChange} /> Без блокировки</label>
              </div>
              <div className="form-row align-center">
                <label className="radio-label"><input type="radio" name="beacon" value="С маяком" checked={formData.beacon === 'С маяком'} onChange={handleChange} /> С маяком</label>
                <label className="radio-label"><input type="radio" name="beacon" value="Без маяка" checked={formData.beacon === 'Без маяка'} onChange={handleChange} /> Без маяка</label>
              </div>
            </div>

            {/* 5. Комментарии (ПОЛНОСТЬЮ РАЗБЛОКИРОВАНЫ) */}
            {!isEditMode && (
              <div className="form-section">
                <h3 className="form-section-title">5. Комментарии от менеджера</h3>
                <textarea 
                  className="form-textarea full-width" 
                  name="manager_comment" rows="3" placeholder="Оставьте комментарий к заявке..." 
                  value={formData.manager_comment} onChange={handleChange}
                ></textarea>
              </div>
            )}

          </form>
        </div>
        
        <div className="modal-footer">
          <button className="modal-submit-btn" type="button" onClick={handleClose} style={{ borderColor: '#aaa', color: '#888' }}>Отмена</button>
          <button className="modal-submit-btn" type="submit" form="request-form" disabled={loading}>
            {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать заявку'}
          </button>
        </div>

      </div>
    </div>
  );
}