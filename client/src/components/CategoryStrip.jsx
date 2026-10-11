import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Carrot,
  Apple,
  Wheat,
  Package,
  Flame,
  ShieldCheck,
  Truck,
  Milk,
  Sprout,
  FlaskConical
} from 'lucide-react';

const CATEGORIES = [
  { name: 'All Products', slug: 'all', icon: Layers },
  { name: 'Vegetables', slug: 'vegetables', icon: Carrot },
  { name: 'Fruits', slug: 'fruits', icon: Apple },
  { name: 'Grains', slug: 'grains', icon: Wheat },
  { name: 'Pulses', slug: 'pulses', icon: Package },
  { name: 'Spices', slug: 'spices', icon: Flame },
  { name: 'Organic Produce', slug: 'organic-produce', icon: ShieldCheck },
  { name: 'Bulk Deals', slug: 'bulk-deals', icon: Truck },
  { name: 'Dairy', slug: 'dairy', icon: Milk },
  { name: 'Seeds', slug: 'seeds', icon: Sprout },
  { name: 'Fertilizers', slug: 'fertilizers', icon: FlaskConical }
];

export const CategoryStrip = () => {
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category')?.toLowerCase();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 sm:space-x-6 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = (cat.slug === 'all' && (!currentCategory || currentCategory === 'all')) ||
              currentCategory === cat.slug ||
              currentCategory === cat.name.toLowerCase();

            return (
              <Link
                key={idx}
                to={cat.slug === 'all' ? '/products' : `/products?category=${encodeURIComponent(cat.name)}`}
                className={`flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] px-2 py-1 rounded-lg group transition-all shrink-0 ${
                  isActive
                    ? 'text-mandi-blue font-bold bg-blue-50/70'
                    : 'text-gray-600 hover:text-mandi-blue hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${
                  isActive ? 'bg-mandi-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-mandi-blue'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-center whitespace-nowrap leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
