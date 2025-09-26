import React, { useState, useEffect, useCallback } from 'react';
import KayitFormu from './components/KayitFormu'; 
import KayitListesi from './components/KayitListesi'; 
import BakimGrafigi from './components/BakimGrafigi'; 
import AracEkleFormu from './components/AracEkleFormu'; // YENİ: Araç Ekleme Formu
import './App.css'; 

// Local Storage'da tutulacak anahtarlar
const KAYITLAR_STORAGE_KEY = 'aracTakipKayitlari';
const ARACLAR_STORAGE_KEY = 'aracTakipAraclari';

// Başlangıç Araç Listesi (Sadece ilk çalıştırmada kullanılacak)
const DEFAULT_ARACLAR = [
    { id: 'AEE880', plaka: '07 AEE 880', tanim: 'Servis Aracı 1' },
    { id: 'BSD384', plaka: '07 BSD 384', tanim: 'Servis Aracı 2' },
    { id: 'GRC38', plaka: '07 GRC 38', tanim: 'Kamyonet' },
    { id: 'BRP434', plaka: '07 BRP 434', tanim: 'Servis Aracı 3' },
];


function App() {
  const [kayitlar, setKayitlar] = useState([]);
  const [araclar, setAraclar] = useState([]); // ARTIK DİNAMİK ARAÇ LİSTESİ
  const [seciliAracID, setSeciliAracID] = useState(null); 
  const [duzenlenenKayit, setDuzenlenenKayit] = useState(null); 

  // A. Verileri Local Storage'dan Yükle (Araçlar ve Kayıtlar)
  useEffect(() => {
    try {
      // 1. Kayıtları Yükle
      const storedKayitlar = localStorage.getItem(KAYITLAR_STORAGE_KEY);
      if (storedKayitlar) {
        const parsedKayitlar = JSON.parse(storedKayitlar);
        parsedKayitlar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)); 
        setKayitlar(parsedKayitlar);
      }
      
      // 2. Araçları Yükle
      const storedAraclar = localStorage.getItem(ARACLAR_STORAGE_KEY);
      let initialAraclar = [];
      if (storedAraclar) {
        initialAraclar = JSON.parse(storedAraclar);
      } else {
        // İlk kez çalışıyorsa, başlangıç listesini kullan ve kaydet
        initialAraclar = DEFAULT_ARACLAR;
        localStorage.setItem(ARACLAR_STORAGE_KEY, JSON.stringify(DEFAULT_ARACLAR));
      }
      
      setAraclar(initialAraclar);

      // Seçili aracı ilk yüklenen araç yap
      if (initialAraclar.length > 0) {
          setSeciliAracID(initialAraclar[0].id);
      }

    } catch (error) {
      console.error("Local Storage'dan veri okunurken hata oluştu:", error);
    }
  }, []); 

  // B. Kayıtlar Değiştiğinde Local Storage'a Kaydet
  useEffect(() => {
    try {
      localStorage.setItem(KAYITLAR_STORAGE_KEY, JSON.stringify(kayitlar));
    } catch (error) {
      console.error("Kayıtlar Local Storage'a yazılırken hata oluştu:", error);
    }
  }, [kayitlar]); 
  
  // C. Araçlar Değiştiğinde Local Storage'a Kaydet
  useEffect(() => {
    try {
      localStorage.setItem(ARACLAR_STORAGE_KEY, JSON.stringify(araclar));
    } catch (error) {
      console.error("Araçlar Local Storage'a yazılırken hata oluştu:", error);
    }
  }, [araclar]); 

  // D. Yeni Araç Ekleme Fonksiyonu
  const yeniAracEkle = useCallback((yeniAracVerisi) => {
      // Plakadan basit bir ID oluştur, benzersiz olduğundan emin olmalıyız
      const aracID = yeniAracVerisi.plaka.replace(/\s/g, '').toUpperCase();
      
      if (araclar.find(a => a.id === aracID)) {
          alert("Bu plakaya ait bir araç zaten ekli!");
          return;
      }

      const yeniArac = {
          id: aracID,
          plaka: yeniAracVerisi.plaka,
          tanim: yeniAracVerisi.tanim || 'Yeni Araç',
      };
      
      setAraclar(prevAraclar => [...prevAraclar, yeniArac]);
      setSeciliAracID(yeniArac.id); // Yeni eklenen aracı seçili yap
      alert(`Araç ${yeniArac.plaka} başarıyla eklendi!`);
  }, [araclar]);

  // E. Yeni Kayıt Ekleme Fonksiyonu
  const yeniKayitEkle = (yeniVeri) => {
    const yeniKayit = {
      id: Date.now(), 
      aracID: seciliAracID, 
      ...yeniVeri
    };
    setKayitlar(prevKayitlar => [yeniKayit, ...prevKayitlar]); 
  };

  // F. Kayıt Silme, Düzenleme Başlatma ve Güncelleme fonksiyonları (Değişmedi)
  const kayitSil = (id) => {
    if(window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
        setKayitlar(prevKayitlar => prevKayitlar.filter(kayit => kayit.id !== id));
    }
  };
  
  const kayitDuzenlemeyiBaslat = (kayit) => {
      setDuzenlenenKayit(kayit);
  };

  const kayitGuncelle = (guncelVeri) => {
      setKayitlar(prevKayitlar => 
          prevKayitlar.map(kayit => 
              kayit.id === guncelVeri.id ? guncelVeri : kayit
          )
      );
      setDuzenlenenKayit(null);
  };
  
  // G. Görüntülenecek Kayıtları ve Seçili Aracı Hesapla
  const seciliAracKayitlari = kayitlar.filter(
    (kayit) => kayit.aracID === seciliAracID
  );
  
  const seciliArac = araclar.find(a => a.id === seciliAracID);

  return (
    <div className="App" style={appStyle}>
      
      <header style={{...headerStyle, backgroundColor: '#217b7b'}}>
        <h1>🚗 Araç Takip Sistemi</h1>
      </header>
      
      {/* YENİ: Araç Ekleme Formu */}
      <AracEkleFormu onAracEkle={yeniAracEkle} />
      
      <hr style={{width: '90%', margin: '20px auto', borderTop: '1px solid #ccc'}} />

      {/* 1. Araç Seçim Alanı */}
      <div style={aracSecimStyle}>
          <label style={{fontWeight: 'bold', marginRight: '10px'}}>Aracı Seç:</label>
          {araclar.length > 0 ? (
            <select 
                value={seciliAracID || ''} 
                onChange={(e) => setSeciliAracID(e.target.value)}
                style={selectStyle}
            >
                {araclar.map(arac => (
                    <option key={arac.id} value={arac.id}>
                        {arac.plaka} - {arac.tanim}
                    </option>
                ))}
            </select>
          ) : (
            <p style={{margin: 0, color: 'red'}}>Lütfen önce araç ekleyin.</p>
          )}
      </div>

      {/* 2. Başlık ve Kayıt Sayısı */}
      <div style={{...headerStyle, backgroundColor: '#0056b3', marginTop: '0'}}>
        <h2>{seciliArac?.plaka || 'Araç Seçilmedi'}</h2>
        <p style={{fontSize: '0.9em', fontWeight: 'bold'}}>Toplam **{seciliAracKayitlari.length}** İşlem Kaydı</p>
      </div>
      
      {/* 3. Kayıt Ekleme/Düzenleme Formu */}
      {seciliAracID && (
          <KayitFormu 
              onKayitEkle={yeniKayitEkle} 
              seciliAracID={seciliAracID}
              duzenlenecekVeri={duzenlenenKayit}
              onGuncelle={kayitGuncelle}
              onDuzenlemeyiIptalEt={() => setDuzenlenenKayit(null)}
          /> 
      )}

      <hr style={{width: '90%', margin: '30px auto', borderTop: '1px solid #ccc'}} />

      {/* 4. Grafik Komponenti */}
      {seciliAracID && <BakimGrafigi kayitlar={seciliAracKayitlari} />} 

      <hr style={{width: '90%', margin: '30px auto', borderTop: '1px solid #ccc'}} />

      {/* 5. Kayıt Listesi Komponenti */}
      {seciliAracID && (
          <KayitListesi 
              kayitlar={seciliAracKayitlari} 
              onKayitSil={kayitSil} 
              onKayitDuzenle={kayitDuzenlemeyiBaslat}
          />
      )}
      
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
    borderRadius: '8px',
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