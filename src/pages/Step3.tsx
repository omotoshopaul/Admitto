import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Step3() {
  const navigate = useNavigate();
  const [verificationType, setVerificationType] = useState<'mismatch' | 'grammar' | null>(null);
  
  const [mismatchDocuments, setMismatchDocuments] = useState<({ url: string, type: string } | null)[]>(Array(6).fill(null));
  const [mismatchDocTypes, setMismatchDocTypes] = useState<string[]>(Array(6).fill('')); // Temporary state for select dropdown
  const [testimonialDocuments, setTestimonialDocuments] = useState<(string | null)[]>(Array(2).fill(null));
  
  const [isUploading, setIsUploading] = useState<{ type: 'mismatch' | 'grammar', index: number } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<{ type: 'mismatch' | 'grammar', index: number } | null>(null);

  // Check if we have at least one uploaded document for the selected type to light up segment 3
  const hasUploadedCurrentType = 
    (verificationType === 'mismatch' && mismatchDocuments.some(d => d !== null)) ||
    (verificationType === 'grammar' && testimonialDocuments.some(d => d !== null));

  // Also pre-fill if data exists
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && isMounted) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists() && isMounted) {
            const data = docSnap.data();
            if (data.verificationType) setVerificationType(data.verificationType);
            if (data.mismatchDocuments) {
              const loaded = [...data.mismatchDocuments];
              while (loaded.length < 6) loaded.push(null);
              setMismatchDocuments(loaded.slice(0, 6));
              
              const types = loaded.map(d => d ? d.type : '');
              while (types.length < 6) types.push('');
              setMismatchDocTypes(types.slice(0, 6));
            }
            if (data.testimonialDocuments) {
              const loaded = [...data.testimonialDocuments];
              while (loaded.length < 2) loaded.push(null);
              setTestimonialDocuments(loaded.slice(0, 2));
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const autoSave = async (data: any) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), data, { merge: true });
    } catch (error) {
      console.error("Autosave error:", error);
    }
  };

  const handleVerificationTypeChange = (type: 'mismatch' | 'grammar' | null) => {
    setVerificationType(type);
    autoSave({ verificationType: type });
  };

  const triggerUpload = (type: 'mismatch' | 'grammar', index: number) => {
    if (isUploading) return;
    if (type === 'mismatch' && !mismatchDocTypes[index]) return; // Disable if no type selected
    
    setActiveUploadSlot({ type, index });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const removeDocument = (e: React.MouseEvent, type: 'mismatch' | 'grammar', index: number) => {
    e.stopPropagation(); // prevent triggering upload click
    if (type === 'mismatch') {
      const newDocs = [...mismatchDocuments];
      newDocs[index] = null;
      setMismatchDocuments(newDocs);
      autoSave({ mismatchDocuments: newDocs.filter(d => d !== null) });
      
      const newTypes = [...mismatchDocTypes];
      newTypes[index] = '';
      setMismatchDocTypes(newTypes);
    } else {
      const newDocs = [...testimonialDocuments];
      newDocs[index] = null;
      setTestimonialDocuments(newDocs);
      autoSave({ testimonialDocuments: newDocs.filter(d => d !== null) });
    }
    setUploadErrors(prev => {
      const next = { ...prev };
      delete next[`${type}-${index}`];
      return next;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeUploadSlot) return;
    
    const file = e.target.files[0];
    const { type, index } = activeUploadSlot;
    const errorKey = `${type}-${index}`;

    setUploadErrors(prev => {
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadErrors(prev => ({ ...prev, [errorKey]: 'File must be JPG, PNG, or PDF and under 1MB' }));
      return;
    }

    if (file.size > 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [errorKey]: 'File must be JPG, PNG, or PDF and under 1MB' }));
      return;
    }

    setIsUploading({ type, index });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'e6il6ibi');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/sbgcm5gm/auto/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      
      if (data.secure_url) {
        if (type === 'mismatch') {
          const newDocs = [...mismatchDocuments];
          newDocs[index] = { url: data.secure_url, type: mismatchDocTypes[index] };
          setMismatchDocuments(newDocs);
          autoSave({ mismatchDocuments: newDocs.filter(d => d !== null) });
        } else {
          const newDocs = [...testimonialDocuments];
          newDocs[index] = data.secure_url;
          setTestimonialDocuments(newDocs);
          autoSave({ testimonialDocuments: newDocs.filter(d => d !== null) });
        }
      } else {
        setUploadErrors(prev => ({ ...prev, [errorKey]: 'Upload failed. Please try again.' }));
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setUploadErrors(prev => ({ ...prev, [errorKey]: 'Upload failed. Please try again.' }));
    } finally {
      setIsUploading(null);
      setActiveUploadSlot(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleNext = async () => {
    setSaveError('');
    if (!auth.currentUser) {
      setSaveError('You must be logged in to save details.');
      return;
    }

    if (!verificationType || !hasUploadedCurrentType) {
      setSaveError('Please select a verification type and upload at least one document.');
      return;
    }

    try {
      await autoSave({ verificationStatus: "processing" });
      
      // Trigger backend verification
      fetch('/api/run-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: auth.currentUser.uid })
      });
      
      navigate('/step4');
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveError('Failed to save data. Please try again.');
    }
  };

  const handleDocTypeChange = (index: number, value: string) => {
    const newTypes = [...mismatchDocTypes];
    newTypes[index] = value;
    setMismatchDocTypes(newTypes);
  };

  const renderUploadBox = (type: 'mismatch' | 'grammar', index: number) => {
    const fileUrl = type === 'mismatch' ? mismatchDocuments[index]?.url : testimonialDocuments[index];
    const isLoading = isUploading?.type === type && isUploading?.index === index;
    const error = uploadErrors[`${type}-${index}`];
    
    const isPdf = fileUrl?.toLowerCase().endsWith('.pdf');
    const filename = fileUrl ? fileUrl.split('/').pop() : '';

    return (
      <div key={`${type}-${index}`} className="flex flex-col gap-2">
        {type === 'mismatch' && !fileUrl && (
          <select 
            value={mismatchDocTypes[index]} 
            onChange={(e) => handleDocTypeChange(index, e.target.value)}
            className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E24B4A]"
          >
            <option value="" disabled>Select Type</option>
            <option value="JAMB">JAMB</option>
            <option value="WAEC/NECO">WAEC/NECO</option>
            <option value="Birth Certificate">Birth Certificate</option>
            <option value="Testimonial">Testimonial</option>
            <option value="Other">Other</option>
          </select>
        )}
        {type === 'mismatch' && fileUrl && (
          <div className="text-center font-medium text-xs text-gray-700 bg-gray-100 py-1 px-2 rounded-md truncate">
            {mismatchDocuments[index]?.type}
          </div>
        )}
        
        <div 
          onClick={() => !fileUrl && triggerUpload(type, index)}
          className={`relative aspect-square w-full max-w-[150px] mx-auto sm:max-w-none rounded-xl border-2 flex flex-col items-center justify-center transition-colors overflow-hidden group
            ${fileUrl ? 'border-[#E24B4A]' : (type === 'mismatch' && !mismatchDocTypes[index]) ? 'border-dashed border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' : 'border-dashed border-gray-300 hover:border-[#E24B4A] hover:bg-gray-50 cursor-pointer'}
          `}
        >
          {isLoading ? (
            <i className="fa-solid fa-spinner animate-spin text-2xl text-[#E24B4A]"></i>
          ) : fileUrl ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-50">
              {isPdf ? (
                <div className="p-4 flex flex-col items-center justify-center text-center gap-2">
                  <i className="fa-solid fa-file-pdf text-4xl text-red-500"></i>
                  <span className="text-xs text-gray-600 truncate w-full px-2" title={filename}>{filename}</span>
                </div>
              ) : (
                <img src={fileUrl} alt="Document preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={(e) => removeDocument(e, type, index)}
                className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors z-10"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          ) : (
            <i className="fa-solid fa-plus text-gray-400 text-2xl group-hover:text-[#E24B4A] transition-colors"></i>
          )}
        </div>
        {error && <p className="text-red-500 text-[11px] sm:text-xs text-center">{error}</p>}
      </div>
    );
  };

  const isNextEnabled = verificationType && hasUploadedCurrentType;

  return (
    <div className="min-h-screen bg-gray-50 font-['Lexend',sans-serif] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        
        {/* Logo Navigation */}
        <div className="mb-6 flex justify-center">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <img 
              src="/Admitto_Transparent.png" 
              alt="Admitto logo" 
              className="h-[33px] w-auto object-contain"
            />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-2 flex-1 rounded-full border transition-colors border-[#E24B4A] bg-[#E24B4A]"></div>
          <div className="h-2 flex-1 rounded-full border transition-colors border-[#E24B4A] bg-[#E24B4A]"></div>
          <div className={`h-2 flex-1 rounded-full border transition-colors ${hasUploadedCurrentType ? 'border-[#E24B4A] bg-[#E24B4A]' : 'border-gray-200 bg-white'}`}></div>
          <div className="h-2 flex-1 rounded-full border border-gray-200 bg-white"></div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification type</h2>
          <p className="text-sm text-gray-600">Choose the type of verification you need for your documents</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div 
            onClick={() => handleVerificationTypeChange(verificationType === 'mismatch' ? null : 'mismatch')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              verificationType === 'mismatch' 
                ? 'border-[#E24B4A] bg-red-50' 
                : verificationType === 'grammar'
                  ? 'border-gray-100 bg-gray-50 opacity-50'
                  : 'border-gray-200 hover:border-red-200'
            }`}
          >
            <h3 className={`font-semibold mb-2 ${verificationType === 'mismatch' ? 'text-[#E24B4A]' : 'text-gray-900'}`}>
              Check for mismatched details
            </h3>
            <p className="text-sm text-gray-600">Compare your uploaded documents against your pre-saved details to catch mismatches, missing information, or errors.</p>
          </div>

          <div 
            onClick={() => handleVerificationTypeChange(verificationType === 'grammar' ? null : 'grammar')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              verificationType === 'grammar' 
                ? 'border-[#E24B4A] bg-red-50' 
                : verificationType === 'mismatch'
                  ? 'border-gray-100 bg-gray-50 opacity-50'
                  : 'border-gray-200 hover:border-red-200'
            }`}
          >
            <h3 className={`font-semibold mb-2 ${verificationType === 'grammar' ? 'text-[#E24B4A]' : 'text-gray-900'}`}>
              Check for grammatical errors
            </h3>
            <p className="text-sm text-gray-600">Check your documents for spelling, grammatical, and formatting mistakes, and compare them against our standard template.</p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
        />

        {/* Upload Sections */}
        {!verificationType ? (
          <div className="py-8 text-center border-t border-gray-100">
            <p className="text-gray-500 text-sm">Select a verification type above to continue</p>
          </div>
        ) : (
          <div className="pt-6 border-t border-gray-100">
            {verificationType === 'mismatch' && (
              <>
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-1">Upload your documents</h3>
                  <p className="text-sm text-gray-600">Upload up to 6 documents. Select the document type before uploading.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mismatchDocuments.map((_, i) => renderUploadBox('mismatch', i))}
                </div>
              </>
            )}

            {verificationType === 'grammar' && (
              <>
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-1">Upload your documents</h3>
                  <p className="text-sm text-gray-600">Upload up to 2 documents.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {testimonialDocuments.map((_, i) => renderUploadBox('grammar', i))}
                </div>
              </>
            )}
          </div>
        )}

        {saveError && <p className="text-red-500 text-sm font-medium mt-6 text-center">{saveError}</p>}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t border-gray-100">
          <button 
            type="button"
            onClick={() => navigate('/step2')}
            className="flex-1 bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-red-50 font-medium py-3.5 rounded-xl transition-colors h-[52px]"
          >
            Back
          </button>
          
          <button 
            type="button" 
            onClick={handleNext}
            disabled={!isNextEnabled}
            className="flex-1 bg-[#E24B4A] hover:bg-red-500 text-white font-medium py-3.5 rounded-xl flex justify-center items-center h-[52px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
