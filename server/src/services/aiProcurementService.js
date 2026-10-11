import { Product } from '../models/Product.js';

// Multilingual crop dictionary mapping common names in English, Hindi, Marathi to database search keywords
const CROP_SYNONYMS = {
  tomato: ['tomato', 'tamatar', 'टोमॅटो', 'टमाटर'],
  onion: ['onion', 'pyaz', 'kanda', 'कांदा', 'प्याज'],
  potato: ['potato', 'aloo', 'batata', 'बटाटा', 'आलू'],
  rice: ['rice', 'chawal', 'tandul', 'तांदूळ', 'चावल', 'basmati'],
  wheat: ['wheat', 'gehu', 'gahu', 'गहू', 'गेहूं'],
  ginger: ['ginger', 'adrak', 'ale', 'आले', 'अदरक'],
  garlic: ['garlic', 'lahsun', 'lasun', 'लसूण', 'लहसुन'],
  mango: ['mango', 'aam', 'hafoos', 'amba', 'आंबा', 'आम'],
  banana: ['banana', 'kela', 'kele', 'केळी', 'केला'],
  apple: ['apple', 'seb', 'safarchand', 'सफरचंद', 'सेब'],
  spinach: ['spinach', 'palak', 'पालक'],
  turmeric: ['turmeric', 'haldi', 'halad', 'हळद', 'हल्दी'],
  chilli: ['chilli', 'mirchi', 'mirch', 'मिरची', 'मिर्च'],
  coriander: ['coriander', 'dhaniya', 'kothimbir', 'कोथिंबीर', 'धनिया']
};

/**
 * Natural language intent parser for agricultural procurement queries
 */
export const parseProcurementQuery = (text) => {
  const normalized = text.toLowerCase();
  const requestedItems = [];

  // Match numbers followed by kg, kilo, quintal, crate, tonne, टन, किलो
  const quantityRegex = /(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|quintal|crates?|tonnes?|टन|किलो|किग्रा|पोती)?\s*([a-zA-Z\u0900-\u097F]+)/gi;
  let match;

  while ((match = quantityRegex.exec(normalized)) !== null) {
    const rawQuantity = parseFloat(match[1]);
    const word = match[2];

    for (const [standardCrop, aliases] of Object.entries(CROP_SYNONYMS)) {
      if (aliases.some(alias => word.includes(alias) || alias.includes(word))) {
        requestedItems.push({
          crop: standardCrop,
          keyword: word,
          quantity: rawQuantity || 10
        });
        break;
      }
    }
  }

  // Fallback: search for crop names directly if no explicit number was paired
  if (requestedItems.length === 0) {
    for (const [standardCrop, aliases] of Object.entries(CROP_SYNONYMS)) {
      if (aliases.some(alias => normalized.includes(alias))) {
        requestedItems.push({
          crop: standardCrop,
          keyword: standardCrop,
          quantity: 25 // sensible default procurement quantity
        });
      }
    }
  }

  return requestedItems;
};

/**
 * Searches real MongoDB inventory, matches real suppliers, sorts by best value,
 * and formats recommendation explanations in the user's preferred language.
 */
export const generateProcurementAdvice = async ({ message, language = 'en', userLocality = '' }) => {
  const parsedItems = parseProcurementQuery(message);
  const recommendations = [];
  const explanations = [];

  if (parsedItems.length === 0) {
    // Generic fallback or open search
    const sampleProducts = await Product.find({ isAvailable: true, stockQuantity: { $gt: 0 } })
      .sort({ pricePerUnit: 1 })
      .limit(3)
      .lean();

    sampleProducts.forEach(p => {
      recommendations.push({
        productId: p._id,
        name: p.name,
        sellerName: p.sellerName,
        unit: p.unit,
        pricePerUnit: p.pricePerUnit,
        availableStock: p.stockQuantity,
        locality: p.pickupLocality,
        matchReason: 'Top value daily produce from verified regional farmers.'
      });
    });

    const reply = language === 'hi'
      ? 'कृपया अपनी आवश्यकता बताएं (उदा. "मुझे 50 किलो टमाटर और 20 किलो प्याज चाहिए")। यहाँ कुछ शीर्ष उपलब्ध ताज़ा उत्पाद हैं:'
      : language === 'mr'
      ? 'कृपया तुमची आवश्यकता सांगा (उदा. "मला ५० किलो टोमॅटो आणि २० किलो कांदा हवा आहे")। येथे काही उपलब्ध ताजी उत्पादने आहेत:'
      : 'Please specify the crops and quantities you need (e.g., "I need 50 kg tomatoes and 20 kg onions for my business tomorrow"). Here are top fresh deals currently in stock:';

    return { reply, recommendations, parsedItems };
  }

  for (const item of parsedItems) {
    // Query actual products in database
    const aliases = CROP_SYNONYMS[item.crop] || [item.crop];
    const regexList = aliases.map(a => new RegExp(a, 'i'));

    const matchingProducts = await Product.find({
      isAvailable: true,
      stockQuantity: { $gt: 0 },
      $or: [
        { name: { $in: regexList } },
        { cropType: { $in: regexList } },
        { category: { $in: regexList } }
      ]
    })
      .sort({ pricePerUnit: 1 })
      .limit(3)
      .lean();

    if (matchingProducts.length > 0) {
      for (const prod of matchingProducts) {
        let bestPrice = prod.pricePerUnit;
        let tierNote = '';

        if (prod.bulkPricingTiers && prod.bulkPricingTiers.length > 0) {
          const matchedTier = [...prod.bulkPricingTiers]
            .sort((a, b) => b.minQuantity - a.minQuantity)
            .find(t => item.quantity >= t.minQuantity);
          if (matchedTier) {
            bestPrice = matchedTier.pricePerUnit;
            tierNote = ` (Bulk tier discount applied: ₹${bestPrice}/${prod.unit})`;
          }
        }

        const isStockOk = prod.stockQuantity >= item.quantity;
        const stockNote = isStockOk
          ? `Sufficient stock (${prod.stockQuantity} ${prod.unit} available)`
          : `Partial stock (${prod.stockQuantity} ${prod.unit} available)`;

        recommendations.push({
          productId: prod._id,
          name: prod.name,
          sellerName: prod.sellerName,
          unit: prod.unit,
          pricePerUnit: bestPrice,
          availableStock: prod.stockQuantity,
          locality: prod.pickupLocality,
          matchReason: `Farmer ${prod.sellerName} in ${prod.pickupLocality} offers ${prod.qualityGrade} quality at ₹${bestPrice}/${prod.unit}. ${stockNote}${tierNote}`
        });
      }

      const topMatch = matchingProducts[0];
      if (language === 'hi') {
        explanations.push(`**${item.crop.toUpperCase()}** (${item.quantity} किलो): किसान ${topMatch.sellerName} (${topMatch.pickupLocality}) से ₹${topMatch.pricePerUnit}/${topMatch.unit} की दर पर सर्वोत्तम विकल्प मिला।`);
      } else if (language === 'mr') {
        explanations.push(`**${item.crop.toUpperCase()}** (${item.quantity} किलो): शेतकरी ${topMatch.sellerName} (${topMatch.pickupLocality}) यांच्याकडून ₹${topMatch.pricePerUnit}/${topMatch.unit} दराने सर्वोत्तम पर्याय सापडला.`);
      } else {
        explanations.push(`**${item.crop.toUpperCase()}** (${item.quantity} ${topMatch.unit}): Recommended from farmer ${topMatch.sellerName} (${topMatch.pickupLocality}) at ₹${topMatch.pricePerUnit}/${topMatch.unit} with ${topMatch.qualityGrade} rating.`);
      }
    } else {
      if (language === 'hi') {
        explanations.push(`क्षमा करें, वर्तमान में '${item.crop}' के लिए कोई किसान विक्रेता उपलब्ध नहीं है।`);
      } else if (language === 'mr') {
        explanations.push(`माफ करा, सध्या '${item.crop}' साठी कोणताही शेतकरी विक्रेता उपलब्ध नाही.`);
      } else {
        explanations.push(`No active supplier found currently in inventory for '${item.crop}'.`);
      }
    }
  }

  const intro = language === 'hi'
    ? 'यहाँ आपकी आवश्यकता के आधार पर सत्यापित किसानों से प्राप्त सर्वोत्तम वास्तविक मूल्य सूची है:'
    : language === 'mr'
    ? 'येथे आपल्या गरजेनुसार पडताळणी केलेल्या शेतकऱ्यांची सर्वोत्कृष्ट थेट दर सूची आहे:'
    : 'Based on live inventory and regional farmer prices, here are the best matched deals for your procurement:';

  const reply = `${intro}\n\n${explanations.join('\n')}\n\nYou can click **Add to Cart** directly on any of the verified cards below to proceed.`;

  return { reply, recommendations, parsedItems };
};
