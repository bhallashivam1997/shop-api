// In-memory product catalog (fixed seed data so every demo run returns the same results).
// price is in US dollars. rating is 0-5. imageUrl uses a seeded placeholder image.

const raw = [
  // Electronics
  ['Wireless Noise-Cancelling Headphones', 'Over-ear headphones with 30-hour battery and adaptive noise cancelling.', 199.99, 'Electronics', 'Sonora', 4.6, 312, true],
  ['Bluetooth Speaker Mini', 'Pocket-sized waterproof speaker with deep bass.', 39.99, 'Electronics', 'Sonora', 4.3, 845, true],
  ['4K Action Camera', 'Shoot stabilised 4K video underwater, on bikes or on the slopes.', 249.0, 'Electronics', 'Vantix', 4.4, 127, false],
  ['Mechanical Keyboard', 'Hot-swappable switches, RGB backlight and an aluminium frame.', 89.5, 'Electronics', 'Keyforge', 4.7, 590, true],
  ['Wireless Ergonomic Mouse', 'Vertical design that reduces wrist strain, USB-C charging.', 34.99, 'Electronics', 'Keyforge', 4.2, 402, true],
  ['Smartwatch Fit 3', 'Heart-rate, sleep and GPS tracking with a 7-day battery.', 149.0, 'Electronics', 'Vantix', 4.1, 268, true],
  ['USB-C Charging Hub', '7-in-1 hub with HDMI, SD card reader and 100W pass-through.', 45.0, 'Electronics', 'Linkly', 4.5, 733, true],
  ['Portable SSD 1TB', 'Fast external storage that fits in your pocket.', 109.99, 'Electronics', 'Linkly', 4.8, 1210, false],

  // Books
  ['The Pragmatic Builder', 'A practical guide to writing software that lasts.', 32.0, 'Books', 'Northwind Press', 4.8, 980, true],
  ['Designing Calm Interfaces', 'How to build products that respect people\'s attention.', 27.5, 'Books', 'Northwind Press', 4.5, 214, true],
  ['Midnight in the Orchard', 'A slow-burning mystery set in a small mountain town.', 14.99, 'Books', 'Lantern House', 4.3, 1530, true],
  ['The Last Lighthouse', 'An epic sea adventure across three generations.', 18.0, 'Books', 'Lantern House', 4.6, 642, false],
  ['Plant-Based Weeknights', '100 quick vegetarian dinners in 30 minutes or less.', 24.99, 'Books', 'Greenleaf', 4.4, 377, true],
  ['Atlas of Tiny Places', 'An illustrated tour of the world\'s smallest towns.', 35.0, 'Books', 'Greenleaf', 4.7, 158, true],
  ['Learn Data in a Weekend', 'Hands-on intro to spreadsheets, SQL and charts.', 21.0, 'Books', 'Northwind Press', 3.9, 96, true],
  ['Stories for Bedtime', 'Twenty short, gentle stories for young readers.', 12.5, 'Books', 'Lantern House', 4.9, 2210, true],

  // Home & Kitchen
  ['Pour-Over Coffee Set', 'Glass dripper, kettle and filters for the perfect morning cup.', 54.0, 'Home & Kitchen', 'Brewhaus', 4.6, 489, true],
  ['Cast Iron Skillet 26cm', 'Pre-seasoned skillet that goes from stovetop to oven.', 38.0, 'Home & Kitchen', 'Hearthstone', 4.8, 1675, true],
  ['Linen Throw Blanket', 'Soft washed linen in a calming sage green.', 69.0, 'Home & Kitchen', 'Nestwell', 4.4, 233, false],
  ['Ceramic Plant Pot Trio', 'Three matte ceramic pots with drainage trays.', 29.99, 'Home & Kitchen', 'Nestwell', 4.2, 312, true],
  ['Smart LED Desk Lamp', 'Adjustable colour temperature with a wireless charging base.', 59.0, 'Home & Kitchen', 'Lumen & Co', 4.5, 410, true],
  ['Bamboo Cutting Board Set', 'Three boards in different sizes with juice grooves.', 26.0, 'Home & Kitchen', 'Hearthstone', 4.3, 590, true],
  ['Aroma Diffuser', 'Ultrasonic diffuser with seven ambient light colours.', 32.5, 'Home & Kitchen', 'Lumen & Co', 3.8, 145, true],
  ['Stainless Steel Water Bottle', 'Keeps drinks cold for 24 hours or hot for 12.', 22.0, 'Home & Kitchen', 'Brewhaus', 4.7, 2050, true],

  // Fashion
  ['Classic Denim Jacket', 'Mid-wash denim jacket with a relaxed fit.', 79.0, 'Fashion', 'Thread & Co', 4.4, 356, true],
  ['Everyday Canvas Sneakers', 'Lightweight sneakers with a cushioned insole.', 49.99, 'Fashion', 'Stride', 4.5, 1104, true],
  ['Merino Wool Beanie', 'Warm, breathable and itch-free.', 19.99, 'Fashion', 'Thread & Co', 4.6, 487, true],
  ['Leather Card Wallet', 'Slim full-grain leather wallet that holds six cards.', 35.0, 'Fashion', 'Hidecraft', 4.7, 802, false],
  ['Polarised Sunglasses', 'Lightweight frames with UV400 protection.', 59.0, 'Fashion', 'Stride', 4.1, 264, true],
  ['Organic Cotton Hoodie', 'Heavyweight hoodie made from 100% organic cotton.', 64.0, 'Fashion', 'Thread & Co', 4.3, 538, true],
  ['Weekender Duffel Bag', 'Water-resistant canvas bag with a shoe compartment.', 95.0, 'Fashion', 'Hidecraft', 4.8, 197, true],
  ['Silk Scarf', 'Hand-rolled edges and a bold geometric print.', 42.0, 'Fashion', 'Thread & Co', 3.7, 58, true],

  // Sports & Outdoors
  ['Yoga Mat Pro', 'Non-slip 6mm mat with alignment lines.', 44.99, 'Sports & Outdoors', 'Peakline', 4.6, 1320, true],
  ['Adjustable Dumbbells Pair', 'Swap from 2 to 24 kg in seconds.', 299.0, 'Sports & Outdoors', 'Ironpeak', 4.7, 412, false],
  ['Trail Running Shoes', 'Grippy outsole and a breathable mesh upper.', 119.0, 'Sports & Outdoors', 'Stride', 4.5, 689, true],
  ['Insulated Camping Mug', 'Double-wall mug with a sliding lid.', 18.5, 'Sports & Outdoors', 'Peakline', 4.4, 275, true],
  ['Two-Person Tent', 'Sets up in five minutes and packs down to 2 kg.', 189.0, 'Sports & Outdoors', 'Peakline', 4.3, 166, true],
  ['Resistance Bands Set', 'Five bands with handles, door anchor and a carry bag.', 24.99, 'Sports & Outdoors', 'Ironpeak', 4.2, 940, true],
  ['Cycling Helmet', 'Lightweight helmet with a rear safety light.', 74.0, 'Sports & Outdoors', 'Vantix', 4.6, 318, true],
  ['Foam Roller', 'High-density roller for post-workout recovery.', 21.0, 'Sports & Outdoors', 'Ironpeak', 4.0, 503, true],
];

const products = raw.map(([name, description, price, category, brand, rating, reviewCount, inStock], i) => {
  const id = `p${String(i + 1).padStart(3, '0')}`;
  return {
    id,
    name,
    description,
    price,
    category,
    brand,
    rating,
    reviewCount,
    inStock,
    imageUrl: `https://picsum.photos/seed/shop-${id}/400/300`,
  };
});

module.exports = products;
