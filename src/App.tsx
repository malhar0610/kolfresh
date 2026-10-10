import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Icon, type IconName } from './Icon';
import { CATEGORIES, PRODUCTS, findProduct, formatINR, itemAmount, type CartItem, type CategoryId, type CutOption, type Product } from './data';
import { getOrderingState, breakdown, formatDay, formatWeekday, orderingDaysLabel, orderingHoursLabel } from './schedule';
import { DELIVERY, PICKUP, SERVICEABLE_PINCODES, BUSINESS } from './config';
import { placeOrder as saveOrder, nextOrderId, isoFromParts } from './shared/orders';

type Language = 'en' | 'mr' | 'hi';
type Page = 'store' | 'orders';
type Modal = 'product' | 'cart' | 'checkout' | 'confirmation' | null;
type Fulfillment = 'delivery' | 'pickup';

const COPY = {
  en: {
    catch: 'The catch', how: 'How it works', orders: 'Order status', search: 'Find your favourite fish…',
    eyebrow: 'GOOD FISH, A LITTLE PLANNING', title: 'The good catch,\nwithout the market run.',
    intro: 'Choose what you love. Our fishmonger sources to order, cleans it your way, and brings it fresh tomorrow.',
    shop: 'Explore today’s catch', howLink: 'See how it works',
    shopTitle: 'A better catch for tomorrow', shopSub: 'Small-batch seafood, sourced after the pre-order window closes.',
    all: 'All the catch', add: 'Choose your cut',
    open: 'Ordering is open right now', openSub: 'Place your order now — we source, clean and pack it after the 6 PM cut-off.',
    closed: 'Ordering is closed right now', closedSub: 'Browse and build your basket now. You can check out when the next window opens.',
    opensIn: 'Ordering opens in', closesIn: 'Ordering closes in', days: 'd', hours: 'h', mins: 'm', secs: 's',
    remind: 'Remind me when ordering opens', remindSaved: 'You’re on the list — we’ll ping you when ordering opens.',
    cart: 'Your basket', checkout: 'Continue to checkout', tomorrow: 'Tomorrow’s delivery',
    deliveryOn: 'Delivery', fulfilment: 'FULFILMENT DATE',
    routePreview: 'ROUTE PREVIEW', routeArea: 'Tarabai Park · Kolhapur', plannedRoute: 'SCHEMATIC',
    routeOrigin: 'KolFresh hub', routeDestination: 'Delivery address',
    routeNotice: 'Illustrative map only · this prototype does not have live rider GPS or turn-by-turn routing.',
  },
  mr: {
    catch: 'आजचा मासा', how: 'कसे काम करते', orders: 'ऑर्डर स्थिती', search: 'तुमचा आवडता मासा शोधा…',
    eyebrow: 'ताजा मासा, थोडे नियोजन', title: 'उद्याची ताजी मेजवानी,\nबाजाराच्या फेरीशिवाय.',
    intro: 'तुमचा आवडता मासा निवडा. आम्ही मागणीनुसार आणतो, तुमच्या पसंतीने स्वच्छ करतो आणि उद्या ताजा पोहोचवतो.',
    shop: 'आजचा मासा पाहा', howLink: 'कसे काम करते',
    shopTitle: 'उद्याच्या जेवणासाठी उत्तम मासा', shopSub: 'ऑर्डर विंडो बंद झाल्यावर मागणीनुसार आणलेला ताजा मासा.',
    all: 'सगळा मासा', add: 'कट निवडा',
    open: 'सध्या ऑर्डर सुरू आहेत', openSub: 'आता ऑर्डर द्या — संध्याकाळी ६ वाजेपूर्वी आम्ही मासा आणून स्वच्छ करून पाकीट करतो.',
    closed: 'सध्या ऑर्डर बंद आहेत', closedSub: 'आता मासा पाहा आणि बास्केट तयार करा. पुढील विंडो उघडल्यावर ऑर्डर देऊ शकाल.',
    opensIn: 'ऑर्डर सुरू होण्यात', closesIn: 'ऑर्डर बंद होण्यात', days: 'दि', hours: 'ता', mins: 'मि', secs: 'से',
    remind: 'ऑर्डर सुरू झाल्यावर आठवण करून द्या', remindSaved: 'तुम्ही नोंदवले — ऑर्डर सुरू झाल्यावर आम्ही कळवतो.',
    cart: 'तुमची बास्केट', checkout: 'चेकआउट पुढे सुरू ठेवा', tomorrow: 'उद्याची डिलिव्हरी',
    deliveryOn: 'डिलिव्हरी', fulfilment: 'पूर्तता तारीख',
    routePreview: 'मार्गाचा आराखडा', routeArea: 'ताराबाई पार्क · कोल्हापूर', plannedRoute: 'दर्शनी नकाशा',
    routeOrigin: 'कोलफ्रेश केंद्र', routeDestination: 'डिलिव्हरीचा पत्ता',
    routeNotice: 'हा फक्त नकाशाचा दर्शनी आराखडा आहे · या प्रोटोटाइपमध्ये रायडरचे थेट GPS किंवा वळणावळणाचे मार्गदर्शन नाही.',
  },
  hi: {
    catch: 'आज की ताज़ी मछली', how: 'कैसे काम करता है', orders: 'ऑर्डर स्थिति', search: 'अपनी पसंदीदा मछली खोजें…',
    eyebrow: 'ताज़ी मछली, थोड़ी योजना', title: 'कल की बेहतरीन मछली,\nबाज़ार की दौड़ के बिना।',
    intro: 'अपनी पसंद चुनें। हमारा मछुआरा ऑर्डर के अनुसार मछली लाता है, आपकी पसंद से साफ़ करता है और कल ताज़ा पहुँचाता है।',
    shop: 'आज की मछली देखें', howLink: 'कैसे काम करता है',
    shopTitle: 'कल के लिए ताज़ा चुनिंदा मछली', shopSub: 'प्री-ऑर्डर विंडो बंद होने के बाद मंगाया गया ताज़ा सीफ़ूड।',
    all: 'सभी ताज़ा चीज़ें', add: 'कट चुनें',
    open: 'अभी ऑर्डर खुले हैं',
    closed: 'अभी ऑर्डर बंद हैं', closedSub: 'अभी देखें और बास्केट बनाएँ। अगली विंडो खुलने पर चेकआउट कर सकेंगे।',
    openSub: 'अभी ऑर्डर करें — शाम 6 बजे कटऑफ के बाद हम मछली लाकर साफ़ व पैक करते हैं।',
    opensIn: 'ऑर्डर खुलने में', closesIn: 'ऑर्डर बंद होने में', days: 'दि', hours: 'घं', mins: 'मि', secs: 'से',
    remind: 'ऑर्डर खुलने पर याद दिलाएँ', remindSaved: 'आप नाम दिया — ऑर्डर खुलते ही हम बता देंगे।',
    cart: 'आपकी बास्केट', checkout: 'चेकआउट जारी रखें', tomorrow: 'कल की डिलीवरी',
    deliveryOn: 'डिलीवरी', fulfilment: 'पूर्ति तिथि',
    routePreview: 'रूट प्रीव्यू', routeArea: 'ताराबाई पार्क · कोल्हापुर', plannedRoute: 'सांकेतिक नक्शा',
    routeOrigin: 'कोलफ्रेश केंद्र', routeDestination: 'डिलीवरी का पता',
    routeNotice: 'यह केवल नक्शे का सांकेतिक चित्र है · इस प्रोटोटाइप में राइडर का लाइव GPS या मोड़-दर-मोड़ रूट उपलब्ध नहीं है.',
  },
} as const;

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="KolFresh home">
      <span className="brand-mark"><Icon name="fish" size={25} /></span>
      <span className="brand-word">kol<span>fresh</span><small>SEAFOOD, THE EASY WAY</small></span>
    </a>
  );
}

/** Grams for a size label: '500 g' → 500, '1 kg' → 1000, '2 packs · 400 g' → 400. */
function weightGrams(sizeLabel: string): number {
  const kg = sizeLabel.match(/([0-9.]+) *kg/i);
  if (kg) return Math.round(parseFloat(kg[1]) * 1000);
  const g = sizeLabel.match(/([0-9.]+) *g/i);
  if (g) return Math.round(parseFloat(g[1]));
  return 0;
}

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [page, setPage] = useState<Page>('store');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<CategoryId>('all');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponPercent, setCouponPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [deliverySlot, setDeliverySlot] = useState<'5:00 – 7:00 PM' | '7:00 – 9:00 PM'>(DELIVERY.slotOne);
  const [pincode, setPincode] = useState('416001');
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [lastOrderId, setLastOrderId] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);
  const copy = COPY[language];

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch = !normalized || `${product.name} ${product.localName} ${product.category}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [category, query]);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.unitAmount * item.quantity, 0);
  const discount = couponPercent ? Math.round((subtotal * couponPercent) / 100) : 0;
  const total = Math.max(0, subtotal - discount);

  // Live ordering-window state, recomputed from Asia/Kolkata time every tick.
  const ordering = useMemo(() => getOrderingState(new Date(now)), [now]);
  const windowOpen = ordering.open;
  const countdown = breakdown(ordering.nextChangeAt.getTime() - now);
  const fulfilmentDate = formatDay(ordering.fulfilmentDay);
  const orderingWeekday = formatWeekday(ordering.orderingDay);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  // Tick once per second so the countdown and window state stay live.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setModal('product');
  }

  function addItem(product: Product, sizeLabel: string, multiplier: number, cut: CutOption, quantity: number) {
    const unitAmount = itemAmount(product, multiplier, cut.surcharge);
    const key = `${product.id}:${sizeLabel}:${cut.id}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { key, productId: product.id, sizeLabel, multiplier, cutId: cut.id, cutLabel: cut.label, quantity, unitAmount }];
    });
    setModal(null);
    notify(`${product.name} added to your basket`);
  }

  function updateQuantity(key: string, next: number) {
    setCart((current) => next <= 0 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, quantity: next } : item));
    setCouponPercent(0);
    setCouponMessage('');
  }

  function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (code === 'KOL10' && subtotal >= 599) {
      setCouponPercent(10);
      setCouponMessage('KOL10 applied · 10% off');
    } else if (code === 'KOL10') {
      setCouponPercent(0);
      setCouponMessage('Add ₹599 of seafood to use this coupon.');
    } else {
      setCouponPercent(0);
      setCouponMessage('Try KOL10 for a 10% discount.');
    }
  }

  function startCheckout() {
    if (!windowOpen) {
      notify('Ordering is closed right now. Your basket is saved.');
      return;
    }
    setModal('checkout');
  }

  function placeOrder() {
    if (!windowOpen) {
      notify('The ordering window is closed.');
      return;
    }
    if (fulfillment === 'delivery' && !SERVICEABLE_PINCODES.includes(pincode.trim())) {
      setPincodeChecked(false);
      notify('Sorry, we don’t deliver to that pincode yet.');
      return;
    }
    if (!customerName.trim()) {
      notify('Please add your name so we know who the order is for.');
      return;
    }
    if (customerPhone.replace(/[^0-9]/g, '').length < 10) {
      notify('Please add a valid phone number for delivery updates.');
      return;
    }
    if (fulfillment === 'delivery' && !customerAddress.trim()) {
      notify('Please add your delivery address.');
      return;
    }

    // Save to the SHARED orders store so the admin panel sees it immediately.
    const items = cart.map((item) => {
      const product = findProduct(item.productId);
      return {
        productId: item.productId,
        name: product ? product.name : item.productId,
        sizeLabel: item.sizeLabel,
        cutLabel: item.cutLabel,
        qty: item.quantity,
        unitRupees: item.unitAmount,
        weightG: weightGrams(item.sizeLabel) * item.quantity,
      };
    });

    const id = nextOrderId();
    saveOrder({
      id,
      customerName: customerName.trim(),
      phone: customerPhone.trim(),
      address: fulfillment === 'delivery' ? customerAddress.trim() : `Pickup from ${PICKUP.address}`,
      pincode: pincode.trim(),
      fulfillment,
      slot: fulfillment === 'delivery' ? deliverySlot : 'Pickup',
      orderingDay: isoFromParts(ordering.orderingDay),
      fulfilmentDate: isoFromParts(ordering.fulfilmentDay),
      items,
      subtotalRupees: subtotal,
      deliveryFeeRupees: 0,
      discountRupees: discount,
      totalRupees: total,
      status: 'placed',
      assignedTo: null,
      placedAt: new Date().toISOString(),
      paymentMethod,
      paymentStatus: 'paid',
    });

    setLastOrderId(id);
    setModal('confirmation');
    setCart([]);
    setCouponPercent(0);
    setCouponMessage('');
  }

  const chosenCategoryLabel = (id: CategoryId) => {
    const item = CATEGORIES.find((entry) => entry.id === id);
    return !item ? '' : language === 'mr' ? item.mr : language === 'hi' ? item.hi : item.label;
  };

  function renderStore() {
    return (
      <>
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />{copy.eyebrow}</div>
            <h1>{copy.title.split('\n').map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</h1>
            <p className="hero-intro">{copy.intro}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#market">{copy.shop}<Icon name="arrowRight" size={18} /></a>
              <a className="text-link" href="#how-it-works">{copy.howLink}<span>↗</span></a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true"><span>क</span><span>म</span><span>अ</span></div>
              <p><strong>Kolhapur, meet your fishmonger.</strong><br /><span>A fresher way to plan tomorrow’s meal.</span></p>
            </div>
          </div>
          <div className="hero-art" role="img" aria-label="A fresh coastal seafood selection arranged on crushed ice">
            <div className="hero-art-image" />
            <div className="hero-stamp"><Icon name="leaf" size={17} /><span>FRESH FROM<br />THE COAST</span></div>
            <div className="hero-note"><span className="hero-note-kicker">YOUR TOMORROW, SORTED</span><strong>Catch today.<br />Cook tomorrow.</strong><span className="hero-note-foot"><Icon name="clock" size={14} /> Next-day, 5–9 PM</span></div>
            <div className="hero-decor" aria-hidden="true">K</div>
          </div>
          <div className="hero-caption"><span>01 / PRE-ORDER. THEN WE SOURCE.</span><span>KONKAN COAST · KOLHAPUR TABLE</span></div>
        </section>

        <div className={`window-banner ${windowOpen ? 'is-open' : ''}`}>
          <div className="window-icon"><Icon name={windowOpen ? 'check' : 'clock'} size={20} /></div>
          <div className="window-copy">
            <div className="window-title-row"><strong>{windowOpen ? copy.open : copy.closed}</strong><span className="live-pill">{windowOpen ? 'OPEN NOW' : 'CLOSED'}</span></div>
            <p>{windowOpen ? copy.openSub : copy.closedSub}</p>
            <div className="window-countdown" aria-live="polite">
              <span className="countdown-label">{windowOpen ? copy.closesIn : copy.opensIn}</span>
              <span className="countdown-value">{countdown.days}<small>{copy.days}</small>{String(countdown.hours).padStart(2, '0')}<small>{copy.hours}</small>{String(countdown.minutes).padStart(2, '0')}<small>{copy.mins}</small>{String(countdown.seconds).padStart(2, '0')}<small>{copy.secs}</small></span>
            </div>
            <span className="window-next"><Icon name="calendar" size={14} /> Next fulfilment: {fulfilmentDate} · delivery {DELIVERY.windowStart}–{DELIVERY.windowEnd} IST</span>
          </div>
          <div className="window-actions">
            <button className="button button-small button-outline" onClick={() => notify(copy.remindSaved)}>{copy.remind}<Icon name="bell" size={15} /></button>
          </div>
        </div>

        <section className="benefit-strip" aria-label="How KolFresh works">
          <div><span className="benefit-icon"><Icon name="calendar" size={19} /></span><p><strong>Order on our schedule</strong><small>{orderingDaysLabel()} · {orderingHoursLabel()} IST</small></p></div>
          <div><span className="benefit-icon"><Icon name="box" size={19} /></span><p><strong>Sourced after cutoff</strong><small>We buy to match your basket</small></p></div>
          <div><span className="benefit-icon"><Icon name="delivery" size={20} /></span><p><strong>Fresh, at your door</strong><small>Next day · {DELIVERY.windowStart}–{DELIVERY.windowEnd}</small></p></div>
          <div><span className="benefit-icon"><Icon name="knife" size={19} /></span><p><strong>Cut it your way</strong><small>Whole, cleaned or curry-cut</small></p></div>
        </section>

        <section className="market-section" id="market">
          <div className="section-heading">
            <div><span className="section-kicker"><Icon name="sparkles" size={15} /> THE KOLFRESH MARKET</span><h2>{copy.shopTitle}</h2><p>{copy.shopSub}</p></div>
            <div className="market-note"><span className="market-note-icon"><Icon name="pin" size={15} /></span><span><strong>For Kolhapur</strong><small>Today’s catch &amp; prices</small></span></div>
          </div>

          <div className="catalog-toolbar">
            <div className="category-tabs" role="tablist" aria-label="Seafood category filters">
              {CATEGORIES.map((item) => (
                <button key={item.id} className={`category-tab ${category === item.id ? 'selected' : ''}`} onClick={() => setCategory(item.id)} role="tab" aria-selected={category === item.id}>{chosenCategoryLabel(item.id)}</button>
              ))}
            </div>
            <label className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} aria-label="Search seafood" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={15} /></button>}</label>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onSelect={() => openProduct(product)} label={copy.add} />)}
            </div>
          ) : (
            <div className="empty-search"><Icon name="search" size={24} /><strong>No catch by that name yet.</strong><span>Try another search or browse all the catch.</span><button className="text-link" onClick={() => { setQuery(''); setCategory('all'); }}>Clear filters <Icon name="arrowRight" size={15} /></button></div>
          )}
          <p className="catalog-disclaimer"><Icon name="sparkles" size={14} /> Fresh catch, sourced to order. Availability is confirmed after each ordering window closes.</p>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-intro"><span className="section-kicker">A LITTLE DIFFERENT. A LOT FRESHER.</span><h2>Tomorrow’s dinner<br /><em>starts today.</em></h2><p>Not instant delivery. A thoughtful pre-order, matched to a real catch from the coast.</p><a className="text-link" href="#market">Build your basket <Icon name="arrowRight" size={16} /></a></div>
          <div className="steps-list">
            <Step number="01" icon="calendar" title="Choose during the window" body={`Browse whenever you like. Place an order ${orderingDaysLabel()}, ${orderingHoursLabel()} IST.`} />
            <Step number="02" icon="box" title="We source to your order" body="After the cut-off, our fishmonger buys against confirmed baskets, then cleans and packs." />
            <Step number="03" icon="delivery" title="Fresh catch, tomorrow" body={`Choose home delivery next day between ${DELIVERY.slotOne} or ${DELIVERY.slotTwo}, or select pickup.`} />
          </div>
        </section>

        <section className="promise-panel">
          <div className="promise-illustration"><div className="promise-ring"><Icon name="fish" size={46} /></div><span className="promise-leaf leaf-one"><Icon name="leaf" size={27} /></span><span className="promise-leaf leaf-two"><Icon name="sparkles" size={21} /></span></div>
          <div className="promise-copy"><span className="section-kicker">A MORE THOUGHTFUL FISH RUN</span><h2>Freshness you can<br /><em>plan around.</em></h2><p>One less trip to the market. A little more time for the people around your table. That’s the KolFresh way.</p><div className="promise-sign"><span className="sign-mark">K</span><span><strong>Local catch. Local care.</strong><small>Kolhapur, Maharashtra</small></span></div></div>
        </section>

        <section className="closing-cta"><span className="closing-mark"><Icon name="fish" size={28} /></span><div><span className="section-kicker">NEXT-DAY SEAFOOD, MADE SIMPLE</span><h2>Make tomorrow a<br /><em>little tastier.</em></h2></div><a className="button button-light" href="#market">Browse the market <Icon name="arrowRight" size={17} /></a></section>
      </>
    );
  }

  function renderOrders() {
    const basketItems = cart.length ? cart : [];
    return (
      <section className="orders-page">
        <button className="back-link" onClick={() => setPage('store')}><Icon name="back" size={17} /> Back to the market</button>
        <div className="orders-title"><span className="section-kicker">YOUR ORDERS</span><h1>Order status,<br /><em>without the guesswork.</em></h1><p>Track your order from the moment it’s placed to the moment it reaches your door.</p></div>
        <div className="sample-order-card">
          <div className="sample-order-head"><div><span className="live-pill">IN PROGRESS</span><h2>KolFresh order · #KF-1042</h2><p>Placed {orderingWeekday} · in the kitchen</p></div><span className="sample-status"><span /> Being sourced</span></div>
          <div className="sample-order-info"><div><Icon name="calendar" size={18} /><span><small>{copy.fulfilment}</small><strong>{fulfilmentDate}</strong></span></div><div><Icon name="delivery" size={19} /><span><small>DELIVERY WINDOW</small><strong>{DELIVERY.windowStart}–{DELIVERY.windowEnd} IST</strong></span></div><div><Icon name="pin" size={18} /><span><small>DELIVERY AREA</small><strong>Kolhapur · {pincode || '416001'}</strong></span></div></div>
          <section className="order-map-card" aria-labelledby="order-map-title">
            <div className="order-map-header">
              <div className="order-map-heading"><span className="order-map-kicker"><Icon name="map" size={14} />{copy.routePreview}</span><strong id="order-map-title">{copy.routeArea}</strong></div>
              <span className="order-map-badge"><span />{copy.plannedRoute}</span>
            </div>
            <div className="order-map-canvas" role="img" aria-label={`${copy.routePreview}: ${copy.routeOrigin} to ${copy.routeDestination} in ${copy.routeArea}`}>
              <svg className="order-map-art" viewBox="0 0 680 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <rect width="680" height="250" fill="#edf1e7" />
                <path d="M16 20h104v44H16zM145 18h77v38h-77zM267 14h87v48h-87zM412 17h108v41H412zM552 17h94v50h-94zM31 83h70v48H31zM140 78h96v40h-96zM278 83h65v40h-65zM382 74h85v49h-85zM506 91h130v40H506zM20 171h95v48H20zM151 169h85v46h-85zM281 177h95v43h-95zM422 166h73v56h-73zM536 174h112v43H536z" fill="#e7e5d8" />
                <path d="M492 13h145v57H492zM36 164h99v75H36z" fill="#dce9d8" />
                <g fill="none" stroke="#fffefa" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M-20 48 128 86 240 72 359 105 470 93 708 47" strokeWidth="17" />
                  <path d="M-20 154 111 125 218 145 345 115 470 143 710 113" strokeWidth="15" />
                  <path d="M72-24 106 67 92 143 123 274M248-24 264 73 247 155 276 275M398-24 372 69 395 146 370 274M550-28 522 72 550 153 528 275" strokeWidth="13" />
                  <path d="M-10 220 152 187 278 205 412 179 690 214" strokeWidth="10" />
                </g>
                <g fill="none" stroke="#d8ddd1" strokeLinecap="round" strokeWidth="1.5">
                  <path d="M-20 48 128 86 240 72 359 105 470 93 708 47M-20 154 111 125 218 145 345 115 470 143 710 113M72-24 106 67 92 143 123 274M248-24 264 73 247 155 276 275M398-24 372 69 395 146 370 274M550-28 522 72 550 153 528 275" />
                </g>
                <path d="M132 194C181 164 211 178 266 150S346 157 388 119 461 112 535 64" fill="none" stroke="#fffefa" strokeLinecap="round" strokeWidth="9" />
                <path d="M132 194C181 164 211 178 266 150S346 157 388 119 461 112 535 64" fill="none" stroke="#d47756" strokeDasharray="3 9" strokeLinecap="round" strokeWidth="4" />
                <g fill="#748176" fontFamily="DM Sans, sans-serif" fontSize="10" fontWeight="600" letterSpacing=".6">
                  <text x="178" y="105">SHAHUPURI</text><text x="362" y="195">TARABAI ROAD</text><text x="533" y="153">CITY PARK</text>
                </g>
              </svg>
              <div className="map-stop map-stop-origin"><span className="map-stop-icon"><Icon name="fish" size={15} /></span><span>{copy.routeOrigin}</span></div>
              <div className="map-stop map-stop-destination"><span className="map-stop-icon"><Icon name="home" size={15} /></span><span>{copy.routeDestination}</span></div>
            </div>
            <p className="order-map-note"><Icon name="clock" size={15} />{copy.routeNotice}</p>
          </section>
          <div className="tracking-list">
            {[['Placed', 'Basket received', true], ['Confirmed', 'Payment confirmed', true], ['Being sourced', 'Sourcing for tomorrow’s catch', true], ['Packed', 'Cleaned, packed & labelled', false], ['Out for delivery', 'On the way to you', false], ['Delivered', 'Enjoy your fresh catch', false]].map(([title, description, complete], index) => (
              <div className={`tracking-step ${complete ? 'complete' : ''} ${index === 2 ? 'current' : ''}`} key={title as string}><span className="tracking-dot">{complete && <Icon name="check" size={12} />}</span><div><strong>{title as string}</strong><small>{description as string}</small></div></div>
            ))}
          </div>
          {basketItems.length > 0 && <div className="sample-items"><strong>In your current basket</strong>{basketItems.map((item) => <span key={item.key}>{findProduct(item.productId)?.name} · {item.sizeLabel} × {item.quantity}</span>)}</div>}
          <div className="sample-order-note"><Icon name="shield" size={17} /><p>Live rider tracking and push notifications at each stage are coming soon. You’ll get an SMS/WhatsApp update as your order moves.</p></div>
        </div>
        <div className="orders-bottom"><button className="button button-primary" onClick={() => setPage('store')}>Back to today’s catch <Icon name="arrowRight" size={17} /></button></div>
      </section>
    );
  }

  return (
    <div className="app-shell" id="top">
      <div className="preview-ribbon"><Icon name="sparkles" size={14} /><span>Fresh from the coast, pre-ordered for next-day delivery</span><span className="ribbon-location"><Icon name="pin" size={13} /> {BUSINESS.city}</span></div>
      <header className="site-header">
        <Logo />
        <nav className="main-nav" aria-label="Main navigation">
          <button className={`nav-link ${page === 'store' ? 'active' : ''}`} onClick={() => { setPage('store'); setModal(null); }}>{copy.catch}</button>
          <a className="nav-link" href={page === 'store' ? '#how-it-works' : '#top'} onClick={() => setPage('store')}>{copy.how}</a>
          <button className={`nav-link ${page === 'orders' ? 'active' : ''}`} onClick={() => { setPage('orders'); setModal(null); }}>{copy.orders}</button>
        </nav>
        <div className="header-actions">
          <div className="language-switch" aria-label="Choose language">
            {(['en', 'mr', 'hi'] as const).map((code) => <button key={code} className={language === code ? 'active' : ''} onClick={() => setLanguage(code)} aria-pressed={language === code}>{code.toUpperCase()}</button>)}
          </div>
          <button className="cart-button" onClick={() => setModal('cart')} aria-label={`Open basket, ${itemCount} items`}><Icon name="bag" size={19} /><span className="cart-label">{copy.cart}</span><span className="cart-count">{itemCount}</span></button>
        </div>
      </header>

      <main className="page-main">{page === 'store' ? renderStore() : renderOrders()}</main>

      <footer className="site-footer">
        <div className="footer-main"><div className="footer-brand"><Logo /><p>Fresh seafood. A little more thoughtfully.<br />Made for the kitchens of Kolhapur.</p></div><div className="footer-column"><span className="footer-heading">THE KOLFRESH WAY</span><a href="#how-it-works">How it works</a><a href="#market">Browse the catch</a><button onClick={() => notify(`Call or WhatsApp us on ${BUSINESS.phone}.`)}>Need a hand?</button></div><div className="footer-column"><span className="footer-heading">GOOD TO KNOW</span><button onClick={() => notify('Full privacy policy and terms are available on request.')}>Privacy &amp; terms</button><button onClick={() => notify('Cancel for a full refund any time before the 6 PM ordering cut-off.')}>Refund policy</button><span>Freshness &amp; prep</span></div><div className="footer-trust"><span className="footer-seal"><Icon name="shield" size={21} /></span><div><strong>Local, with care.</strong><p>{BUSINESS.fssai}{BUSINESS.gstin ? ` · ${BUSINESS.gstin}` : ''}</p><small>{BUSINESS.city}</small></div></div></div>
        <div className="footer-bottom"><span>© KolFresh · {BUSINESS.city}</span><span>Next-day delivery, {DELIVERY.windowStart}–{DELIVERY.windowEnd} IST</span><a href="#top">Back to top ↑</a></div>
      </footer>

      {modal === 'product' && selectedProduct && <ProductModal product={selectedProduct} language={language} onClose={() => setModal(null)} onAdd={addItem} />}
      {modal === 'cart' && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-head"><div><span className="section-kicker">KOLFRESH MARKET</span><h2 id="cart-title">{copy.cart}<span className="drawer-count">{itemCount}</span></h2></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Close basket"><Icon name="close" size={20} /></button></div>
        {!cart.length ? <div className="cart-empty"><span className="empty-bag"><Icon name="bag" size={30} /></span><h3>Your basket is taking a breather.</h3><p>Browse the catch and add something fresh for tomorrow.</p><button className="button button-primary" onClick={() => { setModal(null); document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' }); }}>Browse the catch <Icon name="arrowRight" size={16} /></button></div> : <>
          <div className="drawer-window-note"><Icon name="clock" size={17} /><span><strong>{windowOpen ? 'Ordering is open' : 'Ordering is closed'}</strong><small>{windowOpen ? 'Checkout is available now.' : 'Save your basket — checkout opens in the next ordering window.'}</small></span></div>
          <div className="cart-items">{cart.map((item) => {
            const product = findProduct(item.productId);
            if (!product) return null;
            return <div className="cart-item" key={item.key}><img src={product.image} alt="" /><div className="cart-item-info"><strong>{product.name}</strong><small>{item.sizeLabel} · {item.cutLabel}</small><span className="cart-item-price">{formatINR(item.unitAmount * item.quantity)}</span><div className="quantity-control"><button onClick={() => updateQuantity(item.key, item.quantity - 1)} aria-label="Reduce quantity"><Icon name="minus" size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity"><Icon name="plus" size={14} /></button></div></div><button className="remove-item" onClick={() => updateQuantity(item.key, 0)} aria-label={`Remove ${product.name}`}><Icon name="close" size={16} /></button></div>;
          })}</div>
          <form className="coupon-form" onSubmit={applyCoupon}><Icon name="discount" size={17} /><input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Coupon code" aria-label="Coupon code" /><button type="submit">Apply</button></form>{couponMessage && <p className={`coupon-message ${couponPercent ? 'success' : ''}`}>{couponMessage}</p>}
          <div className="cart-summary"><div><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div>{discount > 0 && <div className="discount-row"><span>Coupon discount</span><strong>−{formatINR(discount)}</strong></div>}<div className="summary-delivery"><span>{copy.deliveryOn}</span><strong>{fulfilmentDate} · {DELIVERY.windowStart}–{DELIVERY.windowEnd}</strong></div><div className="summary-total"><span>Estimated total</span><strong>{formatINR(total)}</strong></div><p>Final total confirmed at checkout.</p></div>
          <button className="button button-primary checkout-button" onClick={startCheckout} disabled={!windowOpen}>{windowOpen ? copy.checkout : 'Ordering is closed'}<Icon name="arrowRight" size={17} /></button>
          {!windowOpen && <p className="checkout-hint">Checkout opens in the next ordering window ({orderingDaysLabel()}, {orderingHoursLabel()} IST).</p>}
        </>}
      </aside></div>}
      {modal === 'checkout' && <div className="overlay checkout-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <div className="checkout-top"><button className="back-link" onClick={() => setModal('cart')}><Icon name="back" size={16} /> Basket</button><button className="icon-button" onClick={() => setModal(null)} aria-label="Close checkout"><Icon name="close" size={20} /></button></div>
        <div className="checkout-heading"><span className="section-kicker">SECURE CHECKOUT</span><h2 id="checkout-title">Make tomorrow <em>yours.</em></h2><p>Pay now to lock in your basket — we source, clean and pack it after the cut-off.</p></div>
        <div className="checkout-layout"><div className="checkout-form">
          <section className="checkout-step"><div className="checkout-step-title"><span>01</span><div><strong>How would you like it?</strong><small>{copy.deliveryOn}: {fulfilmentDate}</small></div></div><div className="fulfillment-choice"><button className={fulfillment === 'delivery' ? 'selected' : ''} onClick={() => setFulfillment('delivery')}><Icon name="delivery" size={19} /><span><strong>Home delivery</strong><small>{fulfilmentDate} · {DELIVERY.windowStart}–{DELIVERY.windowEnd} IST</small></span><i /></button><button className={fulfillment === 'pickup' ? 'selected' : ''} onClick={() => setFulfillment('pickup')}><Icon name="pickup" size={19} /><span><strong>Pickup</strong><small>Kolhapur · {PICKUP.hours}</small></span><i /></button></div>
            {fulfillment === 'delivery' ? <><div className="slot-title"><Icon name="clock" size={16} /> Choose a delivery window <span>IST</span></div><div className="slot-choices"><button className={deliverySlot === DELIVERY.slotOne ? 'selected' : ''} onClick={() => setDeliverySlot(DELIVERY.slotOne)}><span>{DELIVERY.slotOne}</span><small>Evening slot</small></button><button className={deliverySlot === DELIVERY.slotTwo ? 'selected' : ''} onClick={() => setDeliverySlot(DELIVERY.slotTwo)}><span>{DELIVERY.slotTwo}</span><small>Evening slot</small></button></div><label className="field-label">Kolhapur PIN code <span>Serviceability check</span><div className="pincode-field"><Icon name="pin" size={17} /><input value={pincode} onChange={(event) => { setPincode(event.target.value.replace(/\\D/g, '')); setPincodeChecked(false); }} maxLength={6} inputMode="numeric" aria-label="PIN code" /><button onClick={() => setPincodeChecked(SERVICEABLE_PINCODES.includes(pincode.trim()))} type="button">Check area</button></div></label>{pincodeChecked && SERVICEABLE_PINCODES.includes(pincode.trim()) && <p className="pin-success"><Icon name="check" size={14} /> Great news — we deliver to {pincode.trim()}.</p>}{!pincodeChecked && pincode.length === 6 && <p className="pin-error">Sorry, we don’t deliver to {pincode} yet. Try another Kolhapur PIN.</p>}</> : <div className="pickup-note"><Icon name="pin" size={17} /><span><strong>Pickup point</strong><small>{PICKUP.address} · {PICKUP.hours}</small></span></div>}
          </section>
          <section className="checkout-step"><div className="checkout-step-title"><span>02</span><div><strong>Your details</strong><small>So we know who to call</small></div></div><div className="contact-fields"><label className="field-label">Full name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="e.g. Rahul Patil" autoComplete="name" /></label><label className="field-label">Phone number<input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value.replace(/[^0-9+ ]/g, ''))} placeholder="+91 98220 11223" maxLength={16} inputMode="tel" autoComplete="tel" /></label>{fulfillment === 'delivery' && <label className="field-label">Delivery address<input value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} placeholder="Flat / house, street, area" autoComplete="street-address" /></label>}</div></section>
          <section className="checkout-step payment-step"><div className="checkout-step-title"><span>03</span><div><strong>Payment</strong><small>UPI or card · secured by our gateway</small></div></div><div className="payment-options"><button className={paymentMethod === 'upi' ? 'selected' : ''} onClick={() => setPaymentMethod('upi')}><span className="payment-mark upi-mark">UPI</span><span><strong>UPI</strong><small>GPay, PhonePe, Paytm</small></span><i /></button><button className={paymentMethod === 'card' ? 'selected' : ''} onClick={() => setPaymentMethod('card')}><span className="payment-mark card-mark">▭</span><span><strong>Debit / credit card</strong><small>Visa, Mastercard, RuPay</small></span><i /></button></div><p className="payment-disclaimer"><Icon name="shield" size={15} /> Your card details are never stored — they’re handled securely by our payment gateway.</p></section>
        </div><aside className="checkout-summary"><span className="section-kicker">YOUR ORDER</span><h3>{copy.tomorrow}</h3><div className="checkout-date"><Icon name="calendar" size={16} /><span><small>{copy.fulfilment}</small><strong>{fulfilmentDate}</strong></span></div><div className="checkout-items">{cart.map((item) => <div key={item.key}><span>{findProduct(item.productId)?.name} × {item.quantity}<small>{item.sizeLabel} · {item.cutLabel}</small></span><strong>{formatINR(item.unitAmount * item.quantity)}</strong></div>)}</div><div className="checkout-total"><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div>{discount > 0 && <div className="checkout-total discount-row"><span>Coupon discount</span><strong>−{formatINR(discount)}</strong></div>}<div className="checkout-grand"><span>Total to pay</span><strong>{formatINR(total)}</strong></div><p className="checkout-terms">You can cancel for a full refund any time before the 6:00 PM ordering cut-off.</p><button className="button button-primary place-order-button" onClick={placeOrder} disabled={!cart.length || (fulfillment === 'delivery' && !SERVICEABLE_PINCODES.includes(pincode.trim()))}>{fulfillment === 'delivery' ? `Pay ${formatINR(total)} & place order` : 'Reserve for pickup'}<Icon name="arrowRight" size={17} /></button><button className="text-link edit-basket" onClick={() => setModal('cart')}><Icon name="back" size={15} /> Edit basket</button></aside></div>
      </section></div>}
      {modal === 'confirmation' && <div className="overlay confirmation-overlay"><section className="confirmation-card" role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><span className="confirmation-icon"><Icon name="check" size={35} /></span><span className="section-kicker">ORDER PLACED</span><h2 id="confirmation-title">That’s tomorrow<br /><em>sorted.</em></h2><p>Thanks! Your basket is locked in. We’ll source, clean and pack it right after the cut-off, then {fulfillment === 'delivery' ? 'deliver it' : 'have it ready for pickup'} on {fulfilmentDate}.</p><div className="confirmation-detail"><span><Icon name="calendar" size={17} /><span><small>{fulfillment === 'delivery' ? copy.deliveryOn.toUpperCase() : 'PICKUP'}</small><strong>{fulfilmentDate} · {fulfillment === 'delivery' ? deliverySlot : PICKUP.hours}</strong></span></span><span><Icon name="box" size={17} /><span><small>ORDER NUMBER</small><strong>#{lastOrderId}</strong></span></span></div><button className="button button-primary" onClick={() => { setModal(null); setPage('orders'); }}>Track your order <Icon name="arrowRight" size={17} /></button><button className="text-link confirmation-back" onClick={() => { setModal(null); setPage('store'); }}>Back to the market</button></section></div>}
      {toast && <div className="toast-message" role="status"><Icon name="sparkles" size={17} />{toast}</div>}
    </div>
  );
}

function ProductCard({ product, onSelect, label }: { product: Product; onSelect: () => void; label: string }) {
  return (
    <article className="product-card">
      <button className="product-image-button" onClick={onSelect} aria-label={`View ${product.name}`}>
        <img className="product-image" src={product.image} alt={product.alt} loading="lazy" />
        <span className="product-origin"><Icon name="pin" size={12} /> {product.origin}</span>
        {product.tag && <span className={`product-tag ${product.tagTone ?? 'green'}`}>{product.tag}</span>}
        <span className="image-expand"><Icon name="arrowRight" size={16} /></span>
      </button>
      <div className="product-info"><div className="product-title-row"><div><h3>{product.name}</h3><p>{product.localName}</p></div><span className="product-rating"><Icon name="star" size={13} /> 4.9</span></div>
        <div className="product-bottom"><div className="price-line"><strong>{formatINR(product.unitPrice)}</strong><span>/ {product.unitLabel}</span><small>{product.priceLabel}</small></div><button className="add-product" onClick={onSelect} aria-label={`${label}: ${product.name}`}><Icon name="plus" size={18} /></button></div>
      </div>
    </article>
  );
}

function ProductModal({ product, language, onClose, onAdd }: { product: Product; language: Language; onClose: () => void; onAdd: (product: Product, sizeLabel: string, multiplier: number, cut: CutOption, quantity: number) => void }) {
  const [selectedSize, setSelectedSize] = useState(product.sizeOptions[Math.min(1, product.sizeOptions.length - 1)]);
  const [selectedCut, setSelectedCut] = useState(product.cutOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const price = itemAmount(product, selectedSize.multiplier, selectedCut.surcharge);
  const cutLabel = language === 'mr' ? selectedCut.mr : language === 'hi' ? selectedCut.hi : selectedCut.label;

  return <div className="overlay product-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="modal-close icon-button" onClick={onClose} aria-label="Close product details"><Icon name="close" size={20} /></button><div className="product-modal-image"><img src={product.image} alt={product.alt} /><span className="modal-origin"><Icon name="pin" size={14} /> {product.origin}</span></div><div className="product-modal-content"><span className="section-kicker"><Icon name="sparkles" size={14} /> FRESH, FROM THE COAST</span><h2 id="product-modal-title">{product.name}</h2><p className="product-modal-local">{product.localName}</p><p className="product-modal-description">{product.notes}</p><div className="modal-price"><strong>{formatINR(product.unitPrice)}</strong><span>/ {product.unitLabel} · {product.priceLabel}</span></div>
      <div className="selector-group"><div className="selector-heading"><strong>Choose your size</strong><small>{product.unitLabel === 'kg' ? 'Weight is pre-cleaning' : 'Individually packed'}</small></div><div className="size-options">{product.sizeOptions.map((option) => <button key={option.label} className={selectedSize.label === option.label ? 'selected' : ''} onClick={() => setSelectedSize(option)}>{option.label}</button>)}</div></div>
      <div className="selector-group"><div className="selector-heading"><strong>{product.unitLabel === 'pack' ? 'Pack style' : 'How should we prep it?'}</strong><small>{cutLabel} · current choice</small></div><div className="cut-options">{product.cutOptions.map((cut) => <button key={cut.id} className={selectedCut.id === cut.id ? 'selected' : ''} onClick={() => setSelectedCut(cut)}><span>{language === 'mr' ? cut.mr : language === 'hi' ? cut.hi : cut.label}</span>{cut.surcharge > 0 && <small>+{formatINR(cut.surcharge)} / {product.unitLabel}</small>}</button>)}</div></div>
      <div className="modal-add-row"><div className="quantity-control modal-quantity"><button onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Reduce quantity"><Icon name="minus" size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity((current) => current + 1)} aria-label="Increase quantity"><Icon name="plus" size={14} /></button></div><button className="button button-primary modal-add" onClick={() => onAdd(product, selectedSize.label, selectedSize.multiplier, selectedCut, quantity)}><span>Add to basket</span><strong>{formatINR(price * quantity)}</strong></button></div><p className="weight-disclaimer"><Icon name="shield" size={14} /> Weight is shown before cleaning. Final cleaned weight can vary slightly by catch.</p>
    </div></section></div>;
}

function Step({ number, icon, title, body }: { number: string; icon: IconName; title: string; body: string }) {
  return <article className="step-item"><div className="step-number">{number}</div><span className="step-icon"><Icon name={icon} size={19} /></span><div className="step-copy"><h3>{title}</h3><p>{body}</p></div><Icon name="arrowRight" size={17} className="step-arrow" /></article>;
}

export default App;
