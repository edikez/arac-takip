'use client'; // Bu, tarayıcıda çalışması gerektiğini belirtir

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase.ts'; // UZANTIYI BURAYA EKLEDİK
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();


  // Giriş (Login) İşlemi
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(`Giriş Hatası: ${error.message}`);
    } else {
      setMessage('Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...');
      // Başarılı girişten sonra ana sayfaya yönlendirme
      router.push('/'); 
    }
    setLoading(false);
  };
  
  // Kayıt (Sign Up) İşlemi
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(`Kayıt Hatası: ${error.message}`);
    } else {
      setMessage('Kayıt başarılı! Lütfen e-postanızı kontrol ederek hesabınızı onaylayın.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Araç Takip Sistemi Girişi
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          {/* Şifre Alanı */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          {/* Mesaj Alanı */}
          {message && (
            <p className={`text-sm text-center ${message.includes('Hata') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}

          {/* Butonlar */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              className="flex-1 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              Kayıt Ol
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}