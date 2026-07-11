import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Country } from 'country-state-city';

export default function Step2() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && isMounted) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists() && isMounted) {
            setUserData(docSnap.data());
          } else if (isMounted) {
            navigate('/step1');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          if (isMounted) navigate('/step1');
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else if (!user && isMounted) {
        navigate('/step1');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <i className="fa-solid fa-spinner animate-spin text-4xl text-[#E24B4A]"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Lexend',sans-serif] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        
        {/* Logo Navigation */}
       <div className="mb-6 flex justify-center">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <img 
              src="Admitto_Logo.png" 
              alt="Admitto logo" 
              className="h-[33px] w-auto object-contain"
            />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-2 flex-1 rounded-full border transition-colors border-[#E24B4A] bg-[#E24B4A]"></div>
          <div className="h-2 flex-1 rounded-full border transition-colors border-[#E24B4A] bg-[#E24B4A]"></div>
          <div className="h-2 flex-1 rounded-full border border-gray-200 bg-white"></div>
          <div className="h-2 flex-1 rounded-full border border-gray-200 bg-white"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">Review all of your details</h2>

        <div className="space-y-6">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">First name</label>
              <input 
                type="text" 
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default"
                value={userData?.firstName || ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Last name</label>
              <input 
                type="text" 
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default"
                value={userData?.lastName || ''}
              />
            </div>
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <input 
                type="date" 
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default appearance-none"
                value={userData?.dateOfBirth || ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <input 
                type="text" 
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default"
                value={userData?.gender || ''}
              />
            </div>
          </div>

          {/* Nationality */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Nationality</label>
            <input 
              type="text" 
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default"
              value={userData?.nationality ? Country.getCountryByCode(userData.nationality)?.name || userData.nationality : ''}
            />
          </div>

          {/* State of Origin */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">State of Origin</label>
            <input 
              type="text" 
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default"
              value={userData?.stateOfOrigin || ''}
            />
          </div>

          {/* Local Government Area */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Local Government Area</label>
            <input 
              type="text" 
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default"
              value={userData?.lga || ''}
            />
          </div>

          {/* Home Address */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Home Address</label>
            <input 
              type="text" 
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none cursor-default"
              value={userData?.homeAddress || ''}
            />
          </div>

          {/* Passport Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Passport photograph</label>
            <div className="w-[120px] h-[120px] mt-2 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
              {userData?.passportPhotoUrl ? (
                <img src={userData.passportPhotoUrl} alt="Passport preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <i className="fa-solid fa-image text-2xl"></i>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/step1')}
              className="flex-1 bg-white border border-[#E24B4A] text-[#E24B4A] font-medium py-3.5 rounded-xl transition-all flex justify-center items-center h-[52px] hover:bg-red-50"
            >
              Back
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/step3')}
              className="flex-1 bg-[#E24B4A] text-white font-medium py-3.5 rounded-xl flex justify-center items-center h-[52px] hover:bg-red-500 transition-colors"
            >
              Next
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
