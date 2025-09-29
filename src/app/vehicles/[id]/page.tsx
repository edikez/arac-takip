'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase.ts';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// --- Veri Tipleri ---
interface Vehicle {
    id: string;
    plaka: string;
    tanim: string;
    kilometre: number;
}

interface BakimKaydi {
    id: string;
    arac_id: string;
    tip: string;
    tarih: string;
    kilometre: number;
    maliyet: number;
    aciklama: string;
}

// --- Ana Sayfa Komponenti ---
export default function VehicleDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const aracId = params.id; // URL'den gelen araç ID'si
    
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [kayitlar, setKayitlar] = useState<BakimKaydi[]>([]);
    const [fetchError, setFetchError] = useState('');
    
    // Form State'i
    const [tip, setTip] = useState('Bakım');
    const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
    const [kilometre, setKilometre] = useState('');
    const [maliyet, setMaliyet] = useState('');
    const [aciklama, setAciklama] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    // A. Kullanıcı ve Araç Kontrolü (Sayfa Koruması)
    useEffect(() => {
        async function checkUserAndFetchVehicle() {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login'); // Giriş yapmadıysa yönlendir
                return;
            }
            
            setUser(session.user);
            
            // 1. Araç Detaylarını Çek
            const { data: vehicleData, error: vehicleError } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', aracId)
                .single(); // Tek bir sonuç bekliyoruz

            if (vehicleError || !vehicleData) {
                console.error(vehicleError);
                setFetchError('Araç bilgileri yüklenirken hata oluştu veya araç bulunamadı.');
                router.push('/'); // Ana listeye geri dön
                return;
            }
            
            setVehicle(vehicleData as Vehicle);

            // 2. Bakım Kayıtlarını Çek
            fetchBakimKayitlari(vehicleData.id);
            setLoading(false);
        }
        
        checkUserAndFetchVehicle();
    }, [aracId, router]);


    // B. Bakım Kayıtlarını Çekme Fonksiyonu
    const fetchBakimKayitlari = async (id: string) => {
        setFetchError('');
        
        // RLS (Row Level Security) sayesinde sadece kullanıcının kendi kayıtları dönecektir.
        const { data, error } = await supabase
            .from('bakim_kayitlari')
            .select('*')
            .eq('arac_id', id)
            .order('tarih', { ascending: false }); // En yeniyi en üste al

        if (error) {
            console.error(error);
            setFetchError('Bakım kayıtları yüklenirken hata oluştu.');
        } else {
            setKayitlar(data as BakimKaydi[]);
        }
    };


    // C. Yeni Bakım Kaydı Ekleme İşlemi (Supabase INSERT)
    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !vehicle) return;

        setIsSubmitting(true);
        setFetchError('');
        
        const newRecord = {
            arac_id: vehicle.id,
            tip: tip,
            tarih: tarih,
            kilometre: parseInt(kilometre) || 0,
            maliyet: parseFloat(maliyet) || 0,
            aciklama: aciklama,
        };

        const { data, error } = await supabase
            .from('bakim_kayitlari')
            .insert([newRecord])
            .select();

        if (error) {
            console.error(error);
            setFetchError(`Kayıt eklenirken hata oluştu: ${error.message}`);
        } else {
            // Listeyi yeni kayıtla güncelle
            setKayitlar(prev => [data[0] as BakimKaydi, ...prev]);
            
            // Formu temizle (tarih ve tip hariç)
            setKilometre('');
            setMaliyet('');
            setAciklama('');
            alert(`Yeni ${tip} kaydı başarıyla eklendi!`);
        }
        setIsSubmitting(false);
    };


    // Çıkış yapma fonksiyonu
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };
    
    // --- Yüklenme Durumu ---
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold">Araç detayları yükleniyor...</div>
            </div>
        );
    }
    
    // --- Ana Arayüz ---
    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <header className="bg-blue-600 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-extrabold text-white tracking-wide cursor-pointer" onClick={() => router.push('/')}>
                        ← Geri Dön
                    </h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-blue-100 hidden sm:inline">{user?.email}</span>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600">Çıkış Yap</button>
                    </div>
                </div>
            </header>

            {/* ANA İÇERİK */}
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="bg-white p-8 shadow-2xl rounded-xl">
                    
                    {/* ARAÇ BAŞLIĞI */}
                    <div className="bg-gray-100 p-6 rounded-lg mb-6 border-b-4 border-blue-500">
                        <h2 className="text-3xl font-extrabold text-gray-900">{vehicle?.plaka}</h2>
                        <p className="text-xl text-gray-600 mt-1">{vehicle?.tanim} - {vehicle?.kilometre.toLocaleString()} km</p>
                    </div>
                    
                    {fetchError && <p className="text-red-500 mb-4 font-semibold">{fetchError}</p>}

                    {/* BAKIM KAYDI EKLEME FORMU */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Yeni Bakım Kaydı Ekle</h3>
                    <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 p-4 border rounded-lg bg-indigo-50 shadow-inner">
                        
                        {/* İşlem Tipi */}
                        <select 
                            value={tip} 
                            onChange={(e) => setTip(e.target.value)}
                            className="p-3 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSubmitting}
                        >
                            <option value="Bakım">Bakım</option>
                            <option value="Muayene">Muayene</option>
                            <option value="Yıkama">Yıkama</option>
                            <option value="Parça Değişimi">Parça Değişimi</option>
                            <option value="Diğer">Diğer</option>
                        </select>
                        
                        {/* Tarih */}
                        <input
                            type="date"
                            value={tarih}
                            onChange={(e) => setTarih(e.target.value)}
                            required
                            className="p-3 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSubmitting}
                        />

                        {/* Kilometre */}
                        <input
                            type="number"
                            placeholder="Kilometre"
                            value={kilometre}
                            onChange={(e) => setKilometre(e.target.value)}
                            required
                            className="p-3 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSubmitting}
                        />

                        {/* Maliyet */}
                        <input
                            type="number"
                            placeholder="Maliyet (TL)"
                            value={maliyet}
                            onChange={(e) => setMaliyet(e.target.value)}
                            className="p-3 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSubmitting}
                        />
                        
                        {/* Açıklama */}
                        <textarea
                            placeholder="Detaylar ve notlar..."
                            value={aciklama}
                            onChange={(e) => setAciklama(e.target.value)}
                            className="col-span-1 md:col-span-2 p-3 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 h-20 resize-none"
                            disabled={isSubmitting}
                        />
                        
                        {/* Ekle Butonu */}
                        <button
                            type="submit"
                            className="col-span-1 md:col-span-3 p-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Kaydediliyor...' : 'Bakım Kaydını Ekle'}
                        </button>
                    </form>


                    {/* BAKIM KAYIT LİSTESİ */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 mt-10">Tüm Bakım Kayıtları ({kayitlar.length})</h3>
                    <div className="space-y-4">
                        {kayitlar.map((kayit) => (
                            <div key={kayit.id} className="p-4 border border-gray-200 rounded-lg shadow-sm flex justify-between items-start bg-white hover:bg-gray-50 transition duration-150">
                                <div>
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                        {kayit.tip}
                                    </span>
                                    <p className="text-lg font-bold text-gray-800 mt-2">{kayit.aciklama || 'Açıklama Yok'}</p>
                                    <p className="text-sm text-gray-500 mt-1">Tarih: {kayit.tarih}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-extrabold text-green-600">{kayit.maliyet.toFixed(2)} TL</p>
                                    <p className="text-sm text-gray-700 mt-1">{kayit.kilometre.toLocaleString()} km</p>
                                    {/* Silme/Düzenleme butonları buraya gelecek */}
                                    <button className="text-sm text-red-500 hover:text-red-700 mt-2">Sil</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {kayitlar.length === 0 && (
                        <p className="text-center text-gray-500 p-10">Bu araç için henüz kayıt bulunmamaktadır.</p>
                    )}

                </div>
            </main>
        </div>
    );
}