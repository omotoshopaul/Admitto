import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

interface Product {
  card_type_id: string;
  card_name: string;
  unit_amount: number;
  availability: string;
}

export default function Purchase() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCard, setSelectedCard] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/list-products');
        const data = await res.json();
        if (data && data.data) {
          setProducts(data.data);
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleCardClick = (product: Product) => {
    if (product.availability !== 'In Stock') return;
    setSelectedCard(product);
  };

  const incrementQuantity = () => setQuantity(prev => (prev < 100 ? prev + 1 : prev));
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : prev));

  const PROFIT_MARGIN = 500; // your profit per card, in Naira
  const sellingPricePerCard = selectedCard ? selectedCard.unit_amount + PROFIT_MARGIN : 0;
  const totalAmount = sellingPricePerCard * quantity;

 const handlePurchase = () => {
  if (!selectedCard || !auth.currentUser) return;
  
  const paystackKey = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY;
  if (!paystackKey) {
    setError('Payment configuration error. Please contact support.');
    return;
  }
  
  setIsPurchasing(true);
  setError('');

    // @ts-ignore
    const handler = (window as any).PaystackPop.setup({
     key: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY,
      email: auth.currentUser.email,
      amount: totalAmount * 100, // convert Naira to kobo
      currency: 'NGN',
      ref: `admitto_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      callback: function(response: any) {
        fetch('/api/verify-and-buy-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paystackReference: response.reference,
            cardTypeId: selectedCard.card_type_id,
            cardName: selectedCard.card_name,
            quantity: quantity,
            uid: auth.currentUser!.uid
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            navigate('/my-purchases');
          } else {
            setError(data.error || 'Purchase failed. Please contact support.');
            setIsPurchasing(false);
          }
        })
        .catch(() => {
          setError('Failed to verify purchase on our server. Please contact support.');
          setIsPurchasing(false);
        });
      },
      onClose: function() {
  setIsPurchasing(false);
}
    });
    handler.openIframe();
  };

  // Find WAEC and NECO products if they exist
  const waecProduct = products.find(p => p.card_name.toUpperCase().includes('WAEC')) || { card_type_id: 'waec', card_name: 'WAEC', unit_amount: 3500, availability: 'In Stock' };
  const necoProduct = products.find(p => p.card_name.toUpperCase().includes('NECO')) || { card_type_id: 'neco', card_name: 'NECO', unit_amount: 1500, availability: 'In Stock' };

  return (
    <div className="min-h-screen bg-gray-50 font-['Lexend',sans-serif] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-start mb-8">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=" 
              alt="Admitto logo" 
              className="w-[100px] h-[33px] bg-gray-100 rounded object-cover"
            />
          </button>
          <button 
            onClick={() => navigate('/my-purchases')}
            className="text-sm font-medium text-[#E24B4A] hover:underline"
          >
            View purchase history
          </button>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Purchase Section</h2>
          <p className="text-gray-500 text-lg">Buy your NECO and WAEC scratch cards</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        {isLoadingProducts ? (
          <div className="flex justify-center py-12">
            <i className="fa-solid fa-spinner animate-spin text-3xl text-[#E24B4A]"></i>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Card Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* WAEC Card */}
              <button
                type="button"
                onClick={() => handleCardClick(waecProduct)}
                disabled={waecProduct.availability !== 'In Stock'}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]
                  ${waecProduct.availability !== 'In Stock' 
                    ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                    : selectedCard?.card_type_id === waecProduct.card_type_id
                      ? 'border-[#E24B4A] bg-red-50 shadow-md ring-2 ring-[#E24B4A] ring-offset-2'
                      : 'border-gray-200 bg-white hover:border-[#E24B4A]'}
                `}
              >
                {selectedCard?.card_type_id === waecProduct.card_type_id && (
                  <div className="absolute top-3 right-3 text-[#E24B4A]">
                    <i className="fa-solid fa-circle-check text-xl"></i>
                  </div>
                )}
                <span className={`text-2xl font-bold ${waecProduct.availability !== 'In Stock' ? 'text-gray-400' : 'text-[#E24B4A]'}`}>
                  WAEC
                </span>
                {waecProduct.availability !== 'In Stock' && (
                  <span className="text-xs font-medium text-gray-500 mt-2">Out of stock</span>
                )}
              </button>

              {/* NECO Card */}
              <button
                type="button"
                onClick={() => handleCardClick(necoProduct)}
                disabled={necoProduct.availability !== 'In Stock'}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]
                  ${necoProduct.availability !== 'In Stock' 
                    ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                    : selectedCard?.card_type_id === necoProduct.card_type_id
                      ? 'bg-[#E24B4A] border-[#E24B4A] shadow-md ring-2 ring-[#E24B4A] ring-offset-2'
                      : 'bg-[#E24B4A] border-transparent hover:bg-red-500'}
                `}
              >
                {selectedCard?.card_type_id === necoProduct.card_type_id && (
                  <div className="absolute top-3 right-3 text-white">
                    <i className="fa-solid fa-circle-check text-xl"></i>
                  </div>
                )}
                <span className={`text-2xl font-bold ${necoProduct.availability !== 'In Stock' ? 'text-gray-400' : 'text-white'}`}>
                  NECO
                </span>
                {necoProduct.availability !== 'In Stock' && (
                  <span className="text-xs font-medium text-white/70 mt-2">Out of stock</span>
                )}
              </button>
            </div>

            {/* Quantity Stepper */}
            <div className={`transition-opacity duration-300 ${selectedCard ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Select Quantity</label>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={decrementQuantity}
                  disabled={quantity <= 1 || !selectedCard}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <div className="w-20">
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 100) setQuantity(val);
                    }}
                    disabled={!selectedCard}
                    className="w-full h-12 text-center text-lg font-semibold border-b-2 border-[#E24B4A] focus:outline-none bg-transparent"
                    min="1"
                    max="100"
                  />
                </div>
                <button 
                  onClick={incrementQuantity}
                  disabled={quantity >= 100 || !selectedCard}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            {/* Price Display */}
            {selectedCard && (
              <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                <p className="text-gray-500 mb-2">Price per card: <span className="font-medium text-gray-900">₦{sellingPricePerCard.toLocaleString()}</span></p>
                <p className="text-2xl font-bold text-[#E24B4A]">Total: ₦{totalAmount.toLocaleString()}</p>
              </div>
            )}

            {/* Buy Button */}
            <button 
              onClick={handlePurchase}
              disabled={!selectedCard || isPurchasing}
              className="w-full bg-[#E24B4A] hover:bg-red-500 text-white font-medium py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg shadow-sm"
            >
              {isPurchasing ? (
                <><i className="fa-solid fa-spinner animate-spin mr-2"></i> Processing...</>
              ) : (
                'Buy Now'
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
