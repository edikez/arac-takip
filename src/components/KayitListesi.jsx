import React, { useState } from 'react';

// Kayıt Tipi Renklendirmesi için Basit Yardımcı Fonksiyon
const getTypeColor = (tip) => {
    switch (tip) {
        case 'Bakım': return '#17a2b8';
        case 'Muayene': return '#28a745';
        case 'Parça Değişimi': return '#ffc107';
        case 'Yıkama': return '#007bff';
        case 'Kaza/Hasar': return '#dc3545';
        default: return '#6c757d';
    }
};

function KayitListesi({ kayitlar, onKayitSil, onKayitDuzenle }) {
    const [filtre, setFiltre] = useState('Hepsi');
    
    // Filtrelenmiş Kayıtları Hesaplama
    const filtrelenmisKayitlar = kayitlar.filter(kayit => {
        if (filtre === 'Hepsi') {
            return true;
        }
        return kayit.tip === filtre;
    });

    return (
        <div style={listContainerStyle}>
            
            {/* Filtreleme Butonları */}
            <div style={filterGroupStyle}>
                <h4 style={{marginBottom: '10px', width: '100%'}}>Filtrele:</h4>
                {['Hepsi', 'Bakım', 'Muayene', 'Yıkama', 'Parça Değişimi', 'Diğer'].map(tip => (
                    <button
                        key={tip}
                        onClick={() => setFiltre(tip)}
                        style={{
                            ...filterButtonStyle,
                            backgroundColor: filtre === tip ? getTypeColor(tip) : '#e9ecef',
                            color: filtre === tip ? (filtre === 'Parça Değişimi' ? '#333' : 'white') : '#333',
                            borderColor: getTypeColor(tip)
                        }}
                    >
                        {tip} ({kayitlar.filter(k => k.tip === tip).length})
                    </button>
                ))}
            </div>
            
            <h3 style={{marginTop: '20px'}}>
                {filtre === 'Hepsi' ? 'Tüm' : filtre} İşlemler ({filtrelenmisKayitlar.length} Kayıt)
            </h3>

            {/* Kayıtların Listelenmesi */}
            {filtrelenmisKayitlar.length === 0 && (
                <p style={{color: '#999', padding: '20px'}}>Seçilen kritere uygun kayıt bulunamadı.</p>
            )}
            
            {filtrelenmisKayitlar.map((kayit) => (
                <div key={kayit.id} style={cardStyle}>
                    <div style={{...tipBadgeStyle, backgroundColor: getTypeColor(kayit.tip)}}>
                        {kayit.tip}
                    </div>
                    
                    <h4 style={{margin: '0 0 5px 0'}}>🗓️ {kayit.tarih}</h4>
                    
                    {kayit.kilometre > 0 && (
                        <p style={detailStyle}>**Kilometre:** {kayit.kilometre.toLocaleString()} km</p>
                    )}
                    
                    {kayit.maliyet > 0 && (
                        <p style={detailStyle}>**Maliyet:** {kayit.maliyet.toFixed(2)} TL</p>
                    )}
                    
                    {kayit.parcaAdi && kayit.tip === 'Parça Değişimi' && (
                        <p style={detailStyle}>**Takılan Parça:** {kayit.parcaAdi}</p>
                    )}
                    
                    {kayit.aciklama && (
                        <p style={{...detailStyle, fontStyle: 'italic'}}>**Açıklama:** {kayit.aciklama}</p>
                    )}

                    <div style={buttonGroupStyle}> 
                        <button 
                            onClick={() => onKayitDuzenle(kayit)}
                            style={editButtonStyle}
                        >
                            ✏️ Düzenle
                        </button>

                        <button 
                            onClick={() => onKayitSil(kayit.id)}
                            style={deleteButtonStyle}
                        >
                            🗑️ Sil
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default KayitListesi;

// *** Stil Tanımlamaları ***
const listContainerStyle = {
    padding: '20px 10px',
    maxWidth: '600px', 
    margin: '0 auto',
};

const filterGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #ccc',
    paddingBottom: '15px'
};

const filterButtonStyle = {
    padding: '8px 12px',
    borderRadius: '20px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.8em',
    fontWeight: 'bold',
    flexShrink: 0
};

const cardStyle = {
    border: '1px solid #e0e0e0',
    padding: '15px',
    margin: '10px 0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    textAlign: 'left',
    position: 'relative',
    overflow: 'hidden',
};

const tipBadgeStyle = {
    position: 'absolute',
    top: '0',
    right: '0',
    color: 'white',
    padding: '4px 10px',
    fontSize: '0.8em',
    fontWeight: 'bold',
    borderBottomLeftRadius: '8px'
};

const detailStyle = {
    margin: '5px 0',
    fontSize: '0.95em',
    lineHeight: '1.4'
};

const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '15px'
};

const editButtonStyle = {
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
};

const deleteButtonStyle = {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
};