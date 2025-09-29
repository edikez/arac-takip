'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase.ts';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; 

// --- Form Tipleri ---
interface FormState {
    plaka: string;
    tanim: string; 
    kilometre: number | string;
    yagDegisimi: boolean;
    yagKmAraligi: number | string;
    frenServisi: boolean;
    frenKmAraligi: number | string;
}


const STEPS = [
    { id: 1, name: 'Araç Bilgileri' },
    { id: 2, name: 'Bakım Planı' },
    { id: 3, name: 'Tamamlandı' },
];

export default function VehicleRegistrationForm({ onSuccess }: { onSuccess: () => void }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormState>({
        plaka: '',
        tanim: '',
        kilometre: '',
        yagDegisimi: true,
        yagKmAraligi: 10000,
        frenServisi: true,
        frenKmAraligi: 20000,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    // NOTE: useUser hook'unu kullanmak için Supabase Auth Helper'ı yüklemeniz gerekebilir
    // Ancak şimdilik user'ı doğrudan App.tsx'ten almadığımız için session kontrolü yapalım
    const router = useRouter();


    // --- Form Elemanlarını Güncelleme ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox' && 'checked' in e.target) {
            setFormData(prev => ({ ...prev, [name]: e.target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };


    // --- Son Kaydetme İşlemi ---
    const handleSubmit = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Lütfen tekrar giriş yapın.');
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        setError('');

        // 1. vehicles Tablosuna Kayıt
        const newVehicle = {
            plaka: formData.plaka.toUpperCase(),
            tanim: formData.tanim || `Kayıtlı Araç (${formData.plaka})`,
            kilometre: parseInt(formData.kilometre as string) || 0,
            user_id: session.user.id, // Kullanıcı ID'si
        };

        const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .insert([newVehicle])
            .select('id') 
            .single();

        if (vehicleError || !vehicleData) {
            setError(`Araç kaydı başarısız: ${vehicleError?.message}`);
            setIsSubmitting(false);
            return;
        }

        const newVehicleId = vehicleData.id;

        // 2. Bakım Planı Kayıtları (İlk Bakım Kaydı)
        const initialRecords = [];
        const today = new Date().toISOString().split('T')[0];

        if (formData.yagDegisimi) {
            initialRecords.push({
                arac_id: newVehicleId,
                tip: 'Motor Yağı',
                tarih: today,
                kilometre: parseInt(formData.kilometre as string) || 0,
                maliyet: 0, 
                aciklama: `İlk Yağ Değişim Planı: Sonraki ${formData.yagKmAraligi} km sonra.`,
            });
        }
        
        if (initialRecords.length > 0) {
             const { error: recordError } = await supabase
                .from('bakim_kayitlari')
                .insert(initialRecords);

            if (recordError) {
                setError(`Bakım planı kaydı başarısız: ${recordError.message}`);
            }
        }
        
        setIsSubmitting(false);
        setCurrentStep(3); // Tamamlandı ekranına geçiş
    };


    // --- ADIM GÖRÜNÜM KOMPONENTLERİ ---

    // Adım 1: Araç Bilgileri Girişi
    const Step1 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-700">Araç Bilgilerini Girin</h3>
            <p className="text-sm text-gray-500">Aracınızın takip için gerekli bilgilerini doldurun.</p>
            
            {/* Bu kısım, görsellerinizdeki yuvarlak hatlı ve koyu renkli input stilini yansıtır */}
            
            <input
                type="text"
                name="plaka"
                placeholder="Plaka (Örn: 07 ABC 123)"
                value={formData.plaka}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-xl text-gray-900 placeholder-gray-500 shadow-sm transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
            />
            <input
                type="text"
                name="tanim"
                placeholder="Marka/Model (Örn: Toyota Corolla)"
                value={formData.tanim}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-xl text-gray-900 placeholder-gray-500 shadow-sm transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
            />
            <input
                type="number"
                name="kilometre"
                placeholder="Mevcut Kilometre"
                value={formData.kilometre}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-xl text-gray-900 placeholder-gray-500 shadow-sm transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
            />
        </div>
    );

    // Adım 2: Bakım Planı Ayarları
    const Step2 = () => (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-700">Bakım Programı Kurulumu</h3>
            <p className="text-sm text-gray-500">Hangi bakımları takip etmek istediğinizi ve aralıkları belirleyin.</p>
            
            {/* YAĞ DEĞİŞİMİ */}
            <div className="p-4 border rounded-xl shadow-md bg-blue-50">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-lg text-blue-800">Motor Yağı Takibi</span>
                    <input 
                        type="checkbox"
                        name="yagDegisimi"
                        checked={formData.yagDegisimi}
                        onChange={handleChange}
                        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                    />
                </label>
                {formData.yagDegisimi && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Kilometre Aralığı (KM)</label>
                            <input 
                                type="number"
                                name="yagKmAraligi"
                                value={formData.yagKmAraligi}
                                onChange={handleChange}
                                placeholder="10000"
                                className="w-full px-3 py-2 border rounded-lg text-gray-900"
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* FREN SERVİSİ */}
            <div className="p-4 border rounded-xl shadow-md bg-green-50">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-lg text-green-800">Fren Servisi Takibi</span>
                    <input 
                        type="checkbox"
                        name="frenServisi"
                        checked={formData.frenServisi}
                        onChange={handleChange}
                        className="h-5 w-5 rounded text-green-600 focus:ring-green-500"
                    />
                </label>
                {formData.frenServisi && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Kilometre Aralığı (KM)</label>
                            <input 
                                type="number"
                                name="frenKmAraligi"
                                value={formData.frenKmAraligi}
                                onChange={handleChange}
                                placeholder="20000"
                                className="w-full px-3 py-2 border rounded-lg text-gray-900"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Adım 3: Tamamlandı Ekranı
    const Step3 = () => (
        <div className="text-center py-10 space-y-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 000 1.414L13 8.707z" clipRule="evenodd" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800">Tebrikler! Araç Başarıyla Kaydedildi.</h3>
            <p className="text-gray-600">Bakım planınız oluşturuldu. Ana sayfaya dönerek kayıtlarınızı yönetebilirsiniz.</p>
        </div>
    );


    // --- RENDER FONKSİYONU ---
    
    // Geçerlilik Kontrolü
    const isStep1Valid = formData.plaka && formData.tanim && formData.kilometre;
    
    // Adım içeriğini belirleme
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <Step1 />;
            case 2: return <Step2 />;
            case 3: return <Step3 />;
            default: return <Step1 />;
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-2xl border-t-8 border-blue-600">
            
            {/* ADIM NAVİGASYONU (Steppers) */}
            <div className="flex justify-between items-center mb-8">
                {STEPS.map((step, index) => (
                    // Buradaki stiller, görselinizdeki koyu mavi ve yuvarlak hatlı temayı taklit eder.
                    <div key={step.id} className={`flex flex-col items-center w-1/3 relative ${index > 0 ? 'before:content-[""] before:w-full before:h-0.5 before:bg-gray-300 before:absolute before:top-1/3 before:-z-10' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors z-10 ${
                            currentStep >= step.id ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}>
                            {currentStep > step.id ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8.5 13.586l7.793-7.793a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : step.id}
                        </div>
                        <span className={`text-xs mt-1.5 font-medium ${currentStep >= step.id ? 'text-indigo-600' : 'text-gray-500'} hidden sm:inline`}>
                            {step.name}
                        </span>
                    </div>
                ))}
            </div>

            {error && <p className="text-red-500 mb-4 p-2 bg-red-100 rounded-md">{error}</p>}
            
            {/* ADIM İÇERİĞİ */}
            {renderStepContent()}
            
            {/* BUTONLAR (Görseldeki koyu mavi butonu yansıtır) */}
            <div className="mt-8 flex justify-between space-x-4">
                {/* Geri Butonu */}
                {currentStep > 1 && currentStep < 3 && (
                    <button
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                    >
                        Geri
                    </button>
                )}

                {/* Devam/Kaydet Butonu */}
                {currentStep === 1 && (
                    <button
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg"
                        disabled={!isStep1Valid}
                    >
                        Devam Et →
                    </button>
                )}
                
                {currentStep === 2 && (
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet ve Bitir'}
                    </button>
                )}
                
                {currentStep === 3 && (
                     <button
                        onClick={() => onSuccess()}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg"
                    >
                        Ana Sayfaya Dön
                    </button>
                )}
            </div>
        </div>
    );
}