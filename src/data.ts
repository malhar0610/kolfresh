export type CategoryId = 'all' | 'fresh-fish' | 'prawns' | 'crabs' | 'dried-fish' | 'ready-to-cook';

export interface Category {
  id: CategoryId;
  label: string;
  mr: string;
  hi: string;
}

export interface SizeOption {
  label: string;
  multiplier: number;
}

export interface CutOption {
  id: string;
  label: string;
  mr: string;
  hi: string;
  surcharge: number;
}

export interface Product {
  id: string;
  name: string;
  localName: string;
  category: Exclude<CategoryId, 'all'>;
  image: string;
  alt: string;
  unitPrice: number;
  unitLabel: string;
  priceLabel: string;
  sizeOptions: SizeOption[];
  cutOptions: CutOption[];
  tag?: string;
  tagTone?: 'coral' | 'green' | 'gold';
  notes: string;
  origin: string;
}

const freshCuts: CutOption[] = [
  { id: 'whole', label: 'Whole', mr: 'अख्खा', hi: 'साबुत', surcharge: 0 },
  { id: 'cleaned', label: 'Cleaned', mr: 'स्वच्छ', hi: 'साफ़', surcharge: 25 },
  { id: 'curry', label: 'Curry cut', mr: 'करी कट', hi: 'करी कट', surcharge: 45 },
  { id: 'fillet', label: 'Fillet', mr: 'फिलेट', hi: 'फ़िले', surcharge: 70 },
];

const standardPack: CutOption[] = [
  { id: 'standard', label: 'Standard pack', mr: 'पॅक', hi: 'पैक', surcharge: 0 },
];

const freshSizes: SizeOption[] = [
  { label: '250 g', multiplier: 0.25 },
  { label: '500 g', multiplier: 0.5 },
  { label: '1 kg', multiplier: 1 },
];

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All the catch', mr: 'सगळा मासा', hi: 'सारी ताज़गी' },
  { id: 'fresh-fish', label: 'Fresh fish', mr: 'ताजा मासा', hi: 'ताज़ी मछली' },
  { id: 'prawns', label: 'Prawns', mr: 'कोळंबी', hi: 'झींगा' },
  { id: 'crabs', label: 'Crabs', mr: 'खेकडे', hi: 'केकड़ा' },
  { id: 'dried-fish', label: 'Dried fish', mr: 'सुका मासा', hi: 'सूखी मछली' },
  { id: 'ready-to-cook', label: 'Ready to cook', mr: 'शिजवायला तयार', hi: 'पकाने के लिए तैयार' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'black-pomfret',
    name: 'Black Pomfret',
    localName: 'Halwa · Indian pomfret',
    category: 'fresh-fish',
    image: '/img/products/black-pomfret.svg',
    alt: 'Fresh silver pomfret on crushed ice',
    unitPrice: 1480,
    unitLabel: 'kg',
    priceLabel: 'per kg',
    sizeOptions: freshSizes,
    cutOptions: freshCuts,
    tag: 'Kolhapur favourite',
    tagTone: 'coral',
    notes: 'Firm, sweet flesh with delicate flavour.',
    origin: 'Konkan coast',
  },
  {
    id: 'surmai',
    name: 'Surmai',
    localName: 'Kingfish · curry favourite',
    category: 'fresh-fish',
    image: '/img/products/surmai.svg',
    alt: 'A fresh selection of coastal fish on ice',
    unitPrice: 1390,
    unitLabel: 'kg',
    priceLabel: 'per kg',
    sizeOptions: freshSizes,
    cutOptions: freshCuts,
    tag: 'Popular',
    tagTone: 'green',
    notes: 'Meaty, boneless steaks for the Sunday curry.',
    origin: 'Arabian Sea',
  },
  {
    id: 'rawas',
    name: 'Rawas',
    localName: 'Indian salmon · mild & buttery',
    category: 'fresh-fish',
    image: '/img/products/rawas.svg',
    alt: 'Fresh whole Indian fish on ice',
    unitPrice: 1090,
    unitLabel: 'kg',
    priceLabel: 'per kg',
    sizeOptions: freshSizes,
    cutOptions: freshCuts,
    notes: 'A gentle, flaky fish that loves a tawa fry.',
    origin: 'Konkan coast',
  },
  {
    id: 'tiger-prawns',
    name: 'Tiger Prawns',
    localName: 'Jumbo prawns · clean & deveined',
    category: 'prawns',
    image: '/img/products/tiger-prawns.svg',
    alt: 'Fresh tiger prawns arranged on ice',
    unitPrice: 1180,
    unitLabel: 'kg',
    priceLabel: 'per kg',
    sizeOptions: freshSizes,
    cutOptions: [
      { id: 'shell-on', label: 'Shell on', mr: 'सालासह', hi: 'छिलके सहित', surcharge: 0 },
      { id: 'cleaned', label: 'Cleaned', mr: 'स्वच्छ', hi: 'साफ़', surcharge: 30 },
      { id: 'deveined', label: 'Clean & deveined', mr: 'स्वच्छ व नस काढलेली', hi: 'साफ़ व नस निकाली', surcharge: 55 },
    ],
    tag: 'Sweet & meaty',
    tagTone: 'gold',
    notes: 'Plump coastal prawns, cleaned your way.',
    origin: 'Arabian Sea',
  },
  {
    id: 'mud-crab',
    name: 'Mud Crab',
    localName: 'Large · cleaned to order',
    category: 'crabs',
    image: '/img/products/mud-crab.svg',
    alt: 'Fresh Indian mud crab displayed on ice',
    unitPrice: 890,
    unitLabel: 'kg',
    priceLabel: 'per kg',
    sizeOptions: freshSizes,
    cutOptions: [
      { id: 'whole', label: 'Whole', mr: 'अख्खा', hi: 'साबुत', surcharge: 0 },
      { id: 'cracked', label: 'Cracked & cleaned', mr: 'स्वच्छ व फोडलेला', hi: 'साफ़ व क्रैक किया', surcharge: 50 },
    ],
    tag: 'Weekend pick',
    tagTone: 'coral',
    notes: 'Sweet, tender meat for a rich Kolhapuri masala.',
    origin: 'Konkan coast',
  },
  {
    id: 'bombil',
    name: 'Dried Bombil',
    localName: 'Bombay duck · sun dried',
    category: 'dried-fish',
    image: '/img/products/bombil.svg',
    alt: 'Sun-dried Bombay duck fish in a leaf-lined basket',
    unitPrice: 249,
    unitLabel: 'pack',
    priceLabel: 'per 200 g pack',
    sizeOptions: [
      { label: '1 pack · 200 g', multiplier: 1 },
      { label: '2 packs · 400 g', multiplier: 2 },
      { label: '3 packs · 600 g', multiplier: 3 },
    ],
    cutOptions: standardPack,
    notes: 'Carefully sun-dried and sealed for the pantry.',
    origin: 'Konkan coast',
  },
  {
    id: 'surmai-curry-cut',
    name: 'Surmai Curry Cut',
    localName: 'Cleaned · ready for the pan',
    category: 'ready-to-cook',
    image: '/img/products/surmai-curry-cut.svg',
    alt: 'Fresh fish pieces prepared for cooking',
    unitPrice: 1450,
    unitLabel: 'kg',
    priceLabel: 'per kg',
    sizeOptions: freshSizes,
    cutOptions: [
      { id: 'curry', label: 'Curry cut', mr: 'करी कट', hi: 'करी कट', surcharge: 0 },
      { id: 'small-curry', label: 'Small curry cut', mr: 'लहान करी कट', hi: 'छोटा करी कट', surcharge: 15 },
    ],
    tag: 'Kitchen-ready',
    tagTone: 'green',
    notes: 'Cleaned, portioned and ready for your favourite curry.',
    origin: 'Prepared fresh',
  },
  {
    id: 'dry-prawns',
    name: 'Sode · Dried Prawns',
    localName: 'Coastal pantry favourite',
    category: 'dried-fish',
    image: '/img/products/dry-prawns.svg',
    alt: 'Dried coastal seafood in a simple market setting',
    unitPrice: 229,
    unitLabel: 'pack',
    priceLabel: 'per 100 g pack',
    sizeOptions: [
      { label: '1 pack · 100 g', multiplier: 1 },
      { label: '2 packs · 200 g', multiplier: 2 },
      { label: '3 packs · 300 g', multiplier: 3 },
    ],
    cutOptions: standardPack,
    notes: 'A little goes a long way in a bright, savoury chutney.',
    origin: 'Konkan coast',
  },
];

export interface CartItem {
  key: string;
  productId: string;
  sizeLabel: string;
  multiplier: number;
  cutId: string;
  cutLabel: string;
  quantity: number;
  unitAmount: number;
}

export function itemAmount(product: Product, multiplier: number, surcharge: number): number {
  return Math.round((product.unitPrice + surcharge) * multiplier);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function findProduct(productId: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === productId);
}
