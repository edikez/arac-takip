import React, { useState, useEffect } from 'react';
import KayitFormu from './components/KayitFormu'; 
import KayitListesi from './components/KayitListesi'; 
import './App.css'; // Varsayılan CSS dosyanız

// Local Storage'da verileri saklamak için kullanacağımız anahtar
const STORAGE_KEY = 'aracTakipVerileri';

// Takip Edilecek Araçların Sabit Listesi (Sizin Listenizden)
const ARACLAR = [
    { id: 'AEE880', plaka: '07 AEE 880', tanim: 'Servis Aracı 1' },
    { id: 'BSD384', plaka: '07 BSD 384', tanim: 'Servis Aracı 2' },
    { id: 'GRC38', plaka: '07 GRC 38', tanim: 'Kamyonet' },
    { id: 'BRP434', plaka: '07 BRP 434', tanim: 'Servis Aracı 3' },
    { id: 'ANF532', plaka: '07 ANF 532', tanim: 'Müdür Aracı' },
    { id: 'BKS207', plaka: '07 BKS 207', tanim: 'Yedek Servis' },
    { id: 'CBJ632', plaka: '07 CBJ 632', tanim: 'Lojistik Aracı' },
];


function App() {
  const [kayitlar, setKayitlar] = useState([]);
  // Varsayılan olarak listedeki ilk aracı seçili yapıyoruz.
  const [seciliAracID, setSeciliAracID] = useState(ARACLAR[0].id); 
  
  // A. Verileri Local Storage'dan Yükle (Uygulama Başlangıcı)
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // En yeni kaydı en üstte göstermek için tarihe göre sırala
        parsedData.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)); 
        setKayitlar(parsedData);
      }
    } catch (error) {
      console.error("Local Storage'dan veri okunurken hata oluştu:", error);
    }
  }, []); 

  // B. Kayıtlar Değiştiğinde Local Storage'a Kaydet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(kayitlar));
    } catch (error) {
      console.error("Local Storage'a veri yazılırken hata oluştu:", error);
    }
  }, [kayitlar]); 

  // C. Yeni Kayıt Ekleme Fonksiyonu
  const yeniKayitEkle = (yeniVeri) => {
    const yeniKayit = {
      id: Date.now(), 
      aracID: seciliAracID, // Hangi araca ait olduğunu kaydediyoruz
      ...yeniVeri
    };
    setKayitlar(prevKayitlar => [yeniKayit, ...prevKayitlar]); 
  };


  // D. Kayıt Silme Fonksiyonu
  const kayitSil = (id) => {
    if(window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
        setKayitlar(prevKayitlar => prevKayitlar.filter(kayit => kayit.id !== id));
    }
  };


  // E. Görüntülenecek Kayıtları ve Seçili Aracı Hesapla
  const seciliAracKayitlari = kayitlar.filter(
    (kayit) => kayit.aracID === seciliAracID
  );
  
  const seciliArac = ARACLAR.find(a => a.id === seciliAracID);

  return (
    <div className="App" style={appStyle}>
      
      {/* 1. Araç Seçim Alanı */}
      <div style={aracSecimStyle}>
          <label style={{fontWeight: 'bold', marginRight: '10px'}}>Aracı Seç:</label>
          <select 
              value={seciliAracID} 
              onChange={(e) => setSeciliAracID(e.target.value)}
              style={selectStyle}
          >
              {ARACLAR.map(arac => (
                  <option key={arac.id} value={arac.id}>
                      {arac.plaka} - {arac.tanim}
                  </option>
              ))}
          </select>
      </div>

      {/* 2. Başlık ve Kayıt Sayısı */}
      <header style={{...headerStyle, backgroundColor: '#0056b3'}}>
        <h2>{seciliArac?.plaka || 'Araç Seçilmedi'}</h2>
        <p style={{fontSize: '0.9em', fontWeight: 'bold'}}>Toplam **{seciliAracKayitlari.length}** İşlem Kaydı</p>
      </header>
      
      {/* 3. Kayıt Ekleme Formu */}
      <KayitFormu onKayitEkle={yeniKayitEkle} seciliAracID={seciliAracID} /> 

      <hr style={{width: '90%', margin: '30px auto', borderTop: '1px solid #ccc'}} />

      {/* 4. Kayıt Listesi Komponenti */}
      <KayitListesi 
          kayitlar={seciliAracKayitlari} 
          onKayitSil={kayitSil} 
      />
      
    </div>
  );
}

export default App;


// *** Stil Tanımlamaları ***
const appStyle = {
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
};

const headerStyle = {
    color: 'white',
    padding: '15px 10px',
    borderRadius: '8px 8px 8px 8px', // Sadece altta değil, tüm kutuda yuvarlak hat
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    maxWidth: '600px', 
    margin: '0 auto 20px auto',
};

const aracSecimStyle = {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    marginBottom: '20px',
    maxWidth: '600px', 
    margin: '20px auto 10px auto',
    borderRadius: '8px'
};

const selectStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1em',
    minWidth: '200px',
    minHeight: '40px' 
};