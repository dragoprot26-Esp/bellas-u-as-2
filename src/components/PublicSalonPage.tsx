import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Share2, 
  Calendar, 
  Instagram, 
  Globe, 
  Sparkles, 
  Star, 
  Check, 
  Copy, 
  Compass, 
  ChevronRight,
  Bookmark,
  Heart,
  QrCode
} from 'lucide-react';
import { Salon, Service, ProductItem, ProductOrder } from '../types';
import { bellAgregarPedido } from '../cloud';
import { motion, AnimatePresence } from 'motion/react';

interface PublicSalonPageProps {
  salon: Salon;
  onOpenBooking: (preSelected: Service | null) => void;
  onNavigateToAdmin: () => void;
  onUpdateSalon?: (updatedSalon: Salon) => void;
}

export default function PublicSalonPage({ 
  salon, 
  onOpenBooking, 
  onNavigateToAdmin,
  onUpdateSalon
}: PublicSalonPageProps) {
  const [activeCategory, setActiveCategory] = useState<'Nuevos' | 'Elegidos' | 'Galería' | 'Productos' | 'Promos' | 'Ofertas' | 'Servicios'>('Nuevos');
  const [showMap, setShowMap] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});

  // Carterita Cart State Variables
  const [cart, setCart] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('+54 9 ');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeOrderCreated, setActiveOrderCreated] = useState<ProductOrder | null>(null);

  // Cart Handlers
  const handleAddToCart = (product: ProductItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, amount: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is { product: ProductItem; quantity: number } => item !== null);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutPhone.trim()) {
      alert('Por favor, ingresá tu nombre y teléfono para procesar el pedido.');
      return;
    }

    // Generate unique pickup code e.g. #RT-3924
    const code = '#RT-' + Math.floor(1000 + Math.random() * 9000);
    const totalCartPrice = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);

    const newOrder: ProductOrder = {
      id: `order-${Date.now()}`,
      salonId: salon.id,
      clientName: checkoutName.trim(),
      clientPhone: checkoutPhone.trim(),
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      totalPrice: totalCartPrice,
      pickupCode: code,
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    };

    if (salon.id) { bellAgregarPedido(salon.id, newOrder); }

    setActiveOrderCreated(newOrder);
    setIsCheckingOut(false);
  };

  const handleClearOrderSuccess = () => {
    setCart([]);
    setActiveOrderCreated(null);
    setShowCartModal(false);
    setCheckoutName('');
    setCheckoutPhone('');
  };

  const isImageUrl = (img: string) => img && (img.startsWith('http') || img.startsWith('data:'));

  // Categories dictionary translating state values to original names in Spanish
  const categoryNames: Record<string, string> = {
    'Nuevos': '🌸 Nuevos modelos',
    'Elegidos': '⭐ Los más elegidos',
    'Galería': '🖼️ Galería',
    'Productos': '🧴 Productos',
    'Promos': '🎁 Promos',
    'Ofertas': '🏷️ Ofertas',
    'Servicios': '💅 Servicios',
  };

  // Filter salon services based on category state, defaulting undefined/falsy category to 'Servicios'
  const filteredServices = salon.services.filter(s => {
    const sCat = s.category || 'Servicios';
    return sCat === activeCategory;
  });

  // Copy link simulation
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleLike = (id: string) => {
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeFont = salon.fontFamily || 'font-sans';
  const preset = salon.designPreset || 'boutique-rosa';
  const interfaceStyle = salon.interfaceStyle || 'sleek';
  const isMinimal = interfaceStyle === 'minimalism';

  // Helper to render preset-based upper decoration
  const renderUpperDecoration = () => {
    switch (preset) {
      case 'spa-dorado':
        return (
          <div className="max-w-2xl mx-auto px-4 pt-3 flex justify-end space-x-1.5 text-xs font-bold text-amber-600/80 tracking-widest uppercase">
            <span>✨ SUCURSAL PREMIUM ✨</span>
          </div>
        );
      case 'floral-neon':
        return (
          <div className="max-w-2xl mx-auto px-4 pt-3 flex justify-end space-x-1 text-sm animate-pulse">
            <span>🌺</span>
            <span className="text-pink-500 font-extrabold text-xs">NEÓN LIVE</span>
            <span>⚡</span>
          </div>
        );
      case 'boutique-rosa':
      default:
        return (
          <div className="max-w-2xl mx-auto px-4 pt-3 flex justify-end space-x-1 text-sm">
            <span>🌸</span>
            <span>🌺</span>
            <span>🌸</span>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen ${isMinimal ? 'bg-neutral-50' : salon.colorTheme.bgMain} pb-24 ${activeFont} antialiased text-gray-800 transition-all duration-300`}>
      {/* 1. Header Bar */}
      <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between ${
        isMinimal ? 'border-b border-neutral-200/60 shadow-none' : 'border-b border-gray-100 shadow-sm'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 ${isMinimal ? 'rounded-none bg-neutral-900' : `rounded-full ${salon.colorTheme.primary} shadow-sm`} flex items-center justify-center text-lg text-white`}>
            {salon.logo}
          </div>
          <span className={`tracking-tight text-gray-900 ${isMinimal ? 'font-light uppercase tracking-widest text-sm' : 'font-extrabold text-base'}`}>{salon.name}</span>
        </div>
        
        <button
          id="btn-mi-panel"
          onClick={onNavigateToAdmin}
          className={`flex items-center space-x-1 px-3.5 py-1.5 cursor-pointer transition-all ${
            isMinimal 
              ? 'bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] font-bold tracking-widest uppercase rounded-none'
              : `rounded-full bg-slate-50 ${salon.colorTheme.textAccent} hover:bg-slate-100 text-xs font-bold border ${salon.colorTheme.borderColor || 'border-gray-100'} shadow-sm`
          }`}
        >
          <span>📋 Mi panel</span>
        </button>
      </header>

      {/* Decorative preset indicators from original image top corner */}
      {!isMinimal && renderUpperDecoration()}

      <main className="max-w-2xl mx-auto px-4 mt-1 space-y-6">
        
        {/* 2. Salon Main Brand Card */}
        <div className={`relative bg-white mt-12 text-center overflow-hidden transition-all ${
          isMinimal 
            ? 'rounded-none border border-neutral-200/60 p-8 pt-16 shadow-none' 
            : `rounded-3xl p-6 pt-14 shadow-xl border ${salon.colorTheme.borderColor || 'border-gray-100'}`
        }`}>
          {salon.coverImage ? (
            <div className="absolute top-0 left-0 w-full h-28 overflow-hidden">
              <img 
                src={salon.coverImage} 
                alt={salon.name} 
                className="w-full h-full object-cover filter brightness-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          ) : (
            <>
              {!isMinimal && preset === 'floral-neon' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-400" />
              )}
              {!isMinimal && preset === 'spa-dorado' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500" />
              )}
            </>
          )}
          {/* Centered Avatar floating half-above */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${salon.coverImage ? 'top-28 -translate-y-1/2' : 'top-0 -translate-y-1/2'} z-10`}>
            <div className={`w-24 h-24 ${
              isMinimal 
                ? 'rounded-none bg-neutral-900 text-white border-2 border-neutral-100' 
                : `rounded-full ${salon.colorTheme.primary} border-4 border-white shadow-md transform hover:rotate-12 transition-transform duration-300`
            } flex items-center justify-center text-4xl`}>
              {salon.logo === '🌸' ? '💅' : salon.logo}
            </div>
          </div>

          <div className={`pt-12 ${isMinimal ? 'space-y-6' : 'space-y-4'} ${salon.coverImage ? 'mt-8' : ''}`}>
            <div>
              {/* Sursive Elegant Font feel for main title */}
              <h1 className={`tracking-tight ${
                isMinimal 
                  ? 'text-3xl font-light uppercase tracking-widest text-neutral-900' 
                  : `text-4xl font-extrabold ${salon.colorTheme.textAccent} drop-shadow-sm`
              }`}>
                {salon.name}
              </h1>
              <p className={`mt-1 ${
                isMinimal 
                  ? 'text-[10px] uppercase tracking-widest text-neutral-400 font-mono' 
                  : 'text-sm italic text-gray-500 font-medium'
              }`}>
                {salon.slogan}
              </p>
            </div>

            {/* Address & Phone indicators */}
            <div className={`flex flex-col items-center space-y-2 text-xs font-medium ${
              isMinimal 
                ? 'bg-neutral-50/50 p-4 border border-neutral-100 text-neutral-500' 
                : 'bg-gray-50 p-3 rounded-2xl text-gray-500'
            }`}>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(salon.address)}`}
                target="_blank" 
                rel="noreferrer"
                className={`flex items-center transition-colors ${isMinimal ? 'hover:text-black' : 'hover:text-pink-600'}`}
              >
                <MapPin className={`w-4 h-4 mr-1.5 shrink-0 ${isMinimal ? 'text-neutral-400' : 'text-pink-500'}`} />
                <span>{salon.address}</span>
              </a>
              <a 
                href={`tel:${salon.phone}`}
                className={`flex items-center transition-colors ${isMinimal ? 'hover:text-black' : 'hover:text-pink-600'}`}
              >
                <Phone className={`w-4 h-4 mr-1.5 shrink-0 ${isMinimal ? 'text-neutral-400' : 'text-pink-500'}`} />
                <span>{salon.phone}</span>
              </a>
            </div>

            {/* Quick action buttons exactly like the image (Reservar turno, Cómo llegar, Compartir) */}
            <div className="grid grid-cols-3 gap-2 pt-1.5">
              <button
                id="cta-reservar"
                onClick={() => onOpenBooking(null)}
                className={`py-3 px-1 transition-all transform active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  isMinimal 
                    ? 'bg-neutral-900 hover:bg-neutral-800 text-white font-bold tracking-widest uppercase text-[10px] rounded-none' 
                    : `rounded-2xl ${salon.colorTheme.primary} ${salon.colorTheme.primaryHover} text-white font-extrabold text-xs shadow-md`
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Reservar turno</span>
              </button>

              <button
                id="cta-como-llegar"
                onClick={() => setShowMap(!showMap)}
                className={`py-3 px-1 transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  isMinimal 
                    ? 'bg-white border border-neutral-200 text-neutral-700 font-bold tracking-widest uppercase text-[10px] rounded-none' 
                    : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold text-xs rounded-2xl shadow-sm'
                }`}
              >
                <MapPin className={`w-4 h-4 ${isMinimal ? 'text-neutral-400' : 'text-red-500'}`} />
                <span>Cómo llegar</span>
              </button>

              <button
                id="cta-compartir"
                onClick={() => setShowShare(true)}
                className={`py-3 px-1 transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  isMinimal 
                    ? 'bg-white border border-neutral-200 text-neutral-700 font-bold tracking-widest uppercase text-[10px] rounded-none' 
                    : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold text-xs rounded-2xl shadow-sm'
                }`}
              >
                <Share2 className={`w-4 h-4 ${isMinimal ? 'text-neutral-400' : 'text-blue-500'}`} />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Interactive simulated map expander */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cómo llegar al salón</span>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">● Abierto ahora</span>
                </div>
                {/* Visual Map Representation */}
                <div className="relative h-44 bg-blue-50 rounded-2xl overflow-hidden border border-gray-200 flex flex-col justify-end p-3">
                  {/* Styled simulated map layout */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100 opacity-90" />
                  <div className="absolute top-1/3 left-1/4 w-1/2 h-1 bg-gray-300 transform rotate-12" />
                  <div className="absolute top-1/2 left-1/2 w-1 h-20 bg-gray-300 transform -translate-x-1/2" />
                  <div className="absolute top-10 left-10 w-20 h-10 bg-emerald-200 opacity-60 rounded-xl" />
                  
                  {/* Current Pin */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-bounce">
                    <MapPin className="w-8 h-8 text-rose-600 drop-shadow-md mx-auto" />
                    <div className="bg-black/80 text-white text-[9px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap mt-0.5">
                      {salon.name}
                    </div>
                  </div>

                  <div className="relative z-10 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs shadow-sm">
                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900">Distancia aproximada</div>
                      <div className="text-gray-500 font-medium">A 1.8 km de tu ubicación (8 min en auto)</div>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salon.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
                    >
                      <Compass className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Horizontal Scroll Categories - Exactly matching the image navigation style */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={isMinimal ? "text-[10px] font-bold text-neutral-400 uppercase tracking-widest" : "text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"}>
              {isMinimal ? '📁 CATEGORÍAS' : '🌷 Categorías'}
            </span>
            <span className="text-xs text-gray-400">Deslizá para ver más</span>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            {(Object.keys(categoryNames) as Array<keyof typeof categoryNames>).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none transition-all snap-start cursor-pointer ${
                  isMinimal
                    ? `px-3 py-2 text-[10px] font-bold tracking-widest uppercase rounded-none ${
                        activeCategory === cat
                          ? 'border-b-2 border-black text-black'
                          : 'text-neutral-400 hover:text-black hover:border-b border-neutral-300'
                      }`
                    : `px-4 py-2.5 rounded-full text-xs font-bold ${
                        activeCategory === cat
                          ? `${salon.colorTheme.primary} text-white shadow-md transform scale-105`
                          : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                      }`
                }`}
              >
                {categoryNames[cat]}
              </button>
            ))}
            {/* Added simulated future block to complete the image categories */}
            <div className={isMinimal ? "flex-none px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-neutral-300 border-b border-dashed border-neutral-200 cursor-not-allowed" : "flex-none px-4 py-2.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400 border border-dashed border-gray-200 cursor-not-allowed"}>
              ⏳ Muy pronto
            </div>
          </div>
        </div>

        {/* 5. Active Category Headline */}
        <div className="pt-2">
          <div className="flex items-center space-x-1.5">
            {!isMinimal && <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />}
            <h2 className={isMinimal ? "text-lg font-light tracking-widest text-neutral-900 uppercase border-b border-neutral-200/60 pb-2 w-full" : `text-2xl font-extrabold ${salon.colorTheme.textAccent} capitalize`}>
              {categoryNames[activeCategory]}
            </h2>
          </div>
        </div>

        {/* 6. Active Category Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="wait">
            {['Promos', 'Productos', 'Ofertas'].includes(activeCategory) ? (
              (() => {
                const getProductsToRender = () => {
                  if (activeCategory === 'Promos') return salon.products?.filter(p => p.category === 'Promo') || [];
                  if (activeCategory === 'Productos') return salon.products?.filter(p => p.category === 'Productos') || [];
                  return salon.products?.filter(p => p.category === 'Lo más vistos' || p.category === 'Destacados') || [];
                };
                const productsToRender = getProductsToRender();
                if (productsToRender.length === 0) {
                  return (
                    <div className="col-span-full py-16 text-center text-gray-400 space-y-2">
                      <span className="text-4xl block">🛍️</span>
                      <p className="text-sm font-bold">¡Próximamente más productos en esta sección!</p>
                      <p className="text-xs text-gray-500">Estamos preparando las mejores novedades para vos.</p>
                    </div>
                  );
                }
                return productsToRender.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`overflow-hidden transition-all flex flex-col justify-between group ${
                      isMinimal
                        ? 'bg-white rounded-none border border-neutral-200 shadow-none hover:border-neutral-400'
                        : 'bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {/* Product Image Banner */}
                    <div className="h-44 bg-slate-100 relative overflow-hidden shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      {product.category === 'Promo' && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md z-10">
                          🔥 COMBO PROMO
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-bold transition-colors ${
                            isMinimal 
                              ? 'text-sm tracking-wider uppercase text-neutral-900' 
                              : `text-base text-gray-900 group-hover:${salon.colorTheme.textAccent}`
                          }`}>
                            {product.name}
                          </h4>
                        </div>
                        <p className={`text-xs leading-relaxed ${isMinimal ? 'text-neutral-400 font-light' : 'text-gray-500 font-medium'}`}>
                          {product.description}
                        </p>

                        {/* Components list (compos) if any */}
                        {product.components && product.components.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {product.components.map((comp, cIdx) => (
                              <span 
                                key={cIdx} 
                                className="text-[8.5px] font-black uppercase tracking-wider bg-pink-50 text-pink-600 px-2 py-0.5 rounded-md border border-pink-100"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pricing and (+) Button */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Inversión
                          </span>
                          <span className={`text-lg font-black ${salon.colorTheme.textAccent}`}>
                            ${product.price.toLocaleString('es-AR')}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`py-2.5 px-4 transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5 ${
                            isMinimal 
                              ? 'bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold tracking-widest uppercase rounded-none' 
                              : `rounded-xl ${salon.colorTheme.primary} ${salon.colorTheme.primaryHover} text-white text-xs font-black shadow-md`
                          }`}
                        >
                          <span>Agregar</span>
                          <span className="font-extrabold text-sm">+</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ));
              })()
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: index * 0.05 }}
                  className={`overflow-hidden transition-all flex flex-col justify-between group ${
                    isMinimal
                      ? 'bg-white rounded-none border border-neutral-200/60 shadow-none hover:border-neutral-400'
                      : 'bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isMinimal ? (
                    /* Minimal Style Service Header */
                    <div className="p-5 pb-2 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                      <div className="flex items-center space-x-2">
                        {isImageUrl(service.image) ? (
                          <img src={service.image} alt={service.name} className="w-8 h-8 rounded-md object-cover border border-neutral-200" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-2xl">{service.image}</span>
                        )}
                        {service.isNew && (
                          <span className="text-[8px] font-bold tracking-widest bg-black text-white px-2 py-0.5 uppercase">NUEVO</span>
                        )}
                      </div>
                      <button 
                        onClick={() => toggleLike(service.id)}
                        className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedItems[service.id] ? 'fill-black text-black' : ''}`} />
                      </button>
                    </div>
                  ) : (
                    /* Service Graphic Banner (Sleek Style) */
                    <div className="h-36 bg-gradient-to-tr from-pink-100 to-amber-100 relative p-4 flex flex-col justify-between overflow-hidden">
                      {isImageUrl(service.image) ? (
                        <div className="absolute inset-0">
                          <img src={service.image} alt={service.name} className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>
                      ) : (
                        <>
                          {/* Visual pattern background */}
                          <div className="absolute inset-0 bg-[radial-gradient(#e08297_1px,transparent_1px)] [background-size:12px_12px] opacity-15" />
                        </>
                      )}
                      
                      <div className="flex justify-between items-start relative z-10">
                        {service.isNew ? (
                          <span className="text-[10px] font-extrabold bg-pink-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                            ✨ NUEVO
                          </span>
                        ) : (
                          <div />
                        )}
                        
                        <button 
                          onClick={() => toggleLike(service.id)}
                          className="p-1.5 bg-white/80 hover:bg-white text-pink-500 rounded-full backdrop-blur-sm transition-all active:scale-90 shadow-sm"
                        >
                          <Heart className={`w-4 h-4 ${likedItems[service.id] ? 'fill-pink-500' : ''}`} />
                        </button>
                      </div>

                      {!isImageUrl(service.image) && (
                        /* Centered Large representation emoji floating */
                        <div className="text-5xl mx-auto drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                          {service.image}
                        </div>
                      )}

                      <div className="text-[10px] font-bold text-gray-500 bg-white/70 backdrop-blur-sm py-1 px-2.5 rounded-lg w-max shadow-sm relative z-10 flex items-center">
                        ⏱️ {service.durationMinutes > 0 ? `${service.durationMinutes} min` : 'Venta directa'}
                      </div>
                    </div>
                  )}

                  {/* Service Metadata details */}
                  <div className={`p-5 flex-1 flex flex-col justify-between ${isMinimal ? 'space-y-2' : 'space-y-3.5'}`}>
                    <div>
                      <h4 className={`font-bold transition-colors ${
                        isMinimal 
                          ? 'text-sm tracking-wider uppercase text-neutral-900 group-hover:text-black' 
                          : `text-base text-gray-900 group-hover:${salon.colorTheme.textAccent}`
                      }`}>
                        {service.name}
                      </h4>
                      <p className={`text-xs leading-relaxed mt-1 line-clamp-2 ${isMinimal ? 'text-neutral-400 font-light' : 'text-gray-500 font-medium'}`}>
                        {service.description}
                      </p>
                      {service.durationMinutes > 0 && isMinimal && (
                        <span className="text-[9px] font-mono text-neutral-400 block mt-2 tracking-widest uppercase">⏱️ DURACIÓN: {service.durationMinutes} MIN</span>
                      )}

                      {/* Extra custom dynamic fields/bullets (+ campos) */}
                      {service.components && service.components.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {service.components.map((comp, cIdx) => (
                            <span 
                              key={cIdx} 
                              className="text-[8.5px] font-black uppercase tracking-wider bg-pink-50 text-pink-600 px-2 py-0.5 rounded-md border border-pink-100"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center justify-between border-t pt-3 ${isMinimal ? 'border-neutral-100' : 'border-gray-50'}`}>
                      <div className="flex flex-col">
                        <span className={isMinimal ? "text-[9px] text-neutral-400 font-medium uppercase tracking-widest" : "text-[10px] text-gray-400 font-bold uppercase tracking-wider"}>
                          {isMinimal ? 'INVERSIÓN' : 'Precio'}
                        </span>
                        <span className={isMinimal ? "text-base font-bold text-neutral-900" : `text-lg font-black ${salon.colorTheme.textAccent}`}>
                          ${service.price.toLocaleString('es-AR')}
                        </span>
                      </div>

                      {service.durationMinutes > 0 ? (
                        <button
                          onClick={() => onOpenBooking(service)}
                          className={`py-2 px-4 transition-all active:scale-95 cursor-pointer ${
                            isMinimal 
                              ? 'bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold tracking-widest uppercase rounded-none' 
                              : `rounded-xl ${salon.colorTheme.primary} ${salon.colorTheme.primaryHover} text-white text-xs font-bold shadow-sm`
                          }`}
                        >
                          Reservar
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`¡Gracias por tu interés en ${service.name}! Podés adquirirlo directamente visitando nuestro salón en ${salon.address}.`)}
                          className={`py-2 px-4 transition-all cursor-pointer ${
                            isMinimal 
                              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold tracking-widest uppercase rounded-none' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl'
                          }`}
                        >
                          Comprar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400 space-y-2">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-medium">No se encontraron servicios disponibles en esta categoría.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 7. Gallery Carousel / Testimonials */}
        <div className={`p-6 border space-y-4 ${
          isMinimal 
            ? 'bg-white rounded-none border-neutral-200/60 shadow-none' 
            : 'bg-white rounded-3xl border-gray-100 shadow-md'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isMinimal ? 'border-neutral-100' : 'border-gray-50'}`}>
            <span className={isMinimal ? "text-[10px] font-bold text-neutral-400 uppercase tracking-widest" : "text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"}>
              {isMinimal ? '💬 RESEÑAS' : '🌟 Opiniones de Clientes'}
            </span>
            <span className={isMinimal ? "text-[10px] font-bold text-neutral-900 uppercase tracking-widest" : `text-xs font-extrabold ${salon.colorTheme.textAccent}`}>
              ★ {salon.rating} ({salon.reviewsCount} reseñas)
            </span>
          </div>
          <div className="space-y-4">
            <div className={`p-4 relative ${
              isMinimal 
                ? 'bg-neutral-50/50 border border-neutral-100' 
                : 'bg-[#FFF6F6]/50 rounded-2xl border border-pink-50'
            }`}>
              <span className={`text-3xl font-serif absolute top-2 left-3 ${isMinimal ? 'text-neutral-200' : 'text-pink-200'}`}>“</span>
              <p className={`text-xs leading-relaxed pl-4 relative z-10 italic ${isMinimal ? 'text-neutral-500 font-light' : 'text-gray-600 font-medium'}`}>
                La manicuría rusa de Camila es excelente, súper prolija y duradera. El efecto aurora de Sofía es una locura, ¡me voy súper feliz!
              </p>
              <div className="mt-2.5 pl-4 flex items-center justify-between">
                <span className={isMinimal ? "text-[9px] font-semibold text-neutral-800 tracking-wider uppercase" : "text-[10px] font-bold text-gray-800"}>
                  — Carolina M.
                </span>
                <span className="text-[10px] text-amber-500 font-bold">★★★★★</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3b. Referral & Friend Share Section - High Fidelity */}
        <div className={`p-6 space-y-4 transition-all ${
          isMinimal 
            ? 'bg-white rounded-none border border-neutral-200 shadow-none' 
            : 'bg-white rounded-3xl border border-gray-100 shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <span className={isMinimal ? "text-[10px] font-bold text-neutral-400 uppercase tracking-widest" : "text-xs font-bold text-pink-500 uppercase tracking-widest flex items-center gap-1.5"}>
              🎁 PROGRAMA DE REFERIDOS
            </span>
            <span className="text-[10px] bg-pink-500/10 text-pink-600 font-extrabold px-2.5 py-0.5 rounded-full">
              ¡Ambas ganan 20%!
            </span>
          </div>
          
          <p className={`text-xs leading-relaxed ${isMinimal ? 'text-neutral-500 font-light' : 'text-gray-600 font-medium'}`}>
            Compartí tu enlace con una amiga. Cuando ella agende su primer turno, <strong>¡ambas recibirán un 20% de descuento!</strong> Recomendá y ahorrá en tus próximas uñas esculpidas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setShowShare(true)}
              className={`py-3 px-3 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer ${
                isMinimal
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white font-bold tracking-widest uppercase text-[10px] rounded-none'
                  : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-md'
              }`}
            >
              <span>🗣️ Compartir a un Amigo/a</span>
            </button>
            <button
              onClick={() => setShowReferralModal(true)}
              className={`py-3 px-3 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer ${
                isMinimal
                  ? 'bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-800 font-bold tracking-widest uppercase text-[10px] rounded-none'
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl shadow-sm'
              }`}
            >
              <span>🎟️ Botón de Referido</span>
            </button>
          </div>
        </div>

        {/* 8. Professional Salon Footer */}
        <footer className={`text-center space-y-4 border-t ${
          isMinimal 
            ? 'border-neutral-200/60 pt-8 pb-12 text-[10px] text-neutral-400 uppercase tracking-widest font-light' 
            : 'pt-8 pb-12 border-t border-gray-100 text-xs text-gray-400 font-medium'
        }`}>
          <div className="flex justify-center space-x-1 text-sm">
            <span>📍</span>
            <span className={isMinimal ? "lowercase first-letter:uppercase" : ""}>{salon.address}</span>
          </div>
          <div className="flex justify-center space-x-4">
            <a href={`tel:${salon.phone}`} className={isMinimal ? "hover:text-black transition-colors" : `hover:${salon.colorTheme.textAccent} transition-colors`}>📞 {salon.phone}</a>
            <a href={`mailto:${salon.email}`} className={isMinimal ? "hover:text-black transition-colors" : `hover:${salon.colorTheme.textAccent} transition-colors`}>✉️ {salon.email}</a>
          </div>
          <div className={`pt-2 border-t max-w-xs mx-auto ${isMinimal ? 'border-neutral-200/40 text-[9px]' : 'border-gray-50 text-gray-300'}`}>
            Hecho con 💖 · CyC Apps
          </div>
        </footer>
      </main>

      {/* Share dialog sheet */}
      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/50 backdrop-blur-xs">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => setShowShare(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" onClick={() => setShowShare(false)} />
              
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-900">Compartir este Salón</h4>
                <p className="text-xs text-gray-500">Invitá a tus amigas a reservar su turno en {salon.name}</p>
              </div>

              {/* QR Code Graphic */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <div className="p-2.5 bg-white rounded-xl shadow-inner">
                  <QrCode className="w-32 h-32 text-gray-900" />
                </div>
                <span className="text-[10px] font-mono font-medium text-gray-400">ESCANEÁ PARA RESERVAR EN TU CELULAR</span>
              </div>

              {/* Action shortcuts */}
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowShare(false)}
                  className="py-3 px-6 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Referral program dialog modal */}
      <AnimatePresence>
        {showReferralModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setShowReferralModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 space-y-5 shadow-2xl z-10 text-gray-800"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  🎟️
                </div>
                <h4 className="text-lg font-bold text-gray-900">Programa de Referidos</h4>
                <p className="text-xs text-gray-500">Gana 20% de descuento por cada amiga que reserve</p>
              </div>

              {/* Unique referral code */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TU CÓDIGO DE DESCUENTO DE REFERIDO</span>
                <div className="text-lg font-mono font-black text-slate-800 select-all tracking-wider">
                  {salon.id.toUpperCase()}-REF2026
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Compartí este código con tus amigas para que lo ingresen al reservar o lo mencionen al pagar.</p>
              </div>

              {/* Status statistics */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-pink-50/40 p-3 rounded-xl border border-pink-100/50">
                  <span className="text-[10px] font-bold text-pink-500 block">AMIGAS REFERIDAS</span>
                  <span className="text-lg font-black text-pink-600">0</span>
                </div>
                <div className="bg-pink-50/40 p-3 rounded-xl border border-pink-100/50">
                  <span className="text-[10px] font-bold text-pink-500 block">DESCUENTOS ACTIVOS</span>
                  <span className="text-lg font-black text-pink-600">0%</span>
                </div>
              </div>

              {/* Sharing button */}
              <button
                onClick={() => {
                  setShowReferralModal(false);
                  setShowShare(true);
                }}
                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>🗣️ Compartir enlace con un Amigo/a</span>
              </button>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cerrar Ventana
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Carterita (Shopping Cart) Indicator */}
      {cart.length > 0 && !showCartModal && (
        <div className="fixed bottom-24 right-4 z-40">
          <motion.button
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsCheckingOut(false);
              setShowCartModal(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-slate-950 font-black px-5 py-3.5 rounded-full shadow-2xl scale-105 transition-all cursor-pointer animate-bounce"
          >
            <span className="text-lg">👜</span>
            <span className="text-xs tracking-wider uppercase font-extrabold">Mi Carterita</span>
            <span className="bg-slate-950 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
              {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
            </span>
          </motion.button>
        </div>
      )}

      {/* Cart & Checkout Dialog Sheet */}
      <AnimatePresence>
        {showCartModal && !activeOrderCreated && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setShowCartModal(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 space-y-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" onClick={() => setShowCartModal(false)} />
              
              {!isCheckingOut ? (
                /* SECTION A: ITEM LIST */
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-2xl">🛍️</span>
                    <h4 className="text-lg font-black text-gray-900 mt-1">Tu Carterita de Compras</h4>
                    <p className="text-xs text-gray-500">Agregá o quitá combos y productos antes de encargar</p>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-[40vh] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-gray-900 block truncate">{item.product.name}</span>
                          <span className="text-[10px] text-pink-600 font-extrabold">${item.product.price.toLocaleString('es-AR')} c/u</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-xs flex items-center justify-center text-gray-800 transition-colors"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-gray-900 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-xs flex items-center justify-center text-gray-800 transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-bold ml-2 transition-colors"
                            title="Eliminar de la carterita"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL ESTIMADO</span>
                    <span className="text-xl font-black text-slate-900">
                      ${cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>📥 Encargar mi Pedido</span>
                    </button>
                    <button
                      onClick={() => setShowCartModal(false)}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Seguir explorando
                    </button>
                  </div>
                </div>
              ) : (
                /* SECTION B: CHECKOUT FORM */
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div className="text-center">
                    <span className="text-2xl">📝</span>
                    <h4 className="text-lg font-black text-gray-900 mt-1">Completá tu Encargo</h4>
                    <p className="text-xs text-gray-500">Ingresá tus datos para que preparemos tu pedido</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">TU NOMBRE COMPLETO</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. María González"
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">NÚMERO DE TELÉFONO</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. +54 9 11 1234-5678"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>
                  </div>

                  <div className="bg-pink-50/50 border border-pink-100 p-3.5 rounded-2xl space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-pink-600">
                      <span>📍</span>
                      <span>Lugar de Retiro por Tienda:</span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed pl-5">
                      {salon.address}. Podés retirar tu pedido en cualquier momento de nuestro horario de atención presentando tu código de retiro único.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(false)}
                      className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      className="py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl font-black text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Ticket Modal with Pickup Code */}
      <AnimatePresence>
        {activeOrderCreated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={handleClearOrderSuccess} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 space-y-5 shadow-2xl z-10 text-gray-800 text-center"
            >
              <div className="space-y-1">
                <span className="text-3xl">🎉</span>
                <h4 className="text-lg font-black text-gray-900">¡Pedido Encargado!</h4>
                <p className="text-xs text-gray-500">Ya estamos preparando tus productos</p>
              </div>

              {/* DASHED TICKET */}
              <div className="bg-slate-50 border-2 border-dashed border-pink-200/80 p-5 rounded-2xl text-left space-y-4 relative">
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-white rounded-full" />
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-white rounded-full" />
                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white rounded-full" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full" />

                <div className="text-center border-b border-gray-200 pb-3 space-y-1">
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest block">CÓDIGO DE RETIRO ÚNICO</span>
                  <div className="text-2xl font-mono font-black text-slate-800 tracking-wider inline-block bg-slate-200/50 px-4 py-1.5 rounded-lg border border-slate-300">
                    {activeOrderCreated.pickupCode}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">DETALLE DE COMPRA</span>
                  <div className="space-y-1.5 max-h-[15vh] overflow-y-auto">
                    {activeOrderCreated.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono text-slate-500">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs font-black border-t border-slate-200 pt-2 text-slate-900">
                    <span>Total Abonar en Caja:</span>
                    <span>${activeOrderCreated.totalPrice.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 space-y-1 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center space-x-1">
                    <span>👤</span>
                    <span className="font-semibold">Cliente: {activeOrderCreated.clientName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📍</span>
                    <span className="font-semibold truncate">Retirar en: {salon.address}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100/50 text-[10px] font-medium leading-relaxed">
                📸 <strong>¡Importante!</strong> Tomá una captura de pantalla de este ticket o anotá tu código para presentarlo al retirar por el local.
              </div>

              <button
                onClick={handleClearOrderSuccess}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                ¡Entendido, Listo!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
