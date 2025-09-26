import React, { useState } from 'react';

// Formun alacağı verinin başlangıç yapısı
const initialFormData = {
  tip: 'Bakım', // Varsayılan değer
  tarih: new Date().toISOString().split('T')[0], // Bugünün tarihi (YYYY-MM-DD)
  kilometre: '',
  maliyet: '',
  parcaAdi: '',
  aciklama: '',
};

function KayitFormu({ onKayitEkle, seciliAracID }) {
  // Form verilerini tutmak için state
  const [formData, setFormData] = useState(initialFormData);

  // Input alanları değiştiğinde state'i güncelleyen fonksiyon
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Form gönderildiğinde çalışır
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Gerekli alanların doldurulup doldurulmadığını kontrol et
    if (!formData.tip || !formData.tarih) {
        alert("İşlem Tipi ve Tarih alanları zorunludur!");
        return;
    }
    
    // Seçili araç yoksa kayıt eklemeyi engelle
    if (!seciliAracID) {
        alert("Lütfen bir araç seçin!");
        return;
    }

    // App.jsx'ten gelen fonksiyonu çağırarak kaydı Local Storage'a ekle
    onKayitEkle({
        ...formData,
        // Sayısal alanları temizlemek ve sayıya çevirmek
        kilometre: parseInt(formData.kilometre) || 0,
        maliyet: parseFloat(formData.maliyet) || 0,
    });

    // Formu temizle
    setFormData(initialFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="kayit-formu" style={formStyle}>
      <h3>Yeni İşlem Kaydı Ekle</h3>
      
      {/* 1. İşlem Tipi */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>İşlem Tipi *</label>
        <select
          name="tip"
          value={formData.tip}
          onChange={handleChange}
          required
          style={inputStyle}
        >
          <option value="Bakım">Bakım</option>
          <option value="Muayene">Muayene</option>
          <option value="Yıkama">Yıkama</option>
          <option value="Parça Değişimi">Parça Değişimi</option>
          <option value="Kaza/Hasar">Kaza/Hasar</option>
          <option value="Diğer">Diğer</option>
        </select>
      </div>

      {/* 2. İşlem Tarihi */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Tarih *</label>
        <input
          type="date"
          name="tarih"
          value={formData.tarih}
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>

      {/* 3. Kilometre */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Kilometre (Opsiyonel)</label>
        <input
          type="number"
          name="kilometre"
          value={formData.kilometre}
          onChange={handleChange}
          placeholder="Örn: 125000"
          style={inputStyle}
        />
      </div>

      {/* 4. Maliyet */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Maliyet (TL) (Opsiyonel)</label>
        <input
          type="number"
          name="maliyet"
          value={formData.maliyet}
          onChange={handleChange}
          placeholder="Örn: 550.00"
          style={inputStyle}
        />
      </div>
      
      {/* 5. Parça Adı (Sadece Parça Değişimi için) */}
      {formData.tip === 'Parça Değişimi' && (
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Parça Adı</label>
          <input
            type="text"
            name="parcaAdi"
            value={formData.parcaAdi}
            onChange={handleChange}
            placeholder="Örn: Yağ Filtresi, Ön Fren Balatası"
            style={inputStyle}
          />
        </div>
      )}

      {/* 6. Açıklama/Detaylar */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Açıklama/Detaylar</label>
        <textarea
          name="aciklama"
          value={formData.aciklama}
          onChange={handleChange}
          placeholder="Yapılan işlemlerle ilgili detaylı notlar..."
          style={{...inputStyle, height: '80px'}}
        />
      </div>

      <button type="submit" style={buttonStyle}>
        Kaydı Ekle
      </button>
    </form>
  );
}

export default KayitFormu;


// *** Basit Mobil Uyumlu Stil Önerileri ***
const formStyle = {
    padding: '20px',
    margin: '20px 0',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    maxWidth: '500px', 
    marginLeft: 'auto',
    marginRight: 'auto'
};

const inputGroupStyle = {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
};

const labelStyle = {
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '0.9em'
};

const inputStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1em',
    minHeight: '40px' 
};

const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1.1em',
    cursor: 'pointer',
    marginTop: '10px'
};