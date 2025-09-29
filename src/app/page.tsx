'use client'; 

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase.ts'; 
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; 
import Link from 'next/link'; 

// --- Veri Tipleri ---
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

// --- Ana Sayfa Komponenti ---
export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    
    // Araç ekleme form state'leri
    const [plaka, setPlaka] = useState('');
    const [tanim, setTanim] = useState('');
    const [kilometre, setKilometre] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Araç listesi, tüm kayıtlar ve hata state'leri
    const [vehicles, setVehicles] = useState<Vehicle[]>([]); 
    const [allRecords, setAllRecords] = useState<any[]>([]); // Tümü
    const [fetchError, setFetchError] = useState('');


    // --- Fonksiyonlar ---

    // A. Kullanıcı oturumunu kontrol etme
    useEffect(() => {
        async function checkUser() {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
            } else {
                setUser(session.user);
                setLoading(false);
            }
        }
        checkUser();
        
        // Oturum dinleyicisi
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
        // RLS kuralı, sadece kullanıcının araçlarına ait kayıtları getirecektir.
        const { data: recordsData, error: recordsError } = await supabase
            .from('bakim_kayitlari')
            .select('arac_id, tip, tarih, kilometre'); // Sadece gerekli kolonları çekiyoruz

        if (recordsError) {
             setFetchError('Bakım kayıtları yüklenirken hata oluştu.');
             return;
        }
        setAllRecords(recordsData);


    }, [user]); 
    
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);


    // C. Yeni Araç Ekleme İşlemi (Supabase INSERT)
    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return; 

        setIsSubmitting(true);
        setFetchError('');
        
        const newVehicle = {
            plaka: plaka.toUpperCase(),
            tanim: tanim || `Kayıtlı Araç (${plaka})`,
            kilometre: parseInt(kilometre) || 0,
            user_id: user.id,
        };

        const { data, error } = await supabase
            .from('vehicles')
            .insert([newVehicle])
            .select(); 

        if (error) {
            console.error(error);
            setFetchError(`Araç eklenirken hata oluştu: ${error.message}`);
        } else {
            // Başarılı olursa listeyi güncelle ve veriyi tekrar çek
            await fetchData(); 
            setPlaka('');
            setTanim('');
            setKilometre('');
        }

        setIsSubmitting(false);
    };

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
            // Listeyi ve tüm kayıtları güncelle
            await fetchData(); 
        }

        setIsSubmitting(false);
    };


    // Çıkış yapma fonksiyonu
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // --- YENİ MANTIK: Hatırlatıcıları Hesaplama ---
    const yaklasanIslemler = useMemo(() => {
        const today = new Date().getTime();
        const alerts: Hatirlatici[] = [];
        
        // ÖRNEK: Her 1 yıl veya 15.000 km'de bir bakımı zorunlu kılalım.
        const BAKIM_ARALIGI_AY = 12; // Ay
        const HATIRLATMA_SURESI_GUN = 60; // 60 gün öncesinden uyarı ver

        vehicles.forEach(v => {
            // O araca ait tüm bakım kayıtlarını filtrele
            const aracKayitlari = allRecords.filter(r => r.arac_id === v.id);

            // Son Bakım Kaydını bul (en son tarihli olanı)
            const sonBakim = aracKayitlari.filter(r => r.tip === 'Bakım').sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())[0];
            
            if (sonBakim) {
                const sonBakimTarih = new Date(sonBakim.tarih);
                
                // 1. Tarih Bazlı Kontrol
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
                
                // 2. Kilometre Bazlı Kontrol (Son bakımın kilometre kaydını kullanıyoruz)
                const sonrakiBakimKm = sonBakim.kilometre + 15000; // Son bakımdan 15000 km sonra
                const kalanKm = sonrakiBakimKm - v.kilometre;
                
                if (kalanKm <= 1000 && kalanKm > 0) { // Son 1000 km kala uyar
                     alerts.push({
                        aracPlaka: v.plaka,
                        tip: 'Km Bakımı',
                        kalanGun: Math.floor(kalanKm),
                        tarih: `Mevcut KM: ${v.kilometre.toLocaleString()}`,
                    });
                }

            }
        });

        // Kalan gün sayısına göre sırala (en acil olan en üstte)
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
                    
                    {/* YENİ: HATIRLATICI PANELİ */}
                    {yaklasanIslemler.length > 0 && (
                        <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 rounded-lg shadow-md">
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
                    
                    {fetchError && <p className="text-red-500 mb-4 font-semibold p-2 border border-red-300 bg-red-50 rounded-md">{fetchError}</p>}
                    
                    {/* YENİ ARAÇ EKLEME FORMU */}
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Yeni Araç Ekle</h2>
                    <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 border rounded-lg bg-gray-50 shadow-inner">
                        
                        {/* Plaka */}
                        <input
                            type="text"
                            placeholder="Plaka (Örn: 07 ABC 123)"
                            value={plaka}
                            onChange={(e) => setPlaka(e.target.value)}
                            required
                            className="col-span-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            disabled={isSubmitting}
                        />

                        {/* Tanım */}
                        <input
                            type="text"
                            placeholder="Tanım (Örn: Lojistik Kamyonet)"
                            value={tanim}
                            onChange={(e) => setTanim(e.target.value)}
                            className="col-span-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            disabled={isSubmitting}
                        />
                        
                        {/* Kilometre */}
                        <input
                            type="number"
                            placeholder="Kilometre"
                            value={kilometre}
                            onChange={(e) => setKilometre(e.target.value)}
                            required
                            className="col-span-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            disabled={isSubmitting}
                        />
                        
                        {/* Ekle Butonu */}
                        <button
                            type="submit"
                            className="col-span-1 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition duration-150 disabled:opacity-50"
                            disabled={isSubmitting || !plaka}
                        >
                            {isSubmitting ? 'Ekleniyor...' : 'Aracı Ekle'}
                        </button>
                    </form>
                    
                    {/* ARAÇ LİSTESİ (Profesyonel Tablo Görünümü) */}
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 mt-8 border-t pt-4">Kayıtlı Araçlarım ({vehicles.length})</h2>
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
        </div>
    );
}