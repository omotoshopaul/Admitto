import React, { useState, useEffect, useRef } from 'react';
import { Country, State, City, IState, ICity } from 'country-state-city';
import NaijaStates from 'naija-state-local-government';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AFRICAN_ISO_CODES = [
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'
];

export default function Step1() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  
  const [selectedCountryCode, setSelectedCountryCode] = useState('NG');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  
  const [homeAddress, setHomeAddress] = useState('');
  
  const [fileError, setFileError] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [passportPhotoUrl, setPassportPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const navigate = useNavigate();

  // Dropdown states
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [stateSearch, setStateSearch] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  const [lgaSearch, setLgaSearch] = useState('');
  const [isLgaOpen, setIsLgaOpen] = useState(false);
  const lgaDropdownRef = useRef<HTMLDivElement>(null);

  const [isAttempted, setIsAttempted] = useState(false);

  // Fallback states for when API returns no data
  const [fallbackState, setFallbackState] = useState('');
  const [fallbackLga, setFallbackLga] = useState('');

  // Fetch existing data on mount
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && isMounted) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists() && isMounted) {
            const data = docSnap.data();
            if (data.firstName) setFirstName(data.firstName);
            if (data.lastName) setLastName(data.lastName);
            if (data.dateOfBirth) setDob(data.dateOfBirth);
            if (data.gender) setGender(data.gender);
            
            // To properly initialize cascading dropdowns, we just set the raw values 
            // into state. We need to store them and then let the UI resolve them, or we can just 
            // bypass the ISO code matching for states/LGAs during load, but actually we need the ISO code.
            // Wait, for Nigeria, state is stored as Name, not ISO code.
            // The user data stores: nationality (isoCode), stateOfOrigin (name), lga (name).
            
            if (data.nationality) {
              setSelectedCountryCode(data.nationality);
            }
            
            // We use setTimeout to allow selectedCountryCode to take effect and availableStates to populate
            // Or better, we can just set them to the fallback states, but if the country is valid, we want them in the dropdowns.
            // Actually, we can just set selectedStateCode directly if we can find it.
            // Let's get the country's states right here to avoid dependency loops.
            
            if (data.stateOfOrigin) {
              if (data.nationality === 'NG') {
                setSelectedStateCode(data.stateOfOrigin); // For NG, isoCode is the name
              } else if (data.nationality) {
                const states = State.getStatesOfCountry(data.nationality);
                const s = states.find(st => st.name === data.stateOfOrigin);
                if (s) {
                  setSelectedStateCode(s.isoCode);
                } else {
                  setFallbackState(data.stateOfOrigin);
                }
              } else {
                setFallbackState(data.stateOfOrigin);
              }
            }
            
            if (data.lga) {
              setSelectedLga(data.lga);
              setFallbackLga(data.lga);
            }
            
            if (data.homeAddress) setHomeAddress(data.homeAddress);
            if (data.passportPhotoUrl) {
              setPassportPhotoUrl(data.passportPhotoUrl);
              setFilePreview(data.passportPhotoUrl);
            }
          } else if (isMounted) {
            const displayName = user.displayName || '';
            const [firstNameFromAuth, ...lastNameParts] = displayName.split(' ');
            setFirstName(firstNameFromAuth || '');
            setLastName(lastNameParts.join(' ') || '');
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
  }, []); // Run only once on mount

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setIsStateOpen(false);
      }
      if (lgaDropdownRef.current && !lgaDropdownRef.current.contains(event.target as Node)) {
        setIsLgaOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allCountries = Country.getAllCountries().filter(c => AFRICAN_ISO_CODES.includes(c.isoCode));
  const filteredCountries = allCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  const currentCountry = allCountries.find(c => c.isoCode === selectedCountryCode);

  let availableStates: IState[] = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
  let availableLgas: ICity[] = (selectedCountryCode && selectedStateCode) ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : [];

  if (selectedCountryCode === 'NG') {
    availableStates = NaijaStates.states().map((stateName: string) => ({ isoCode: stateName, name: stateName, countryCode: 'NG', latitude: '', longitude: '' }));
    if (selectedStateCode) {
      try {
        const lgaData = NaijaStates.lgas(selectedStateCode);
        if (lgaData && lgaData.lgas) {
          availableLgas = lgaData.lgas.map((lgaName: string) => ({ name: lgaName, countryCode: 'NG', stateCode: selectedStateCode, latitude: '', longitude: '' }));
        }
      } catch (e) {
        availableLgas = [];
      }
    } else {
      availableLgas = [];
    }
  }

  const filteredStates = availableStates.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));
  const currentState = availableStates.find(s => s.isoCode === selectedStateCode);

  const filteredLgas = availableLgas.filter(l => l.name.toLowerCase().includes(lgaSearch.toLowerCase()));
  const currentLga = availableLgas.find(l => l.name === selectedLga);

  const handleCountrySelect = (isoCode: string) => {
    setSelectedCountryCode(isoCode);
    setIsCountryOpen(false);
    setSelectedStateCode('');
    setSelectedLga('');
    setFallbackState('');
    setFallbackLga('');
    setCountrySearch('');
  };

  const handleStateSelect = (isoCode: string) => {
    setSelectedStateCode(isoCode);
    setIsStateOpen(false);
    setSelectedLga('');
    setFallbackLga('');
    setStateSearch('');
  };

  const handleLgaSelect = (name: string) => {
    setSelectedLga(name);
    setIsLgaOpen(false);
    setLgaSearch('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setFileError('File must be JPG or PNG and under 500KB');
      setFilePreview(null);
      e.target.value = '';
      return;
    }

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setFileError('File must be JPG or PNG and under 500KB');
      setFilePreview(null);
      e.target.value = '';
      return;
    }

    setFileError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'e6il6ibi');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/sbgcm5gm/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      
      if (data.secure_url) {
        setPassportPhotoUrl(data.secure_url);
        setFilePreview(data.secure_url);
      } else {
        setFileError('Upload failed. Please try again.');
        setFilePreview(null);
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setFileError('Upload failed. Please try again.');
      setFilePreview(null);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const isStep1Complete = 
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    dob !== '' &&
    new Date(dob) <= new Date('2010-09-30') &&
    gender !== '' &&
    selectedCountryCode !== '' &&
    (availableStates.length > 0 ? selectedStateCode !== '' : fallbackState.trim() !== '') &&
    (availableStates.length > 0 && availableLgas.length > 0 ? selectedLga !== '' : fallbackLga.trim() !== '') &&
    homeAddress.trim() !== '' &&
    passportPhotoUrl !== '';

  const handleNext = async () => {
    setIsAttempted(true);
    setSaveError('');
    
    if (!isStep1Complete) {
      return;
    }

    if (!auth.currentUser) {
      setSaveError('You must be logged in to save details.');
      return;
    }

    setIsSaving(true);
    try {
      const stateOfOriginValue = availableStates.length > 0 && selectedStateCode 
        ? currentState?.name || fallbackState
        : fallbackState;
      
      const lgaValue = availableStates.length > 0 && availableLgas.length > 0 && selectedLga
        ? currentLga?.name || fallbackLga
        : fallbackLga;

      await setDoc(doc(db, "users", auth.currentUser.uid), {
        firstName,
        lastName,
        dateOfBirth: dob,
        gender,
        nationality: selectedCountryCode,
        stateOfOrigin: stateOfOriginValue,
        lga: lgaValue,
        homeAddress,
        passportPhotoUrl
      }, { merge: true });
      
      navigate('/step2');
    } catch (error) {
      console.error("Firestore save error:", error);
      setSaveError('Something went wrong saving your details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="h-2 flex-1 rounded-full border border-gray-200 bg-white"></div>
          <div className="h-2 flex-1 rounded-full border border-gray-200 bg-white"></div>
          <div className="h-2 flex-1 rounded-full border border-gray-200 bg-white"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">Please fill in all of the following fields</h2>

        <div className="space-y-6">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">First name</label>
              <input 
                type="text" 
                placeholder="John"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${isAttempted && !firstName.trim() ? 'border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {isAttempted && !firstName.trim() && <p className="text-red-500 text-xs mt-1">This field is required</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Last name</label>
              <input 
                type="text" 
                placeholder="Doe"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${isAttempted && !lastName.trim() ? 'border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {isAttempted && !lastName.trim() && <p className="text-red-500 text-xs mt-1">This field is required</p>}
            </div>
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <p className="text-xs text-gray-500">You must be 18 years old and above</p>
              <div className="relative">
                <input 
                  type="date" 
                  max="2010-09-30"
                  placeholder="dd/mm/yy"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${isAttempted && (!dob || new Date(dob) > new Date('2010-09-30')) ? 'border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{ color: dob ? '#111827' : '#9CA3AF' }}
                />
              </div>
              {isAttempted && !dob && <p className="text-red-500 text-xs mt-1">This field is required</p>}
              {isAttempted && dob && new Date(dob) > new Date('2010-09-30') && <p className="text-red-500 text-xs mt-1">You must be at least 18 years old</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <div className="flex items-center gap-6 h-[50px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${gender === 'Male' ? 'border-[#E24B4A]' : 'border-gray-300'}`}>
                    {gender === 'Male' && <div className="w-2.5 h-2.5 rounded-full bg-[#E24B4A]"></div>}
                  </div>
                  <input type="radio" name="gender" value="Male" className="hidden" onChange={() => setGender('Male')} />
                  <span className="text-gray-700">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${gender === 'Female' ? 'border-[#E24B4A]' : 'border-gray-300'}`}>
                    {gender === 'Female' && <div className="w-2.5 h-2.5 rounded-full bg-[#E24B4A]"></div>}
                  </div>
                  <input type="radio" name="gender" value="Female" className="hidden" onChange={() => setGender('Female')} />
                  <span className="text-gray-700">Female</span>
                </label>
              </div>
              {isAttempted && !gender && <p className="text-red-500 text-xs mt-1">This field is required</p>}
            </div>
          </div>

          {/* Nationality */}
          <div className="flex flex-col gap-2 relative" ref={countryDropdownRef}>
            <label className="text-sm font-medium text-gray-700">Nationality</label>
            <div 
              className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${isCountryOpen ? 'border-[#E24B4A]' : (isAttempted && !selectedCountryCode ? 'border-red-500' : 'border-gray-200')}`}
              onClick={() => setIsCountryOpen(!isCountryOpen)}
            >
              {currentCountry ? (
                <div className="flex items-center gap-2 text-gray-900">
                  <span className={`fi fi-${currentCountry.isoCode.toLowerCase()}`}></span>
                  {currentCountry.name}
                </div>
              ) : (
                <span className="text-gray-400">Select your country</span>
              )}
              <i className={`fa-solid fa-chevron-down text-gray-400 text-sm transition-transform ${isCountryOpen ? 'rotate-180' : ''}`}></i>
            </div>
            
            {isCountryOpen && (
              <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredCountries.map(country => (
                    <div 
                      key={country.isoCode}
                      className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg flex items-center gap-2 text-sm text-gray-700 transition-colors"
                      onClick={() => handleCountrySelect(country.isoCode)}
                    >
                      <span className={`fi fi-${country.isoCode.toLowerCase()}`}></span>
                      {country.name}
                    </div>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">No countries found</div>
                  )}
                </div>
              </div>
            )}
            {isAttempted && !selectedCountryCode && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>

          {/* State of Origin */}
          <div className="flex flex-col gap-2 relative" ref={stateDropdownRef}>
            <label className="text-sm font-medium text-gray-700">State of Origin</label>
            {availableStates.length > 0 ? (
              <>
                <div 
                  className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-colors ${!selectedCountryCode ? 'bg-gray-50 cursor-not-allowed border-gray-200' : 'cursor-pointer'} ${isStateOpen ? 'border-[#E24B4A]' : (isAttempted && !selectedStateCode ? 'border-red-500' : 'border-gray-200')}`}
                  onClick={() => selectedCountryCode && setIsStateOpen(!isStateOpen)}
                >
                  {currentState ? (
                    <span className="text-gray-900">{currentState.name}</span>
                  ) : (
                    <span className="text-gray-400">Select your state</span>
                  )}
                  <i className={`fa-solid fa-chevron-down text-gray-400 text-sm transition-transform ${isStateOpen ? 'rotate-180' : ''}`}></i>
                </div>
                
                {isStateOpen && (
                  <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none"
                        value={stateSearch}
                        onChange={(e) => setStateSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {filteredStates.map(state => (
                        <div 
                          key={state.isoCode}
                          className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg text-sm text-gray-700 transition-colors"
                          onClick={() => handleStateSelect(state.isoCode)}
                        >
                          {state.name}
                        </div>
                      ))}
                      {filteredStates.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">No states found</div>
                      )}
                    </div>
                  </div>
                )}
                {isAttempted && !selectedStateCode && <p className="text-red-500 text-xs mt-1">This field is required</p>}
              </>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder="Enter your state/region"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${!selectedCountryCode ? 'bg-gray-50 cursor-not-allowed border-gray-200' : ''} ${isAttempted && !fallbackState.trim() ? 'border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                  value={fallbackState}
                  onChange={(e) => setFallbackState(e.target.value)}
                  disabled={!selectedCountryCode}
                />
                {isAttempted && !fallbackState.trim() && <p className="text-red-500 text-xs mt-1">This field is required</p>}
              </>
            )}
          </div>

          {/* Local Government Area */}
          <div className="flex flex-col gap-2 relative" ref={lgaDropdownRef}>
            <label className="text-sm font-medium text-gray-700">Local Government Area</label>
            {availableStates.length > 0 && availableLgas.length > 0 ? (
              <>
                <div 
                  className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-colors ${!selectedStateCode ? 'bg-gray-50 cursor-not-allowed border-gray-200' : 'cursor-pointer'} ${isLgaOpen ? 'border-[#E24B4A]' : (isAttempted && !selectedLga ? 'border-red-500' : 'border-gray-200')}`}
                  onClick={() => selectedStateCode && setIsLgaOpen(!isLgaOpen)}
                >
                  {currentLga ? (
                    <span className="text-gray-900">{currentLga.name}</span>
                  ) : (
                    <span className="text-gray-400">Select your LGA</span>
                  )}
                  <i className={`fa-solid fa-chevron-down text-gray-400 text-sm transition-transform ${isLgaOpen ? 'rotate-180' : ''}`}></i>
                </div>
                
                {isLgaOpen && (
                  <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none"
                        value={lgaSearch}
                        onChange={(e) => setLgaSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {filteredLgas.map((lga, idx) => (
                        <div 
                          key={`${lga.name}-${idx}`}
                          className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg text-sm text-gray-700 transition-colors"
                          onClick={() => handleLgaSelect(lga.name)}
                        >
                          {lga.name}
                        </div>
                      ))}
                      {filteredLgas.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">No LGAs found</div>
                      )}
                    </div>
                  </div>
                )}
                {isAttempted && !selectedLga && <p className="text-red-500 text-xs mt-1">This field is required</p>}
              </>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder="Enter your Local Government Area"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${!selectedCountryCode || (availableStates.length > 0 && !selectedStateCode) ? 'bg-gray-50 cursor-not-allowed border-gray-200' : ''} ${isAttempted && !fallbackLga.trim() ? 'border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                  value={fallbackLga}
                  onChange={(e) => setFallbackLga(e.target.value)}
                  disabled={!selectedCountryCode || (availableStates.length > 0 && !selectedStateCode)}
                />
                {isAttempted && !fallbackLga.trim() && <p className="text-red-500 text-xs mt-1">This field is required</p>}
              </>
            )}
          </div>

          {/* Home Address */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Home Address</label>
            <input 
              type="text" 
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${isAttempted && !homeAddress.trim() ? 'border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
            />
            {isAttempted && !homeAddress.trim() && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>

          {/* Passport Upload */}
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Passport photograph</label>
              <p className="text-xs text-gray-500 mt-1">Upload a 400 x 400px passport photograph of yourself. Not more than 500KB. JPG or PNG only.</p>
            </div>
            
            <div 
              className={`w-[120px] h-[120px] mt-2 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden group ${filePreview ? 'border-[#E24B4A]' : 'border-gray-300 hover:border-[#E24B4A] hover:bg-gray-50'}`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <i className="fa-solid fa-spinner animate-spin text-2xl text-[#E24B4A]"></i>
              ) : filePreview ? (
                <div className="relative w-full h-full">
                  <img src={filePreview} alt="Passport preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-pen text-white"></i>
                  </div>
                </div>
              ) : (
                <i className="fa-solid fa-plus text-gray-400 text-2xl group-hover:text-[#E24B4A] transition-colors"></i>
              )}
            </div>
            <input 
              type="file" 
              accept=".jpg,.jpeg,.png" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
            {isAttempted && !passportPhotoUrl && !fileError && <p className="text-red-500 text-xs mt-1">Please upload your passport photograph</p>}
          </div>

          <div className="pt-4">
            {saveError && <p className="text-red-500 text-sm mb-3 text-center font-medium">{saveError}</p>}
            <button 
              type="button" 
              onClick={handleNext}
              disabled={isSaving}
              className="w-full bg-[#E24B4A] hover:bg-red-500 text-white font-medium py-3.5 rounded-xl transition-all flex justify-center items-center h-[52px] hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSaving ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : 'Next'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
