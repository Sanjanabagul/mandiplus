export const categoriesSeed = [
  {
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Fresh farm-harvested vegetables, greens, root crops, and gourds.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    icon: 'Carrot',
    displayOrder: 1,
    isFeatured: true
  },
  {
    name: 'Fruits',
    slug: 'fruits',
    description: 'Orchard-fresh seasonal and exotic fruits directly from growers.',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
    icon: 'Apple',
    displayOrder: 2,
    isFeatured: true
  },
  {
    name: 'Grains',
    slug: 'grains',
    description: 'Premium wheat, basmati rice, jowar, bajra, and millets.',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    icon: 'Wheat',
    displayOrder: 3,
    isFeatured: true
  },
  {
    name: 'Pulses',
    slug: 'pulses',
    description: 'High-protein unpolished dals, chickpeas, lentils, and legumes.',
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
    icon: 'Package',
    displayOrder: 4,
    isFeatured: true
  },
  {
    name: 'Spices',
    slug: 'spices',
    description: 'Pure whole and ground spices, turmeric, chillies, and ginger.',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    icon: 'Flame',
    displayOrder: 5,
    isFeatured: true
  },
  {
    name: 'Organic Produce',
    slug: 'organic-produce',
    description: 'Certified organic vegetables, fruits, and chemical-free heritage staples.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    icon: 'ShieldCheck',
    displayOrder: 6,
    isFeatured: true
  },
  {
    name: 'Bulk Deals',
    slug: 'bulk-deals',
    description: 'Wholesale quantities and deep volume discounts for retailers and restaurants.',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
    icon: 'Truck',
    displayOrder: 7,
    isFeatured: true
  },
  {
    name: 'Dairy',
    slug: 'dairy',
    description: 'Fresh farm milk, desi ghee, paneer, and artisanal butter.',
    image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
    icon: 'Milk',
    displayOrder: 8,
    isFeatured: true
  },
  {
    name: 'Seeds',
    slug: 'seeds',
    description: 'Certified high-yield hybrid and organic heirloom seeds.',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80',
    icon: 'Sprout',
    displayOrder: 9,
    isFeatured: false
  },
  {
    name: 'Fertilizers',
    slug: 'fertilizers',
    description: 'Bio-fertilizers, vermicompost, and plant nutritional boosters.',
    image: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=600&q=80',
    icon: 'FlaskConical',
    displayOrder: 10,
    isFeatured: false
  }
];

export const usersSeed = [
  {
    name: 'Rajesh Patil (Farmer)',
    email: 'farmer@mandiplus.com',
    password: 'Password123!',
    phone: '+91 98220 11223',
    role: 'seller',
    businessName: 'Sahyadri Agro Farms',
    locality: 'Nashik APMC',
    status: 'active',
    approvalStatus: 'approved',
    isActive: true,
    sellerProfile: {
      verified: true,
      farmLocation: 'Dindori, Nashik, Maharashtra',
      farmSizeAcres: 12,
      primaryCrops: ['Onion', 'Tomato', 'Grapes', 'Pomegranate'],
      averageRating: 4.8,
      totalRatings: 142
    },
    addresses: [{
      fullName: 'Rajesh Patil',
      phone: '+91 98220 11223',
      streetAddress: 'Farm Gate No. 4, Dindori Road',
      locality: 'Nashik APMC',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422003',
      isDefault: true
    }]
  },
  {
    name: 'Rameshwar Khot (Grower)',
    email: 'ramesh@mandiplus.com',
    password: 'Password123!',
    phone: '+91 98231 44556',
    role: 'seller',
    businessName: 'Krishna Valley Organic Produce',
    locality: 'Pune Market Yard',
    status: 'active',
    approvalStatus: 'approved',
    isActive: true,
    sellerProfile: {
      verified: true,
      farmLocation: 'Baramati, Pune, Maharashtra',
      farmSizeAcres: 25,
      primaryCrops: ['Potato', 'Spinach', 'Wheat', 'Organic Vegetables'],
      averageRating: 4.9,
      totalRatings: 89
    },
    addresses: [{
      fullName: 'Rameshwar Khot',
      phone: '+91 98231 44556',
      streetAddress: 'Plot 12, Market Yard',
      locality: 'Gultekdi, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411037',
      isDefault: true
    }]
  },
  {
    name: 'Suresh Kirana & Restaurant (Buyer)',
    email: 'buyer@mandiplus.com',
    password: 'Password123!',
    phone: '+91 98901 77889',
    role: 'buyer',
    businessName: 'Annapurna Bhojanalaya & Retail',
    locality: 'Kothrud, Pune',
    status: 'active',
    approvalStatus: 'not_required',
    isActive: true,
    addresses: [{
      fullName: 'Suresh Sharma',
      phone: '+91 98901 77889',
      streetAddress: 'Shop 4, Gandhi Chowk, Paud Road',
      locality: 'Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      isDefault: true,
      deliveryInstructions: 'Deliver before 11:00 AM at rear kitchen entrance.'
    }]
  },
  {
    name: 'Amit Shinde (Delivery Partner)',
    email: 'delivery@mandiplus.com',
    password: 'Password123!',
    phone: '+91 98765 43210',
    role: 'delivery',
    businessName: 'Kisan Express Logistics',
    locality: 'Pune & Pimpri-Chinchwad',
    status: 'active',
    approvalStatus: 'approved',
    isActive: true,
    deliveryProfile: {
      vehicleType: 'Tata Ace Mini Truck',
      vehicleNumber: 'MH-12-AQ-8899',
      drivingLicense: 'MH1220180029341',
      isAvailable: true,
      activeDeliveriesCount: 1
    }
  },
  {
    name: 'Mandi+ Administrator',
    email: 'admin@mandiplus.com',
    password: 'Password123!',
    phone: '+91 99999 88888',
    role: 'admin',
    businessName: 'Mandi+ Central Operations',
    locality: 'Mumbai HQ',
    status: 'active',
    approvalStatus: 'not_required',
    isActive: true
  },
  {
    name: 'Kavita Joshi (Mandi+ Hub Lead)',
    email: 'hub@mandiplus.com',
    password: 'Password123!',
    phone: '+91 98888 77777',
    role: 'hub_operator',
    businessName: 'Mandi+ Central Fulfilment Hub',
    locality: 'Pune Market Yard',
    status: 'active',
    approvalStatus: 'not_required',
    isActive: true
  },
  {
    name: 'Sunita Deshmukh (Farmer C - Potatoes)',
    email: 'sunita@mandiplus.com',
    password: 'Password123!',
    phone: '+91 98111 22334',
    role: 'farmer',
    businessName: 'Deshmukh Organic Agro Farms',
    locality: 'Manchar, Pune',
    status: 'active',
    approvalStatus: 'approved',
    isActive: true,
    sellerProfile: {
      verified: true,
      farmLocation: 'Manchar, Pune, Maharashtra',
      farmSizeAcres: 18,
      primaryCrops: ['Potato', 'Carrot', 'Beetroot'],
      averageRating: 4.9,
      totalRatings: 64
    }
  }
];

export const productsSeed = [
  {
    name: 'Nashik Red Onions (Export Quality)',
    category: 'Vegetables',
    cropType: 'Onion',
    description: 'Pungent, firm Nashik red onions with thick dry outer scales. Ideal for hotels, restaurants, and long-term storage.',
    images: [
      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 28,
    originalPrice: 35,
    stockQuantity: 4500,
    minOrderQuantity: 1,
    bulkPricingTiers: [
      { minQuantity: 50, pricePerUnit: 25, discountPercent: 11 },
      { minQuantity: 200, pricePerUnit: 22, discountPercent: 21 },
      { minQuantity: 500, pricePerUnit: 19, discountPercent: 32 }
    ],
    qualityGrade: 'Grade A',
    qualityGradeDetails: {
      assessedAt: new Date(),
      assessedBy: 'Mandi+ AgriVision Model',
      confidence: 0.96,
      notes: 'Uniform 55-65mm bulb diameter, zero rot, skin dryness verified.',
      defectRatePercent: 1.2
    },
    pickupLocality: 'Nashik APMC',
    isOrganic: false,
    productionMethod: 'Open Field',
    averageRating: 4.8,
    totalReviews: 24
  },
  {
    name: 'Hybrid Salad Tomatoes (Farm Fresh)',
    category: 'Vegetables',
    cropType: 'Tomato',
    description: 'Bright red, juicy, firm hybrid tomatoes harvested at 80% ripeness for long transport shelf-life.',
    images: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546470427-e26264be0b11?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 22,
    originalPrice: 30,
    stockQuantity: 2800,
    minOrderQuantity: 1,
    bulkPricingTiers: [
      { minQuantity: 40, pricePerUnit: 20, discountPercent: 9 },
      { minQuantity: 100, pricePerUnit: 18, discountPercent: 18 },
      { minQuantity: 300, pricePerUnit: 15, discountPercent: 32 }
    ],
    qualityGrade: 'Grade A',
    qualityGradeDetails: {
      assessedAt: new Date(),
      assessedBy: 'Mandi+ AgriVision Model',
      confidence: 0.94,
      notes: 'Firm pulp, deep red coloration, no blossom end rot.',
      defectRatePercent: 2.0
    },
    pickupLocality: 'Nashik APMC',
    isOrganic: false,
    productionMethod: 'Open Field',
    averageRating: 4.7,
    totalReviews: 38
  },
  {
    name: 'Jyoti Table Potatoes (Cold Store Fresh)',
    category: 'Vegetables',
    cropType: 'Potato',
    description: 'Smooth-skinned, medium-to-large Jyoti variety potatoes. Perfect for boiling, curries, and french fries.',
    images: [
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 24,
    originalPrice: 28,
    stockQuantity: 6000,
    minOrderQuantity: 1,
    bulkPricingTiers: [
      { minQuantity: 50, pricePerUnit: 21, discountPercent: 12 },
      { minQuantity: 250, pricePerUnit: 18, discountPercent: 25 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Pune Market Yard',
    isOrganic: false,
    productionMethod: 'Open Field',
    averageRating: 4.6,
    totalReviews: 19
  },
  {
    name: 'Certified Organic Baby Spinach (Palak)',
    category: 'Organic Produce',
    cropType: 'Spinach',
    description: 'Tender, organic, pesticide-free spinach leaves cultivated with vermicompost. High in iron and nutrients.',
    images: [
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 35,
    originalPrice: 45,
    stockQuantity: 450,
    minOrderQuantity: 5,
    bulkPricingTiers: [
      { minQuantity: 25, pricePerUnit: 30, discountPercent: 14 }
    ],
    qualityGrade: 'Grade A',
    isOrganic: true,
    organicCertNumber: 'NPOP/NAB/0014/2025',
    productionMethod: 'Organic Farmed',
    pickupLocality: 'Pune Market Yard',
    averageRating: 4.9,
    totalReviews: 15
  },
  {
    name: 'Sharbati Golden Wheat (MP Origin)',
    category: 'Grains',
    cropType: 'Wheat',
    description: 'Heavy, lustrous golden Sharbati wheat grains yielding extraordinarily soft and nutritious rotis.',
    images: [
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 42,
    originalPrice: 50,
    stockQuantity: 8500,
    minOrderQuantity: 25,
    bulkPricingTiers: [
      { minQuantity: 100, pricePerUnit: 38, discountPercent: 10 },
      { minQuantity: 500, pricePerUnit: 35, discountPercent: 17 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Pune Market Yard',
    isOrganic: false,
    productionMethod: 'Traditional',
    averageRating: 4.8,
    totalReviews: 42
  },
  {
    name: 'Royal 1121 Aged Basmati Rice',
    category: 'Grains',
    cropType: 'Rice',
    description: 'Extra-long grain aromatic basmati rice aged for 2 years. Cooks to twice its original grain length.',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 95,
    originalPrice: 120,
    stockQuantity: 3200,
    minOrderQuantity: 10,
    bulkPricingTiers: [
      { minQuantity: 50, pricePerUnit: 88, discountPercent: 7 },
      { minQuantity: 200, pricePerUnit: 82, discountPercent: 14 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Pune Market Yard',
    isOrganic: false,
    productionMethod: 'Traditional',
    averageRating: 4.9,
    totalReviews: 61
  },
  {
    name: 'Unpolished Desi Toor Dal (Pigeon Pea)',
    category: 'Pulses',
    cropType: 'Toor Dal',
    description: 'Naturally sun-dried and water-processed toor dal with zero artificial yellow oil polish. Maximum protein content.',
    images: [
      'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 140,
    originalPrice: 165,
    stockQuantity: 2200,
    minOrderQuantity: 5,
    bulkPricingTiers: [
      { minQuantity: 30, pricePerUnit: 130, discountPercent: 7 },
      { minQuantity: 100, pricePerUnit: 122, discountPercent: 13 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Nashik APMC',
    isOrganic: true,
    productionMethod: 'Organic Farmed',
    averageRating: 4.8,
    totalReviews: 29
  },
  {
    name: 'Salem Pure Turmeric Fingers (Curcumin 4.5%)',
    category: 'Spices',
    cropType: 'Turmeric',
    description: 'Whole aromatic dried Salem turmeric rhizomes rich in natural essential oils and active curcumin.',
    images: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 180,
    originalPrice: 220,
    stockQuantity: 1400,
    minOrderQuantity: 5,
    bulkPricingTiers: [
      { minQuantity: 25, pricePerUnit: 165, discountPercent: 8 },
      { minQuantity: 100, pricePerUnit: 150, discountPercent: 17 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Nashik APMC',
    isOrganic: false,
    productionMethod: 'Traditional',
    averageRating: 4.9,
    totalReviews: 18
  },
  {
    name: 'Ratnagiri Alphonso (Hapus) Mangoes',
    category: 'Fruits',
    cropType: 'Mango',
    description: 'GI-tagged authentic Ratnagiri Alphonso mangoes. Naturally ripened in grass crates with heavenly aroma.',
    images: [
      'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'dozen',
    pricePerUnit: 650,
    originalPrice: 850,
    stockQuantity: 350,
    minOrderQuantity: 2,
    bulkPricingTiers: [
      { minQuantity: 10, pricePerUnit: 580, discountPercent: 11 },
      { minQuantity: 50, pricePerUnit: 520, discountPercent: 20 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Pune Market Yard',
    isOrganic: false,
    productionMethod: 'Traditional',
    averageRating: 5.0,
    totalReviews: 54
  },
  {
    name: 'Fresh Ginger (Ale) - Hot Spicy Variety',
    category: 'Spices',
    cropType: 'Ginger',
    description: 'Freshly dug aromatic ginger with thick fleshy rhizomes, free from dirt clods and rot.',
    images: [
      'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 65,
    originalPrice: 80,
    stockQuantity: 1800,
    minOrderQuantity: 5,
    bulkPricingTiers: [
      { minQuantity: 30, pricePerUnit: 58, discountPercent: 11 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Nashik APMC',
    isOrganic: false,
    productionMethod: 'Open Field',
    averageRating: 4.7,
    totalReviews: 12
  },
  {
    name: 'Bhusawal G9 Cavendish Bananas (Export Grade)',
    category: 'Fruits',
    cropType: 'Banana',
    description: 'Large, clean, unblemished Bhusawal bananas harvested at uniform mature green stage.',
    images: [
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'crate',
    pricePerUnit: 380,
    originalPrice: 450,
    stockQuantity: 420,
    minOrderQuantity: 2,
    bulkPricingTiers: [
      { minQuantity: 10, pricePerUnit: 340, discountPercent: 11 },
      { minQuantity: 50, pricePerUnit: 310, discountPercent: 18 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Nashik APMC',
    isOrganic: false,
    productionMethod: 'Greenhouse',
    averageRating: 4.8,
    totalReviews: 31
  },
  {
    name: 'Pure Desi A2 Gir Cow Ghee (Bilona Method)',
    category: 'Dairy',
    cropType: 'Ghee',
    description: 'Traditional Vedic bilona cultured ghee prepared from grass-fed Gir cows. Rich aroma and granular texture.',
    images: [
      'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80'
    ],
    unit: 'kg',
    pricePerUnit: 1450,
    originalPrice: 1700,
    stockQuantity: 180,
    minOrderQuantity: 1,
    bulkPricingTiers: [
      { minQuantity: 5, pricePerUnit: 1350, discountPercent: 7 },
      { minQuantity: 20, pricePerUnit: 1250, discountPercent: 14 }
    ],
    qualityGrade: 'Grade A',
    pickupLocality: 'Pune Market Yard',
    isOrganic: true,
    productionMethod: 'Traditional',
    averageRating: 5.0,
    totalReviews: 44
  }
];
