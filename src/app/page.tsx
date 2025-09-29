'use client'; 

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase.ts'; 
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; 
import Link from 'next/link'; 

import VehicleRegistrationForm from '@/components/VehicleRegistrationForm.tsx'; // YENİ FORM

// --- Veri Tipi ---
interface Vehicle {
    id: string;
    plaka: string;
    tanim: string;
    kilometre: number;
    user_id: string; 
}

// --- Yeni Tip: Hatırlatıcı Veri Yapısı ---
interface Hatirlatici {
    aracPlaka: string;
    tip: string;
    kalanGun: number;
    tarih: string;
}


export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    
    // Uygulama state'leri
    const [isFormOpen, setIsFormOpen] = useState(false); // Adım Adım Form Açık/Kapalı
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Araç listesi, tüm kayıtlar ve hata state'leri
    const [vehicles, setVehicles] = useState<Vehicle[]>([]); 
    const [allRecords, setAllRecords] = useState<any[]>([]); // Tümü
    const [fetchError, setFetchError] = useState('');


    // --- Fonksiyonlar ---

    // B. Veri Tabanından Araçları ve Kayıtları Çekme
    const fetchData = useCallback(async () => {
        if (!user) return;
        
        setFetchError('');
        
        // 1. Araçları Çek
        const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', user.id) 
            .order('plaka', { ascending: true }); 

        if (vehicleError) {
            setFetchError('Araçlar yüklenirken hata oluştu. RLS ayarlarını kontrol edin.');
            return;
        } 
        setVehicles(vehicleData as Vehicle[]);
        
        // 2. TÜM Bakım Kayıtlarını Çek (Hatırlatıcı için)
        const { data: recordsData, error: recordsError } = await supabase
            .from('bakim_kayitlari')
            .select('arac_id, tip, tarih, kilometre'); 

        if (recordsError) {
             // Bu sadece bir uyarıdır, kritik hata değil
             console.warn('Bakım kayıtları yüklenirken hata: ', recordsError);
        }
        setAllRecords(recordsData || []); // Veri yoksa boş dizi döndür
        setLoading(false);


    }, [user]); 
    
    
    // A. Kullanıcı oturumunu kontrol etme
    useEffect(() => {
        async function checkUser() {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
            } else {
                setUser(session.user);
            }
        }
        checkUser();
        
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/login');
            } else if (session) {
                setUser(session.user);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };

    }, [router]);
    
    // Veri Çekme useEffect'i
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);


    // D. Araç Silme İşlemi (Supabase DELETE)
    const handleDeleteVehicle = async (vehicleId: string, plaka: string) => {
        if (!confirm(`${plaka} plakalı aracı ve tüm bakım kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
            return;
        }
        
        setIsSubmitting(true);
        setFetchError('');
        
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', vehicleId);

        if (error) {
            setFetchError(`Silme işlemi başarısız: ${error.message}`);
        } else {
            // Başarılı olursa listeyi ve tüm kayıtları güncelle
            await fetchData(); 
        }

        setIsSubmitting(false);
    };


    // Çıkış yapma fonksiyonu
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // --- HATIRLATICI MANTIĞI (GÖRSELDEKİ ÖZELLİK) ---
    const yaklasanIslemler = useMemo(() => {
        const today = new Date().getTime();
        const alerts: Hatirlatici[] = [];
        
        const BAKIM_ARALIGI_AY = 12; 
        const HATIRLATMA_SURESI_GUN = 60; 

        vehicles.forEach(v => {
            const aracKayitlari = allRecords.filter(r => r.arac_id === v.id);
            const sonBakim = aracKayitlari.filter(r => r.tip === 'Motor Yağı').sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())[0];
            
            if (sonBakim) {
                const sonBakimTarih = new Date(sonBakim.tarih);
                
                // Tarih Bazlı Kontrol
                const sonrakiBakimTarih = new Date(sonBakimTarih.setMonth(sonBakimTarih.getMonth() + BAKIM_ARALIGI_AY));
                const kalanMs = sonrakiBakimTarih.getTime() - today;
                const kalanGun = Math.ceil(kalanMs / (1000 * 60 * 60 * 24));
                
                if (kalanGun <= HATIRLATMA_SURESI_GUN && kalanGun >= 0) {
                    alerts.push({
                        aracPlaka: v.plaka,
                        tip: 'Yıllık Bakım',
                        kalanGun: kalanGun,
                        tarih: sonrakiBakimTarih.toISOString().split('T')[0],
                    });
                }
            }
        });

        return alerts.sort((a, b) => a.kalanGun - b.kalanGun);

    }, [vehicles, allRecords]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold">Oturum kontrol ediliyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            
            {/* BAŞLIK (HEADER) */}
            <header className="bg-blue-600 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-extrabold text-white tracking-wide">
                        🚗 Araç Yönetim Sistemi V2
                    </h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-blue-100 hidden sm:inline">Hoş Geldiniz, {user?.email}</span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition duration-150 transform hover:scale-105 shadow-md"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </header>

            {/* ANA İÇERİK */}
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="bg-white p-8 shadow-2xl rounded-xl">
                    <p className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
                        Araç Yönetim Paneli
                    </p>
                    
                    {fetchError && <p className="text-red-500 mb-4 font-semibold p-2 border border-red-300 bg-red-50 rounded-md">{fetchError}</p>}
                    
                    
                    {/* YENİ: Araç Ekleme Butonu (Görseldeki gibi mobil odaklı) */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-700">Kayıtlı Araçlarım ({vehicles.length})</h2>
                         <button
                            onClick={() => setIsFormOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition transform hover:scale-105 text-sm"
                        >
                            ➕ Yeni Araç Kaydı Başlat
                        </button>
                    </div>
                    
                    {/* HATIRLATICI PANELİ */}
                    {yaklasanIslemler.length > 0 && (
                        <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 rounded-xl shadow-md">
                            {/* ... (Hatırlatıcı kodları aynı) ... */}
                            <h3 className="text-xl font-bold text-yellow-800 mb-3 flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>Yaklaşan Önemli İşlemler ({yaklasanIslemler.length})</span>
                            </h3>
                            <div className="space-y-3">
                                {yaklasanIslemler.map((alert, index) => (
                                    <p key={index} className="text-sm text-yellow-900 bg-yellow-50 p-2 rounded-md border border-yellow-200">
                                        <span className="font-bold">{alert.aracPlaka}:</span> {alert.tip} yaklaşıyor! 
                                        {alert.tip === 'Km Bakımı' ? 
                                            ` Kalan KM: ${alert.kalanGun.toLocaleString()} km` : 
                                            ` Kalan Gün: ${alert.kalanGun} gün (${alert.tarih})`
                                        }
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ARAÇ LİSTESİ (Profesyonel Tablo Görünümü) */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 shadow-lg rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plaka / Tanım</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Kilometre</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vehicles.map((v) => (
                                    <tr key={v.id} className="hover:bg-indigo-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{v.plaka}</div>
                                            <div className="text-xs text-gray-500">{v.tanim}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                            <div className="text-sm text-gray-700">{v.kilometre.toLocaleString()} km</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2 items-center">
                                            
                                            {/* Bakım Kayıtları Butonu */}
                                            <Link href={`/vehicles/${v.id}`} className="text-indigo-600 hover:text-indigo-900 transition duration-150 p-2 rounded-md bg-indigo-50 hover:bg-indigo-100">
                                                Kayıtlar
                                            </Link>
                                            
                                            {/* SİL BUTONU */}
                                            <button
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    handleDeleteVehicle(v.id, v.plaka); 
                                                }}
                                                className="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-md bg-red-50 hover:bg-red-100"
                                                title="Aracı Sil"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.86 12.04a2 2 0 01-2 1.96H7.86a2 2 0 01-2-1.96L5 7m4 0V4a1 1 0 011-1h4a1 1 0 011 1v3m-3 0h-2" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {vehicles.length === 0 && (
                        <p className="text-center text-gray-500 p-10">Henüz kayıtlı bir aracınız bulunmamaktadır. Lütfen yukarıdaki formu kullanın.</p>
                    )}

                </div>
            </main>
            
            {/* ADIM ADIM FORM MODALI */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-3xl max-w-xl w-full p-6 relative">
                        {/* Kapat butonu */}
                        <button 
                            onClick={() => setIsFormOpen(false)} 
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        {/* Form Komponenti */}
                        <VehicleRegistrationForm onSuccess={() => {
                            setIsFormOpen(false); // Formu kapat
                            fetchData(); // Araç listesini yenile
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
}