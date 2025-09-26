import React, { useState } from 'react';

const initialForm = {
    plaka: '',
    tanim: '',
};

function AracEkleFormu({ onAracEkle }) {
    const [formData, setFormData] = useState(initialForm);
    const [isFormVisible, setIsFormVisible] = useState(false); // Formu gizle/göster

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.plaka.trim()) {
            alert("Plaka alanı boş bırakılamaz!");
            return;
        }

        onAracEkle(formData);
        setFormData(initialForm); // Formu temizle
        setIsFormVisible(false); // Formu gizle
    };
    
    // Formun stili
    const formStyle = {
        padding: '20px',
        margin: '10px auto',
        border: '1px solid #217b7b',
        borderRadius: '8px',
        backgroundColor: '#f1fafa',
        maxWidth: '500px',
        textAlign: 'left',
    };
    
    const inputStyle = {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '10px',
    };
    
    const buttonStyle = {
        padding: '10px',
        width: '100%',
        backgroundColor: '#217b7b',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    };

    if (!isFormVisible) {
        return (
            <button 
                onClick={() => setIsFormVisible(true)} 
                style={{...buttonStyle, backgroundColor: '#28a745', maxWidth: '500px', margin: '15px auto', display: 'block'}}
            >
                ➕ Yeni Araç Ekle
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <h4>Yeni Araç Tanımla</h4>
            
            <label>Plaka (Örn: 07 ABC 123) *</label>
            <input
                type="text"
                name="plaka"
                value={formData.plaka}
                onChange={handleChange}
                placeholder="Plaka Girin"
                required
                style={inputStyle}
            />
            
            <label>Tanım (Örn: Lojistik Kamyonet)</label>
            <input
                type="text"
                name="tanim"
                value={formData.tanim}
                onChange={handleChange}
                placeholder="Araç Tanımı"
                style={inputStyle}
            />
            
            <button type="submit" style={buttonStyle}>Aracı Kaydet</button>
            <button 
                type="button" 
                onClick={() => {setFormData(initialForm); setIsFormVisible(false);}}
                style={{...buttonStyle, backgroundColor: '#dc3545', marginTop: '5px'}}
            >
                İptal
            </button>
        </form>
    );
}

export default AracEkleFormu;