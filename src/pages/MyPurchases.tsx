import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface PurchaseRecord {
  id: string;
  cardName: string;
  quantity: number;
  amount: number;
  transactionDate: string;
  reference: string;
  cards: { pin: string; serial_no: string }[];
}

export default function MyPurchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'users', auth.currentUser.uid, 'purchases'),
          orderBy('transactionDate', 'desc')
        );
        const snapshot = await getDocs(q);
        const data: PurchaseRecord[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PurchaseRecord[];
        
        setPurchases(data);
      } catch (error) {
        console.error("Error fetching purchases:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPurchases();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Lexend',sans-serif] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        
        {/* Navigation & Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/purchase')} className="text-gray-400 hover:text-gray-600 transition-colors inline-block mb-6">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Purchase History</h2>
            <p className="text-gray-500 text-lg">Your previously bought WAEC and NECO pins</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <i className="fa-solid fa-spinner animate-spin text-3xl text-[#E24B4A]"></i>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 border border-gray-100 rounded-xl bg-gray-50">
            <i className="fa-solid fa-receipt text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-600 mb-6 font-medium">You haven't made any purchases yet.</p>
            <button 
              onClick={() => navigate('/purchase')}
              className="bg-[#E24B4A] hover:bg-red-500 text-white font-medium px-6 py-3 rounded-xl transition-colors inline-block"
            >
              Buy Scratch Cards
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const isExpanded = !!expandedRows[purchase.id];
              
              return (
                <div key={purchase.id} className="flex flex-col rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  {/* Row Header */}
                  <div 
                    onClick={() => toggleRow(purchase.id)}
                    className="bg-white hover:bg-gray-50 px-6 py-5 flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-900 text-lg">{purchase.cardName} <span className="text-gray-400 text-sm font-normal">x{purchase.quantity}</span></span>
                      <span className="text-sm text-gray-500">{formatDate(purchase.transactionDate)}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-semibold text-[#E24B4A]">₦{purchase.amount?.toLocaleString()}</span>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-sm`}></i>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Detail Panel */}
                  <div 
                    className={`bg-gray-50 border-t border-gray-100 transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden border-t-0'
                    }`}
                  >
                    <div className="p-6">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Pins & Serials</p>
                      
                      {purchase.cards && purchase.cards.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {purchase.cards.map((card, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">PIN</span>
                                <span className="font-mono font-bold text-gray-900">{card.pin}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Serial No</span>
                                <span className="font-mono text-gray-600 text-sm">{card.serial_no}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No pins found for this purchase.</p>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
                        <span>Ref: {purchase.reference}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
