import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Step4() {
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<string>("processing");

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setVerificationStatus(docSnap.data().verificationStatus || "processing");
      }
    });
    return () => unsubscribe();
  }, []);

  const isComplete = verificationStatus === "complete" || verificationStatus === "completed";
  const isError = verificationStatus === "error";

  return (
    <div className="min-h-screen bg-gray-50 font-['Lexend',sans-serif] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-gray-100 text-center">
        
        {/* Logo Navigation */}
        <div className="mb-6 flex justify-center">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=" 
              alt="Admitto logo" 
              className="w-[100px] h-[33px] bg-gray-100 rounded object-cover"
            />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-2 flex-1 rounded-full border transition-colors border-[#E24B4A] bg-[#E24B4A]"></div>
          <div className="h-2 flex-1 rounded-full border transition-colors border-[#E24B4A] bg-[#E24B4A]"></div>
          <div className="h-2 flex-1 rounded-full border transition-colors border-[#E24B4A] bg-[#E24B4A]"></div>
          <div className={`h-2 flex-1 rounded-full border transition-colors ${(isComplete || isError) ? 'border-[#E24B4A] bg-[#E24B4A]' : 'border-gray-200 bg-white'}`}></div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isError ? "Verification Failed" : (isComplete ? "Document verification done" : "Document Verification ongoing")}
          </h2>
        </div>

        {/* Viewfinder scanner box */}
        <div className="relative w-[200px] h-[200px] mx-auto mb-8 bg-gray-50 flex items-center justify-center">
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gray-300"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gray-300"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gray-300"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gray-300"></div>

          {isError ? (
            <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center bg-white text-red-500">
              <i className="fa-solid fa-xmark text-4xl"></i>
            </div>
          ) : isComplete ? (
            <div className="w-20 h-20 rounded-full border-4 border-[#E24B4A] flex items-center justify-center bg-white text-[#E24B4A]">
              <i className="fa-solid fa-check text-4xl"></i>
            </div>
          ) : (
            <div className="absolute left-4 right-4 h-1 bg-[#E24B4A] shadow-[0_0_8px_#E24B4A] animate-[scan_2s_ease-in-out_infinite]" />
          )}
        </div>

        <style>{`
          @keyframes scan {
            0%, 100% { top: 10%; opacity: 0.5; }
            50% { top: 90%; opacity: 1; }
          }
        `}</style>

        <p className="text-sm mb-10 text-gray-500">
          {isError ? (
            <span className="text-red-500 font-medium">An error occurred during verification. Please go back and try again.</span>
          ) : isComplete ? "Check your document verification result" : "Admitto AI is verifying your documents"}
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-8 mt-8">
          <button 
            type="button"
            onClick={() => (isComplete || isError) && navigate('/step3')}
            disabled={!isComplete && !isError}
            className={`flex-1 font-medium py-3.5 rounded-xl transition-colors h-[52px]
              ${(isComplete || isError)
                ? 'bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-red-50' 
                : 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'}
            `}
          >
            Back
          </button>
          
          <button 
            type="button" 
            onClick={() => isComplete && navigate('/results')}
            // TEMPORARY: re-disable this once Results page testing is done, per product owner request.
            className={`flex-1 font-medium py-3.5 rounded-xl flex justify-center items-center h-[52px] transition-colors
              ${isComplete 
                ? 'bg-[#E24B4A] text-white opacity-100' 
                : 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'}
            `}
          >
            Show result
          </button>
        </div>
      </div>
    </div>
  );
}
