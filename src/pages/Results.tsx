import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';

interface DocData {
  url?: string;
  status?: 'pending' | 'verified' | 'unverified';
  matchedValue?: string;
  expectedValue?: string;
  errorType?: string;
}

export default function Results() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [documentsList, setDocumentsList] = useState<DocData[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [qrToken, setQrToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataAndGenerateQR = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          let docsArray: any[] = [];
          if (data.verificationType === 'mismatch') {
            docsArray = data.mismatchDocuments || [];
          } else if (data.verificationType === 'grammar') {
            docsArray = data.testimonialDocuments || [];
          }

          // Filter out nulls and normalize
          const normalizedDocs: DocData[] = docsArray
            .filter(d => d !== null)
            .map(d => (typeof d === 'string' ? { url: d, status: 'pending' } : d));
          
          setDocumentsList(normalizedDocs);

          // Generate QR code token and summary
          const token = crypto.randomUUID();
          const firstName = data.firstName || '';
          const lastName = data.lastName || '';
          
          const summary = {
            studentName: `${firstName} ${lastName}`.trim() || 'Student',
            documents: normalizedDocs.map((doc, i) => ({
              label: `Doc ${i + 1}`,
              status: doc.status || 'pending',
              matchedValue: doc.matchedValue || null,
              expectedValue: doc.expectedValue || null,
              errorType: doc.errorType || null
            })),
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          };

          await setDoc(doc(db, "publicVerifications", token), summary);
          setQrToken(token);
        }
      } catch (err) {
        console.error("Error fetching results or generating QR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndGenerateQR();
  }, []);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'admitto-verification-qr.png';
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Lexend',sans-serif]">
        <i className="fa-solid fa-spinner animate-spin text-4xl text-[#E24B4A]"></i>
      </div>
    );
  }

  const studentName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'Student';
  const verifyUrl = qrToken ? `${window.location.origin}/verify/${qrToken}` : '';

  return (
    <div className="min-h-screen bg-gray-50 font-['Lexend',sans-serif] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Overview</h2>
          <div className="inline-block px-4 py-1.5 rounded-full border border-[#E24B4A] text-[#E24B4A] text-sm font-medium bg-white">
            {studentName}'s Document verification breakdown
          </div>
        </div>

        <div className="mb-10 flex flex-col gap-4">
          {documentsList.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">No documents found.</p>
          ) : (
            documentsList.map((doc, i) => {
              const isExpanded = !!expandedRows[i];
              // Format status capitalization
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
                    <span className="font-semibold">Doc {i + 1}</span>
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

        {/* QR Code Section */}
        {qrToken && (
          <div className="flex flex-col items-center justify-center mb-10 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-6 text-center">Scan or download this QR code to verify these results publicly.</p>
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
              <QRCodeCanvas id="qr-canvas" value={verifyUrl} size={200} />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-8 mt-4">
          <button 
            type="button"
            onClick={handleDownloadQR}
            disabled={!qrToken}
            className="flex-1 bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-red-50 font-medium py-3.5 rounded-xl transition-colors h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate('/step1')}
            className="flex-1 bg-[#E24B4A] hover:bg-red-500 text-white font-medium py-3.5 rounded-xl flex justify-center items-center h-[52px] transition-colors"
          >
            Start again
          </button>
        </div>

      </div>
    </div>
  );
}
