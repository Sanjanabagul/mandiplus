import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    const saved = localStorage.getItem('mandi_location');
    return saved ? JSON.parse(saved) : {
      city: 'Pune',
      state: 'Maharashtra',
      locality: 'Kothrud / Market Yard',
      pincode: '411038'
    };
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mandi_location', JSON.stringify(deliveryLocation));
  }, [deliveryLocation]);

  const updateLocation = (newLoc) => {
    setDeliveryLocation(newLoc);
    setIsLocationModalOpen(false);
  };

  return (
    <LocationContext.Provider value={{
      deliveryLocation,
      updateLocation,
      isLocationModalOpen,
      setIsLocationModalOpen
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
