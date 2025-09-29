import React, { useState, useEffect } from 'react';

// Formun alacağı verinin başlangıç yapısı
const initialFormData = {
  tip: 'Bakım', 
  tarih: new Date().toISOString().split('T')[0], 
  kilometre: '',
  maliyet: '',
  parcaAdi: '',
  aciklama: '',
};

function KayitFormu({ onKayitEkle, seciliAracID, duzenlenecekVeri, onGuncelle, onDuzenlemeyiIptalEt }) {
  const [formData, setFormData] = useState(initialFormData);

  // Düzenleme moduna girildiğinde formu yükler
  useEffect(() => {
    if (duzenlenecekVeri) {
        // Sayısal alanları input'ta göstermek için stringe çevir
        setFormData({
            ...duzenlenecekVeri,
            kilometre: duzenlenecekVeri.kilometre.toString(),
            maliyet: duzenlenecekVeri.maliyet.toString(),
        });
    } else {
        // Yeni kayıt modundayken formu temizler
        setFormData(initialFormData);
    }
  }, [duzenlenecekVeri]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.tip || !formData.tarih) {
        alert("İşlem Tipi ve Tarih alanları zorunludur!");
        return;
    }
    
    const temizlenmisVeri = {
        ...formData,
        // Kilometre ve maliyeti sayıya çeviriyoruz
        kilometre: parseInt(formData.kilometre) || 0,
        maliyet: parseFloat(formData.maliyet) || 0,
    };

    if (duzenlenecekVeri) {
        // GÜNCELLEME İŞLEMİ
        onGuncelle({ ...temizlenmisVeri, id: duzenlenecekVeri.id, aracID: duzenlenecekVeri.aracID });
    } else {
        // YENİ EKLEME İŞLEMİ
        if (!seciliAracID) {
            alert("Lütfen bir araç seçin!");
            return;
        }
        onKayitEkle(temizlenmisVeri);
    }
    
    // İşlem bitince formu sıfırla ve düzenleme modundan çık
    setFormData(initialFormData);
    if(duzenlenecekVeri) {
        onDuzenlemeyiIptalEt();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="kayit-formu" style={formStyle}>
      <h3>{duzenlenecekVeri ? 'Kaydı Düzenle' : 'Yeni İşlem Kaydı Ekle'}</h3>
      
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
        {duzenlenecekVeri ? 'Güncellemeyi Kaydet' : 'Kaydı Ekle'}
      </button>

      {/* Düzenleme modundayken İptal butonu */}
      {duzenlenecekVeri && (
          <button 
              type="button" 
              onClick={onDuzenlemeyiIptalEt}
              style={{...buttonStyle, backgroundColor: '#6c757d', marginTop: '5px'}}
          >
              İptal
          </button>
      )}
    </form>
  );
}

export default KayitFormu;


// *** Stil Tanımlamaları ***
const formStyle = {
    padding: '20px',
    margin: '20px auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    maxWidth: '500px', 
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