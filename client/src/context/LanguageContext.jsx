import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    brand_tagline: 'Fresh Agricultural Marketplace & AI Procurement Engine',
    search_placeholder: 'Search for fresh produce, crops, grains, suppliers (e.g. Nashik Onions, Sharbati Wheat)...',
    deliver_to: 'Deliver to',
    select_location: 'Select Delivery Location',
    login: 'Login / Sign In',
    register: 'Register',
    cart: 'Cart',
    orders: 'Orders',
    wishlist: 'Wishlist',
    all_categories: 'All Categories',
    fresh_deals: "Today's Best Deals",
    nearby_farmers: 'Nearby Regional Farmers',
    bulk_deals: 'Wholesale & Bulk Deals',
    ai_assistant: 'AI Procurement Assistant',
    voice_search: 'Voice Search',
    listening: 'Listening... Speak now',
    speak_crop: 'Try saying: "Show 50 kg tomatoes near me" or "Nashik onions wholesale"',
    add_to_cart: 'Add to Cart',
    buy_now: 'Buy Now',
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    min_order: 'Min. Order',
    grade: 'Grade',
    farmer: 'Farmer',
    wholesale_tiers: 'Bulk Pricing Tiers',
    view_details: 'View Details',
    checkout: 'Proceed to Checkout',
    order_summary: 'Order Summary',
    delivery_fee: 'Delivery Fee',
    total_amount: 'Total Amount',
    place_order: 'Place Order',
    seller_hub: 'Farmer / Seller Hub',
    admin_panel: 'Admin Operations',
    delivery_hub: 'Delivery Partner Portal',
    logout: 'Logout'
  },
  hi: {
    brand_tagline: 'ताज़ा कृषि बाज़ार और एआई खरीद इंजन',
    search_placeholder: 'ताज़ी उपज, फसलें, अनाज, किसान खोजें (उदा. नासिक प्याज, शरबती गेहूं)...',
    deliver_to: 'डिलीवरी स्थान',
    select_location: 'डिलीवरी स्थान चुनें',
    login: 'लॉगिन / साइन इन',
    register: 'पंजीकरण करें',
    cart: 'कार्ट',
    orders: 'मेरे ऑर्डर',
    wishlist: 'पसंदीदा',
    all_categories: 'सभी श्रेणियां',
    fresh_deals: 'आज के सर्वोत्तम सौदे',
    nearby_farmers: 'निकटवर्ती स्थानीय किसान',
    bulk_deals: 'थोक और बड़े सौदे',
    ai_assistant: 'एआई खरीद सहायक',
    voice_search: 'आवाज से खोजें',
    listening: 'सुन रहे हैं... कृपया बोलें',
    speak_crop: 'बोलकर देखें: "मुझे 50 किलो टमाटर चाहिए" या "नासिक प्याज थोक"',
    add_to_cart: 'कार्ट में जोड़ें',
    buy_now: 'अभी खरीदें',
    in_stock: 'उपलब्ध है',
    out_of_stock: 'स्टॉक खत्म',
    min_order: 'न्यूनतम ऑर्डर',
    grade: 'गुणवत्ता ग्रेड',
    farmer: 'किसान / आपूर्तिकर्ता',
    wholesale_tiers: 'थोक मूल्य स्लैब',
    view_details: 'विवरण देखें',
    checkout: 'चेकआउट करें',
    order_summary: 'ऑर्डर सारांश',
    delivery_fee: 'डिलीवरी शुल्क',
    total_amount: 'कुल राशि',
    place_order: 'ऑर्डर दें',
    seller_hub: 'किसान विक्रेता हब',
    admin_panel: 'प्रशासक पोर्टल',
    delivery_hub: 'डिलीवरी पार्टनर हब',
    logout: 'लॉगआउट'
  },
  mr: {
    brand_tagline: 'ताजी कृषी बाजारपेठ आणि एआय खरेदी इंजिन',
    search_placeholder: 'ताजी फळे, भाजीपाला, धान्य, शेतकरी शोधा (उदा. नाशिक कांदा, शरबती गहू)...',
    deliver_to: 'डिलिव्हरी पत्ता',
    select_location: 'डिलिव्हरी स्थान निवडा',
    login: 'लॉगिन / साइन इन',
    register: 'नोंदणी करा',
    cart: 'कार्ट',
    orders: 'माझे ऑर्डर्स',
    wishlist: 'आवडते',
    all_categories: 'सर्व वर्ग',
    fresh_deals: 'आजचे सर्वोत्तम सौदे',
    nearby_farmers: 'जवळपासचे स्थानिक शेतकरी',
    bulk_deals: 'घाऊक आणि मोठे सौदे',
    ai_assistant: 'एआय खरेदी सहाय्यक',
    voice_search: 'आवाजाने शोधा',
    listening: 'ऐकत आहे... बोला',
    speak_crop: 'म्हणून पहा: "मला ५० किलो टोमॅटो हवे आहेत" किंवा "नाशिक कांदा घाऊक"',
    add_to_cart: 'कार्टमध्ये जोडा',
    buy_now: 'आत्ताच खरेदी करा',
    in_stock: 'उपलब्ध आहे',
    out_of_stock: 'साठा संपला',
    min_order: 'किमान ऑर्डर',
    grade: 'प्रतवारी ग्रेड',
    farmer: 'शेतकरी / पुरवठादार',
    wholesale_tiers: 'घाऊक दर स्लॅब',
    view_details: 'तपशील पहा',
    checkout: 'खरेदी पूर्ण करा',
    order_summary: 'ऑर्डर गोषवारा',
    delivery_fee: 'डिलिव्हरी शुल्क',
    total_amount: 'एकूण रक्कम',
    place_order: 'ऑर्डर निश्चित करा',
    seller_hub: 'शेतकरी विक्रेता केंद्र',
    admin_panel: 'प्रशासक केंद्र',
    delivery_hub: 'डिलिव्हरी पार्टनर केंद्र',
    logout: 'लॉगआउट'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('mandi_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('mandi_lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
