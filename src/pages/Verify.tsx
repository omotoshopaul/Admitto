import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface VerificationSummary {
  studentName: string;
  documents: {
    label: string;
    status: string;
    matchedValue: string | null;
    expectedValue: string | null;
    errorType: string | null;
  }[];
  createdAt: number;
  expiresAt: number;
}

export default function Verify() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<VerificationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchVerification = async () => {
      if (!token) {
        setError("Invalid verification link.");
        setLoading(false);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "publicVerifications", token));
        if (docSnap.exists()) {
          const data = docSnap.data() as VerificationSummary;
          if (Date.now() > data.expiresAt) {
            setError("This verification link has expired.");
          } else {
            setSummary(data);
          }
        } else {
          setError("This verification link has expired.");
        }
      } catch (err) {
        console.error("Error fetching verification:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [token]);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Lexend',sans-serif]">
        <i className="fa-solid fa-spinner animate-spin text-4xl text-[#E24B4A]"></i>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-['Lexend',sans-serif] px-4">
        <i className="fa-solid fa-clock text-5xl text-gray-400 mb-4"></i>
        <p className="text-gray-600 font-medium text-lg text-center">{error || "This verification link has expired."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Lexend',sans-serif] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Result Overview</h2>
          <div className="inline-block px-4 py-1.5 rounded-full border border-[#E24B4A] text-[#E24B4A] text-sm font-medium bg-white">
            {summary.studentName}'s Document verification breakdown
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {summary.documents.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">No documents found.</p>
          ) : (
            summary.documents.map((doc, i) => {
              const isExpanded = !!expandedRows[i];
              
              let statusText = "Pending";
              if (doc.status === 'verified') statusText = "Verified";
              if (doc.status === 'unverified') statusText = "Unverified";

              return (
                <div key={i} className="flex flex-col rounded-xl overflow-hidden shadow-sm">
                  {/* Row Header */}
                  <div 
                    onClick={() => toggleRow(i)}
                    className="bg-[#E24B4A] text-white px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-red-500 transition-colors"
                  >
                    <span className="font-semibold">{doc.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{statusText}</span>
                      <i className={`fa-solid ${isExpanded ? 'fa-minus' : 'fa-plus'} w-4 text-center`}></i>
                    </div>
                  </div>
                  
                  {/* Expanded Detail Panel */}
                  <div 
                    className={`bg-red-50 text-[#E24B4A] px-6 transition-all duration-300 ease-in-out ${
                      isExpanded ? 'py-5 opacity-100' : 'max-h-0 py-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span className="font-semibold min-w-[120px]">Matched value:</span>
                        <span>{doc.matchedValue || 'Not yet processed'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span className="font-semibold min-w-[120px]">Expected value:</span>
                        <span>{doc.expectedValue || 'Not yet processed'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span className="font-semibold min-w-[120px]">Error type:</span>
                        <span>{doc.errorType || 'None detected yet'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
