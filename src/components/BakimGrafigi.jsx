import React from 'react';
import { Pie } from 'react-chartjs-2';
// Chart.js'in React ile çalışması için gerekli öğeler
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Chart.js'i bu öğelerle kaydettik
ChartJS.register(ArcElement, Tooltip, Legend);

function BakimGrafigi({ kayitlar }) {
    // 1. Veri Hazırlama: Kayıtları Türlerine Göre Grupla
    const counts = kayitlar.reduce((acc, kayit) => {
        acc[kayit.tip] = (acc[kayit.tip] || 0) + 1;
        return acc;
    }, {});
    
    // Eğer hiç kayıt yoksa, grafiği gösterme
    if (kayitlar.length === 0) {
        return null;
    }

    // 2. Grafik Verisi Objesini Oluşturma
    const data = {
        labels: Object.keys(counts), // Bakım, Muayene, Yıkama vb.
        datasets: [
            {
                label: '# İşlem Sayısı',
                data: Object.values(counts), // Sayılar (3, 5, 2 vb.)
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)', // Kırmızı (Bakım)
                    'rgba(54, 162, 235, 0.6)', // Mavi (Muayene)
                    'rgba(255, 206, 86, 0.6)', // Sarı (Yıkama)
                    'rgba(75, 192, 192, 0.6)', // Cam Yeşili (Parça Değişimi)
                    'rgba(153, 102, 255, 0.6)', // Mor (Kaza/Hasar)
                    'rgba(255, 159, 64, 0.6)', // Turuncu (Diğer)
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div style={graphContainerStyle}>
            <h4>İşlem Türü Dağılımı Grafiği</h4>
            <Pie data={data} />
        </div>
    );
}

export default BakimGrafigi;

// *** Stil Tanımlamaları ***
const graphContainerStyle = { 
    maxWidth: '400px', 
    margin: '30px auto', 
    padding: '15px', 
    backgroundColor: '#fff', 
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};