"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart, Search, Menu, Phone, MapPin, X, ChevronLeft, ChevronRight,
  Truck, Shield, Leaf, Headset, CheckCircle, Sparkles, Flame, Star, ArrowRight,
  Users, Clock, Award, Gift, Share2,
} from "lucide-react";

interface HomeData {
  slides: any[];
  offers: any[];
  dresses: any[];
  categories: any[];
  items: any[];
  winners: any[];
  settings: Record<string, string>;
  collections?: any[];
}


export default function HomeClient({ data }: { data: HomeData }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [offerIndex, setOfferIndex] = useState(0);
  const [dressFilter, setDressFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "", postcode: "", notes: "" });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Product detail modal state (Shopify style color thumbnail viewer)
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [detailQty, setDetailQty] = useState<number>(1);
  const [zoomOpen, setZoomOpen] = useState<boolean>(false);



  function parseSizes(sizes: any): string[] {
    if (Array.isArray(sizes)) return sizes;
    if (typeof sizes === "string" && sizes.length > 0) {
      try { return JSON.parse(sizes); } catch {}
      const m = sizes.match(/\{(.+)\}/);
      if (m) return m[1].split(",").map((s: string) => s.trim());
      return sizes.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }

  function getProductThumbnails(prod: any) {
    const list: { url: string; color?: string }[] = [];
    // First add default color variant image(s) if any
    if (prod?.colorVariants && Array.isArray(prod.colorVariants)) {
      prod.colorVariants.forEach((cv: any) => {
        if (cv.image && cv.isDefault) {
          list.push({ url: cv.image, color: cv.color });
        }
      });
      // Then add the rest of the color variant images
      prod.colorVariants.forEach((cv: any) => {
        if (cv.image && !cv.isDefault) {
          list.push({ url: cv.image, color: cv.color });
        }
      });
    }
    if (prod?.variants && Array.isArray(prod.variants)) {
      prod.variants.forEach((v: any) => {
        if (v.images?.[0]) list.push({ url: v.images[0], color: v.color });
      });
    }
    if (prod?.images && Array.isArray(prod.images)) {
      prod.images.forEach((img: string) => {
        if (!list.some((l) => l.url === img)) list.push({ url: img });
      });
    }
    return list;
  }

  function openDetailModal(prod: any) {
    // Tag dresses (they have a 'type' field like ladies/gents/kids/combo)
    const isDress = !!(prod.type && ['ladies','gents','kids','combo'].includes(prod.type));
    setDetailProduct({ ...prod, isDress });
    const thumbs = getProductThumbnails(prod);
    setSelectedImage(thumbs[0]?.url || prod.images?.[0] || "");
    setSelectedColor(thumbs[0]?.color || prod.colors?.[0] || "");
    setSelectedSize("");
    setDetailQty(1);
  }

  function isPreOrder(prod: any) {
    if (!prod) return false;
    if (prod.type) {
      const matchingCat = data.categories?.find(
        (c: any) => c.slug === prod.type || c.name?.toLowerCase() === prod.type?.toLowerCase()
      );
      if (matchingCat?.orderType === "pre_order") return true;
    }
    if (prod.categoryId) {
      const matchingCat = data.categories?.find((c: any) => c.id === prod.categoryId);
      if (matchingCat?.orderType === "pre_order") return true;
    }
    if (prod.collectionId) {
      const matchingCol = data.collections?.find((c: any) => c.id === prod.collectionId);
      if (matchingCol?.orderType === "pre_order") return true;
    }
    return false;
  }

  const { slides, offers, dresses, categories, items, winners, settings, collections = [] } = data;
  const whatsappNumber = settings.whatsapp_number || "447749132122";

  // Live viewers counter (ambient, purely decorative)
  const [viewers, setViewers] = useState(47);
  const [revealReady, setRevealReady] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCart();
    const interval = setInterval(() => setHeroIndex((i) => (i + 1) % Math.max(slides.length, 1)), 5500);
    const offerInterval = setInterval(() => setOfferIndex((i) => (i + 1) % Math.max(offers.length, 1)), 2000);
    const viewerTick = setInterval(() => {
      setViewers((v) => {
        const next = v + Math.floor(Math.random() * 7) - 3;
        return Math.max(28, Math.min(96, next));
      });
    }, 4000);
    return () => { clearInterval(interval); clearInterval(offerInterval); clearInterval(viewerTick); };
  }, [slides.length, offers.length]);

  // Scroll reveal
  useEffect(() => {
    setRevealReady(true);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  async function fetchCart() {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setCart(data);
  }

  async function addToCart(itemId: number, name: string, price: string, quantity = 1, itemType = "item", variantName: string | null = null, variantSize: string | null = null) {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity, itemType, variantName, variantSize }),
    });
    fetchCart();
    setCartOpen(true);
  }

  async function updateCartQty(id: number, qty: number) {
    if (qty < 1) return removeCartItem(id);
    await fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, quantity: qty }) });
    fetchCart();
  }

  async function removeCartItem(id: number) {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
    fetchCart();
  }

  function shareOnWhatsApp(name: string, price?: string) {
    const text = price
      ? `Check out ${name} (£${price}) on Kerala Super Store!`
      : `Check out ${name} on Kerala Super Store!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`;
    window.open(waUrl, "_blank");
  }

  function isPreOrderCategory(categoryId?: number) {
    if (!categoryId) return false;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return false;
    const col = collections.find((col) => col.id === cat.collectionId);
    return col?.orderType === "pre_order";
  }

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.item?.price || 0) * item.quantity, 0);

  const filteredDresses = dresses.filter((d) => {
    const matchesFilter = dressFilter === "all" || d.type === dressFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      d.name.toLowerCase().includes(q) ||
      (d.type && d.type.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.price.toString().includes(q) ||
      categories.some(c => c.id === item.categoryId && c.name.toLowerCase().includes(q));
    const matchesCat = catFilter === "all" || String(item.categoryId) === catFilter;
    return matchesSearch && matchesCat;
  });

  const searchMatches = searchQuery.trim()
    ? [
        ...dresses
          .filter(
            (d) =>
              d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (d.type && d.type.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((d) => ({ ...d, isDress: true })),
        ...items
          .filter(
            (i) =>
              i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
              categories.some((c) => c.id === i.categoryId && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((i) => ({ ...i, isDress: false })),
      ]
    : [];

  function handleExploreSlide(slide: any) {
    let target = slide?.link;
    const titleLower = (slide?.title || "").toLowerCase();
    const targetLower = (target || "").toLowerCase();

    // Check if target needs to be dynamically resolved to a known section
    if (!target || target === "#" || target === "#products" || targetLower.includes("dress") || targetLower.includes("onam")) {
      if (
        titleLower.includes("dress") ||
        titleLower.includes("saree") ||
        titleLower.includes("shirt") ||
        titleLower.includes("kasavu") ||
        titleLower.includes("onam") ||
        targetLower.includes("dress") ||
        targetLower.includes("onam")
      ) {
        target = "#dresses";
      } else {
        target = "#products";
      }
    }

    if (target.startsWith("#")) {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      } else {
        // Fallback to #dresses or #products if the explicit section id doesn't exist
        const fallback = document.querySelector("#dresses") || document.querySelector("#products");
        if (fallback) fallback.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.location.href = target;
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    const cartData = cart.map((item) => ({
      itemId: item.itemId,
      variantId: item.variantId,
      name: item.item?.name,
      variantName: item.variant ? `${item.variant.color || ""} ${item.variant.size || ""}`.trim() : null,
      quantity: item.quantity,
      price: item.item?.price,
    }));
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...checkoutForm, customerName: checkoutForm.name, customerPhone: checkoutForm.phone, totalAmount: cartTotal.toFixed(2), paymentMethod: "cod", items: cartData }),
    });
    const data = await res.json();
    if (data.orderNumber) {
      setOrderNumber(data.orderNumber);
      setOrderPlaced(true);
      for (const item of cart) {
        await fetch(`/api/cart?id=${item.id}`, { method: "DELETE" });
      }
      fetchCart();
    }
  }

  const heroSlides = slides.length > 0 ? slides : [
    { title: "Up to 40% OFF on Groceries", subtitle: "Fresh vegetables, fruits, spices & more at unbeatable prices. Limited time offer!", image: "", buttonText: "Shop Now", link: "#products" },
  ];

  const nextHero = () => setHeroIndex((i) => (i + 1) % heroSlides.length);
  const prevHero = () => setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length);

  const nextOffer = () => setOfferIndex((i) => (i + 1) % Math.max(offers.length, 1));
  const prevOffer = () => setOfferIndex((i) => (i - 1 + Math.max(offers.length, 1)) % Math.max(offers.length, 1));

  const whatsappLink = `https://wa.me/${whatsappNumber}`;
  const whatsappOrderLink = `https://wa.me/${whatsappNumber}?text=Hi%20Kerala%20Super%20Store!%20I%20want%20to%20place%20an%20order.%20Please%20help%20me%20❤️`;

  return (
    <div className="min-h-screen font-sans">
      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 px-4 text-sm relative">
        <span>{settings.store_topbar_text || "🎉 Free Delivery on orders over £30 | Cash on Delivery Available"}</span>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              {settings.theme_logo ? (
                <img src={settings.theme_logo} alt="Logo" style={{ width: settings.theme_logo_width ? `${settings.theme_logo_width}px` : '40px' }} className="object-contain" />
              ) : (
                <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg">K</div>
              )}
              <div className="leading-tight">
                <div className="font-bold text-slate-900 text-lg">Kerala Super Store</div>
                <div className="text-xs text-slate-500">SOUTH INDIAN GROCERY</div>
              </div>
            </Link>
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 flex-1 max-w-md mx-8 relative">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, shirts, sarees, spices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none ml-2 w-full text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Instant Live Search Results Overlay */}
              {searchQuery.trim() && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSearchQuery("")} />
                  <div className="absolute top-12 left-0 right-0 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 p-3 max-h-96 overflow-y-auto space-y-2 animate-slide-up text-left">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-stone-500 px-2 font-bold border-b border-stone-100 pb-2">
                      <span>Found {searchMatches.length} matching item(s)</span>
                      <button onClick={() => setSearchQuery("")} className="text-stone-400 hover:text-stone-600">Close</button>
                    </div>

                    {searchMatches.length > 0 ? (
                      <div className="divide-y divide-stone-100">
                        {searchMatches.slice(0, 8).map((match: any) => (
                          <div
                            key={`${match.isDress ? "dress" : "item"}-${match.id}`}
                            onClick={() => {
                              openDetailModal(match);
                              if (match.categoryId) {
                                setCatFilter(String(match.categoryId));
                              }
                              const el = match.isDress ? document.querySelector("#dresses") : document.querySelector("#products");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                              setSearchQuery("");
                            }}
                            className="flex items-center justify-between p-2 hover:bg-emerald-50/60 rounded-xl cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3">
                              {match.images && match.images[0] ? (
                                <img src={match.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0" />
                              ) : (
                                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-xs text-stone-400 shrink-0">
                                  {match.isDress ? "👗" : "📦"}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-stone-900 text-xs group-hover:text-emerald-800 transition">
                                  {match.name}
                                </div>
                                <div className="text-[10px] text-stone-500">
                                  {match.isDress ? `👗 Festival Attire (${match.type || ""})` : "🛒 Grocery Item"}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-stone-900 text-xs">£{match.price}</div>
                              <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                👁️ View Details
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-stone-500">
                        No matching products found for "{searchQuery}".
                      </div>
                    )}

                    {searchMatches.length > 0 && (
                      <button
                        onClick={() => {
                          const el = document.querySelector("#dresses") || document.querySelector("#products");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                          setSearchQuery("");
                        }}
                        className="w-full text-center py-2 bg-[#0b2416] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition mt-2 shadow-sm"
                      >
                        View all matching & related products below ↓
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <a href={whatsappLink} target="_blank" className="hidden md:flex items-center gap-1 text-sm text-green-600 font-medium">
                <Phone className="w-4 h-4" /> +44 7749 132122
              </a>
              <button onClick={() => setCartOpen(true)} className="relative p-2 hover:bg-slate-100 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}
              </button>
              <button onClick={() => setMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg md:hidden">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-2 sticky top-16 z-30">
        <div className="flex items-center bg-slate-100 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none ml-2 w-full text-sm" />
          {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-slate-400" /></button>}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setMenuOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-3">
              {[{label:"Home",href:"#home"},{label:"Onam Collection",href:"#onam"},{label:"Categories",href:"#categories"},{label:"Products",href:"#products"},{label:"Winners",href:"#winners"},{label:"Contact",href:"#contact"}].map((item) => (
                <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="block py-2 text-slate-700 hover:text-green-700 font-medium">{item.label}</a>
              ))}
            </nav>
            <div className="flex gap-4 mt-6 pt-6 border-t">
                <a href="#" className="text-blue-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                <a href="#" className="text-pink-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                <a href={whatsappLink} target="_blank" className="text-green-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
            </div>
          </div>
        </div>
      )}
      {/* Full Width Hero Carousel */}
      <section id="home" className="relative overflow-hidden h-[580px] sm:h-[600px] md:h-[620px] flex items-center bg-[#0b2416] text-white">
        {/* Full-width Background Hero Images */}
        {heroSlides.map((slide, i) => (
          <div
            key={slide.id || i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === heroIndex ? "opacity-100 z-0 scale-100" : "opacity-0 -z-10 scale-105"
            }`}
          >
            {slide.image ? (
              <img src={slide.image} alt={slide.title || ""} className="w-full h-full object-cover object-[80%_center] md:object-center" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-forest-900 to-amber-950" />
            )}
            {/* Dark luxury gradient overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          </div>
        ))}

        {/* Hero Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-amber-300 bg-amber-400/20 border border-amber-400/30 rounded-full px-3.5 py-1.5 backdrop-blur-md font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Authentic Kerala Store · UK Delivery
              </span>
              <span className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-300 bg-emerald-400/20 border border-emerald-400/30 rounded-full px-3.5 py-1.5 backdrop-blur-md font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                {viewers} shopping now
              </span>
            </div>

            <h1 
              style={{ 
                color: heroSlides[heroIndex]?.titleColor || "#ffffff",
                fontSize: heroSlides[heroIndex]?.titleSize ? `${heroSlides[heroIndex].titleSize}px` : undefined,
                fontFamily: heroSlides[heroIndex]?.titleFont || undefined,
              }}
              className="font-editorial font-bold leading-[1.02] tracking-tight drop-shadow-md text-[clamp(28px,5vw,72px)]"
            >
              {heroSlides[heroIndex]?.title || "Grand Onam & Kerala Festive Collection 2026"}
            </h1>

            <p 
              style={{ 
                color: heroSlides[heroIndex]?.subtitleColor || "#ffffffcc",
                fontSize: heroSlides[heroIndex]?.subtitleSize ? `${heroSlides[heroIndex].subtitleSize}px` : undefined,
                fontFamily: heroSlides[heroIndex]?.subtitleFont || undefined,
              }}
              className="mt-6 max-w-2xl leading-relaxed font-light drop-shadow-sm text-[clamp(14px,2.5vw,20px)]"
            >
              {heroSlides[heroIndex]?.subtitle || "Authentic Kasavu sarees, shirts, kids attire & traditional Kerala groceries delivered straight to your doorstep across the UK."}
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => handleExploreSlide(heroSlides[heroIndex])}
                style={{ 
                  backgroundColor: heroSlides[heroIndex]?.btnBgColor || "#f59e0b",
                  color: heroSlides[heroIndex]?.btnTextColor || "#1c1917"
                }}
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base transition-all shadow-xl hover:scale-105 cursor-pointer"
              >
                {heroSlides[heroIndex]?.buttonText || "Explore Collection"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={whatsappOrderLink}
                target="_blank"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white px-7 py-4 rounded-full font-semibold transition hover:scale-105"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                WhatsApp Order
              </a>
            </div>

            {/* Trust strip */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs md:text-sm text-emerald-100/90 font-medium pt-4 border-t border-white/15">
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-amber-400" /> Free UK delivery over £30</div>
              <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400" /> Cash on Delivery Available</div>
              <div className="flex items-center gap-2"><Leaf className="w-4 h-4 text-amber-400" /> 100% Authentic Products</div>
            </div>
          </div>
        </div>

        {/* Slide Nav Buttons */}
        {heroSlides.length > 1 && (
          <>
            <button onClick={prevHero} className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 border border-white/20 hover:bg-black/60 text-white items-center justify-center backdrop-blur-md transition shadow-lg">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextHero} className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 border border-white/20 hover:bg-black/60 text-white items-center justify-center backdrop-blur-md transition shadow-lg">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{icon:Truck,title:"Free Delivery",desc:"On orders over £30"},{icon:Shield,title:"Cash on Delivery",desc:"Pay when you receive"},{icon:Leaf,title:"100% Fresh",desc:"Quality guaranteed"},{icon:Phone,title:"Easy Ordering",desc:"Order via WhatsApp"}].map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700"><f.icon className="w-5 h-5" /></div>
                <div><h4 className="font-semibold text-sm text-slate-900">{f.title}</h4><p className="text-xs text-slate-500">{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-green-700 text-white py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, idx) => (
            <span key={idx} className="flex gap-8 mx-8 text-sm">
              <span>🚚 Free Delivery on orders over £30</span>
              <span>🔥 Special Offers Available</span>
              <span>📱 Order via WhatsApp: +44 7749 132122</span>
              <span>🌿 Fresh Products Daily</span>
            </span>
          ))}
        </div>
      </div>

      {/* Today's Offers */}
      {offers.length > 0 && (
        <section className="py-12 bg-slate-50" id="todayOffer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-2">🔥 Today's Special</span>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Today's Offers</h2>
              </div>
            </div>
            <div className="relative">
              <button onClick={prevOffer} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg p-2 rounded-full hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></button>
              <div className="overflow-hidden mx-10">
                <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${offerIndex * 100}%)` }}>
                  {offers.map((offer) => (
                    <div key={offer.id} className="w-full flex-shrink-0 px-2">
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-1/3 h-48 md:h-auto bg-slate-100 relative">
                          {offer.image ? <img src={offer.image} alt={offer.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-6xl">{offer.emoji}</div>}
                          {offer.discount && <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">{offer.discount}</span>}
                        </div>
                        <div className="p-6 md:w-2/3 flex flex-col justify-center">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{offer.tag}</span>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">{offer.name}</h3>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-2xl font-bold text-slate-900">£{offer.newPrice}</span>
                            <span className="text-lg text-slate-400 line-through">£{offer.oldPrice}</span>
                          </div>
                          <button onClick={() => addToCart(offer.id, offer.name, offer.newPrice, 1, "offer")} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition w-fit flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={nextOffer} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg p-2 rounded-full hover:bg-slate-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </section>
      )}

      {/* Promo Banner */}
      {settings.promo_banner_active !== "false" && (settings.promo_banner_tag || settings.promo_banner_title || settings.promo_banner_image) && (
        <section id="promo-banner" className="relative overflow-hidden" style={{ minHeight: settings.promo_banner_image ? '400px' : undefined }}>
          <div 
            className="absolute inset-0" 
            style={{ background: `linear-gradient(to right, ${settings.promo_banner_color1 || '#f97316'}, ${settings.promo_banner_color2 || '#fbbf24'}, ${settings.promo_banner_color3 || '#eab308'})` }} 
          />
          {settings.promo_banner_image && (
            <img src={settings.promo_banner_image} alt="Promo Banner" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center ${settings.promo_banner_image ? 'py-24' : 'py-20'}`}>
            {settings.promo_banner_tag && (
              <span style={{ color: settings.promo_banner_tag_color || "#ffffff" }} className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-medium mb-4">{settings.promo_banner_tag}</span>
            )}
            {settings.promo_banner_title && (
              <h2 style={{ color: settings.promo_banner_title_color || "#ffffff" }} className="text-4xl md:text-5xl font-bold mb-4">
                {settings.promo_banner_title}
              </h2>
            )}
            {settings.promo_banner_subtitle && (
              <p style={{ color: settings.promo_banner_subtitle_color || "#ffffffcc" }} className="text-lg max-w-2xl mx-auto mb-8">{settings.promo_banner_subtitle}</p>
            )}
            {settings.promo_banner_btn_text && (
              <a href={settings.promo_banner_btn_link || "#dresses"} style={{ backgroundColor: settings.promo_banner_btn_color || "#f97316", color: settings.promo_banner_btn_text_color || "#ffffff" }} className="inline-block px-8 py-3 rounded-lg font-bold hover:opacity-90 transition">
                {settings.promo_banner_btn_text}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Dress Collections */}
      {dresses.length > 0 && (
        <section id="dresses" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-rose-700/80 mb-3">
                <span className="w-8 h-px bg-rose-700/40" /> Festival · Onam 2026 <span className="w-8 h-px bg-rose-700/40" />
              </div>
              <h2 className="font-editorial text-4xl md:text-5xl font-bold text-[#0b2416] leading-[0.95]">
                Dressed for <span className="italic text-rose-700">Onam.</span>
              </h2>
              <p className="text-stone-600 mt-4">Pre-order traditional Kerala attire for ladies, gents and kids — reserved and delivered before the festivities begin.</p>
            </div>
            <div className="flex gap-2 justify-center mb-8 flex-wrap">
              {["all","ladies","gents","kids","combo"].map((type) => (
                <button key={type} onClick={() => setDressFilter(type)} className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition ${dressFilter === type ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {type}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDresses.map((dress) => (
                <div key={dress.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer" onClick={() => openDetailModal(dress)}>
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                    {dress.images?.[0] ? <img src={dress.images[0]} alt={dress.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-4xl">👗</div>}
                    {dress.colorVariants?.length > 0 && (
                      <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {dress.colorVariants.length} colors
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition">{dress.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-slate-900">£{dress.price}</span>
                      {dress.compareAtPrice && <span className="text-sm text-slate-400 line-through">£{dress.compareAtPrice}</span>}
                    </div>
                    {parseSizes(dress.sizes).length > 0 && <p className="text-xs text-slate-500 mt-1">Sizes: {parseSizes(dress.sizes).join(", ")}</p>}
                    <button onClick={(e) => { e.stopPropagation(); openDetailModal(dress); }} className="mt-3 w-full bg-[#fdd835] hover:bg-[#fbc02d] text-stone-900 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider">
                      Select Colors & Options
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section id="categories" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700/80 mb-3">
                <span className="w-8 h-px bg-emerald-700/40" /> The aisles
              </div>
              <h2 className="font-editorial text-4xl md:text-5xl font-bold text-[#0b2416] leading-[0.95]">
                Shop by <span className="italic text-emerald-700">category.</span>
              </h2>
            </div>
            <p className="text-stone-600 max-w-sm">Six shelves, one promise — authentic South Indian pantry staples, always in stock.</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {categories.map((c) => (
                <a key={c.id} href={`#cat-${c.id}`} className="px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-xs font-medium text-stone-700 hover:bg-white border border-stone-200/80 transition">
                  {c.name}
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => { setCatFilter(String(cat.id)); window.location.href = "#products"; }} className="bg-white rounded-xl p-6 text-center border border-slate-200 hover:border-green-500 hover:shadow-md transition group">
                <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-700 text-2xl mb-3 group-hover:bg-green-600 group-hover:text-white transition">
                  {cat.name.includes("Rice") ? "🌾" : cat.name.includes("Spice") ? "🌶️" : cat.name.includes("Snack") ? "🍪" : cat.name.includes("Beverage") ? "☕" : cat.name.includes("Dairy") ? "🧀" : cat.name.includes("Frozen") ? "❄️" : "📦"}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{cat.name}</h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Category Sections */}
      {categories.map((cat) => {
        const filtered = filteredItems.filter(item => item.categoryId === cat.id);
        if (filtered.length === 0) return null; // Hide empty categories
        
        return (
          <section key={cat.id} id={`cat-${cat.id}`} className="py-16 md:py-20 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700/80 mb-3">
                    <span className="w-8 h-px bg-emerald-700/40" /> {cat.name} · {filtered.length} items
                  </div>
                  <h2 className="font-editorial text-4xl md:text-5xl font-bold text-[#0b2416] leading-[0.95]">
                    {cat.name} <span className="italic text-emerald-700">collection.</span>
                  </h2>
                  {cat.description && <p className="text-stone-600 mt-4 max-w-xl">{cat.description}</p>}
                </div>
                <a href="#products" className="hidden md:inline-flex items-center gap-2 bg-[#0b2416] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-900 transition">
                  View all <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filtered.slice(0, 8).map((item, idx) => {
                  const discountPct = item.compareAtPrice ? Math.round((1 - parseFloat(item.price) / parseFloat(item.compareAtPrice)) * 100) : 0;
                  return (
                    <div key={item.id} className="reveal group bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                      <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 relative overflow-hidden">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                        )}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                          {discountPct > 0 && <div className="bg-amber-400 text-[#0b2416] text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md shadow-xs">-{discountPct}%</div>}
                          {idx % 2 === 0 ? (
                            <div className="bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                              🔥 UK Trending
                            </div>
                          ) : (
                            <div className="bg-emerald-800 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                              ⭐ Best Seller
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3">
                          <button onClick={() => addToCart(item.id, item.name, item.price, 1, item.isDress ? "dress" : "item")} className="w-full bg-[#0b2416] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-800 transition shadow-xl">
                            <ShoppingCart className="w-3.5 h-3.5" /> Add to cart
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1 text-amber-500 mb-1">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                          <span className="text-[10px] text-stone-400 font-mono ml-1">(4.7)</span>
                        </div>
                        <h3 className="font-display text-[15px] font-semibold text-[#0b2416] line-clamp-2 leading-snug">{item.name}</h3>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="font-display text-xl font-bold text-[#0b2416]">£{item.price}</span>
                          {item.compareAtPrice && <span className="text-xs text-stone-400 line-through">£{item.compareAtPrice}</span>}
                        </div>
                        <button onClick={() => addToCart(item.id, item.name, item.price, 1, item.isDress ? "dress" : "item")} className="md:hidden mt-3 w-full bg-[#0b2416] text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      {/* Products */}
      <section id="products" className="py-20 md:py-28 bg-[#faf7f0] relative">
        <div className="absolute inset-0 leaf-pattern pointer-events-none opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700/80 mb-3">
                <span className="w-8 h-px bg-emerald-700/40" />
                The pantry · {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </div>
              <h2 className="font-editorial text-4xl md:text-5xl lg:text-6xl font-bold text-[#0b2416] leading-[0.95]">
                Picked <span className="italic text-emerald-700">fresh,</span> priced fair.
              </h2>
              <p className="mt-4 text-stone-600 max-w-xl">
                Every shelf item is hand-selected from trusted Kerala growers and processors. Filter by category to narrow the hunt.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5" />
              Updated daily
            </div>
          </div>

          <div className="reveal flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setCatFilter("all")} className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition ${catFilter === "all" ? "bg-[#0b2416] text-white shadow-lg shadow-emerald-900/20" : "bg-white text-stone-700 border border-stone-200 hover:border-emerald-500"}`}>All shelves</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setCatFilter(String(cat.id))} className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition ${catFilter === String(cat.id) ? "bg-[#0b2416] text-white shadow-lg shadow-emerald-900/20" : "bg-white text-stone-700 border border-stone-200 hover:border-emerald-500"}`}>{cat.name}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredItems.map((item, idx) => {
              const discountPct = item.compareAtPrice ? Math.round((1 - parseFloat(item.price) / parseFloat(item.compareAtPrice)) * 100) : 0;
              const lowStock = (item.stock || 0) > 0 && (item.stock || 0) < 5;
              const isPreOrder = isPreOrderCategory(item.categoryId);
              return (
                <div key={item.id} className="reveal group bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                  <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 relative overflow-hidden">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                    )}
                    {discountPct > 0 && (
                      <div className="absolute top-3 left-3 bg-amber-400 text-[#0b2416] text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md">-{discountPct}%</div>
                    )}
                    {isPreOrder && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow">
                        <Clock className="w-3 h-3" /> Pre-Order
                      </div>
                    )}
                    {!isPreOrder && lowStock && (
                      <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Low stock
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3 flex gap-2">
                      <button onClick={() => addToCart(item.id, item.name, item.price, 1, item.isDress ? "dress" : "item")} className={`flex-1 ${isPreOrder ? "bg-amber-600 hover:bg-amber-700" : "bg-[#0b2416] hover:bg-emerald-800"} text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xl`}>
                        {isPreOrder ? <Clock className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                        {isPreOrder ? "PRE-ORDER" : "ADD TO BAG"}
                      </button>
                      <button onClick={() => shareOnWhatsApp(item.name, item.price)} title="Share on WhatsApp" className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xl">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        <span className="text-[10px] text-stone-400 font-mono ml-1">({(4.5 + (idx % 3) * 0.1).toFixed(1)})</span>
                      </div>
                      <button onClick={() => shareOnWhatsApp(item.name, item.price)} title="Share" className="text-emerald-600 hover:text-emerald-700 p-1">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-display text-[15px] font-semibold text-[#0b2416] line-clamp-2 leading-snug">{item.name}</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-display text-xl font-bold text-[#0b2416]">£{item.price}</span>
                      {item.compareAtPrice && <span className="text-xs text-stone-400 line-through">£{item.compareAtPrice}</span>}
                    </div>
                    <div className="md:hidden flex gap-2 mt-3">
                      <button onClick={() => addToCart(item.id, item.name, item.price, 1, item.isDress ? "dress" : "item")} className={`flex-1 ${isPreOrder ? "bg-amber-600" : "bg-[#0b2416]"} text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5`}>
                        {isPreOrder ? "PRE-ORDER" : "ADD TO BAG"}
                      </button>
                      <button onClick={() => shareOnWhatsApp(item.name, item.price)} className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-stone-600">No products on this shelf yet. Try another category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{icon:Truck,title:"Fast Delivery",desc:"Quick and reliable delivery across UK"},{icon:Shield,title:"Cash on Delivery",desc:"Pay when you receive your order"},{icon:Leaf,title:"Fresh Products",desc:"100% fresh and authentic Kerala products"},{icon:Headset,title:"24/7 Support",desc:"WhatsApp support for any queries"}].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 text-center border border-slate-200">
                <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-700 mb-4"><f.icon className="w-7 h-7" /></div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500 mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-green-100 rounded-2xl h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-green-600 rounded-full flex items-center justify-center text-white text-3xl mb-4">🏪</div>
                <span className="font-bold text-green-800 text-xl">Kerala Super Store</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">About Us</h2>
              <h3 className="text-lg font-semibold text-green-700 mb-4">{settings.store_about_title || "Your Trusted South Indian Grocery in UK"}</h3>
              <p className="text-slate-600 mb-6">{settings.store_about_text || "We are a family-run South Indian grocery store dedicated to bringing you the authentic tastes of Kerala and South India. From fresh spices to traditional snacks, we have everything you need."}</p>
              <ul className="space-y-3 mb-6">
                {["Fresh Products Daily","Cash on Delivery Available","Fast Delivery Across UK","Quality Guaranteed","WhatsApp Ordering"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-slate-700"><CheckCircle className="w-4 h-4 text-green-600" /> {item}</li>
                ))}
              </ul>
              <a href={whatsappLink} target="_blank" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Ready to Order?</h2>
          <p className="text-white/80 mb-6">Order now via WhatsApp and get fast delivery!</p>
          <a href={whatsappOrderLink} target="_blank" className="inline-block bg-white text-green-700 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition">Order on WhatsApp</a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-700/80 mb-3">
              <span className="w-8 h-px bg-emerald-700/40" /> Come say hi <span className="w-8 h-px bg-emerald-700/40" />
            </div>
            <h2 className="font-editorial text-4xl md:text-5xl font-bold text-[#0b2416] leading-[0.95]">
              Four ways to <span className="italic text-emerald-700">reach us.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{icon:MapPin,title:"Address",text:settings.store_address || "Old Market Street, M98DX, Manchester",href:settings.store_map_link || "https://www.google.com/maps/search/Kerala+superstore+ltd+Old+Market+Street+M98DX+Manchester"},{icon:Phone,title:"Phone",text:settings.store_phone || "+44 7749 132122",href:`tel:${(settings.store_phone || "+447749132122").replace(/ /g, '')}`},{icon:Phone,title:"WhatsApp",text:settings.store_whatsapp || "+44 7749 132122",href:whatsappLink},{icon:Phone,title:"Email",text:settings.store_email || "info@keralasuperstore.co.uk",href:`mailto:${settings.store_email || "info@keralasuperstore.co.uk"}`}].map((c) => (
              <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} className="bg-white rounded-xl p-6 text-center border border-slate-200 hover:border-green-500 hover:shadow-md transition">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-700 mb-3"><c.icon className="w-6 h-6" /></div>
                <h3 className="font-semibold text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{c.text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Lucky Draw Winners */}
      {winners.length > 0 && (
        <section id="winners" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-12 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-amber-700/90 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full mb-4">
                <Award className="w-3 h-3" /> Hall of Fame
              </div>
              <h2 className="font-editorial text-4xl md:text-5xl font-bold text-[#0b2416] leading-[0.95]">
                The <span className="italic text-amber-700">lucky ones.</span>
              </h2>
              <p className="text-stone-600 mt-4">Customers whose orders came with a little extra magic. Will your name be next?</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {winners.map((w) => (
                <div key={w.id} className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-slate-100 border-4 border-amber-400 mb-3">
                    {w.photo ? <img src={w.photo} alt={w.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🏆</div>}
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{w.name}</h4>
                  <p className="text-xs text-blue-600 mt-1">{w.prize}</p>
                  <p className="text-xs text-slate-400">{w.event}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {settings.theme_logo ? (
                  <img src={settings.theme_logo} alt="Logo" style={{ width: settings.theme_logo_width ? `${Math.min(parseInt(settings.theme_logo_width), 150)}px` : '32px' }} className="object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">K</div>
                )}
                <span className="font-bold text-white text-lg">Kerala Super Store</span>
              </div>
              <p className="text-sm text-slate-400">Your trusted South Indian grocery store in the UK. Authentic Kerala products delivered to your doorstep.</p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                <a href={whatsappLink} target="_blank" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-green-600 transition"><Phone className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {["Home","Products","About Us","Contact"].map((l) => (
                  <li key={l}><a href={`#${l.toLowerCase().replace(" ","")}`} className="hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
                {categories.slice(0,4).map((c) => (
                  <li key={c.id}><a href="#products" className="hover:text-white transition">{c.name}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact Info</h4>
              <ul className="space-y-2 text-sm">
                <li><a href={settings.store_map_link || "https://www.google.com/maps/search/Kerala+superstore+ltd+Old+Market+Street+M98DX+Manchester"} target="_blank" className="hover:text-white transition">📍 {settings.store_address || "Old Market Street, M98DX, Manchester"}</a></li>
                <li><a href={`tel:${(settings.store_phone || "+447749132122").replace(/ /g, '')}`} className="hover:text-white transition">📞 {settings.store_phone || "+44 7749 132122"}</a></li>
                <li><a href={whatsappLink} target="_blank" className="hover:text-white transition">💬 {settings.store_whatsapp || "+44 7749 132122"}</a></li>
                <li>✉️ {settings.store_email || "info@keralasuperstore.co.uk"}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>© 2026 Kerala Super Store. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <a href={whatsappLink} target="_blank" className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition z-40">
        <Phone className="w-7 h-7" />
      </a>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your Cart</h3>
              <button onClick={() => setCartOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                    <div className="w-14 h-14 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.item?.images?.[0] ? <img src={item.item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {item.item?.name} {item.variantName ? `(${item.variantName})` : ""}{item.variantSize ? ` - Size: ${item.variantSize}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">£{item.item?.price}</p>
                    </div>
                    <div className="flex items-center border border-slate-300 rounded-lg">
                      <button onClick={() => updateCartQty(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-slate-100 text-sm">-</button>
                      <span className="px-2 text-sm">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-slate-100 text-sm">+</button>
                    </div>
                    <button onClick={() => removeCartItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold">£{cartTotal.toFixed(2)}</span>
                </div>
                <button
                   type="button"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                   className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                 >
                   <Phone className="w-4 h-4" /> Proceed to Checkout
                  </button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCheckoutOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {orderPlaced ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed!</h2>
                <p className="text-slate-600 mb-2">Your order number is <span className="font-bold">{orderNumber}</span></p>
                <p className="text-slate-500 mb-6">We will contact you soon for Cash on Delivery confirmation.</p>
                <button onClick={() => { setOrderPlaced(false); setCheckoutOpen(false); }} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Continue Shopping</button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Checkout</h3>
                  <button onClick={() => setCheckoutOpen(false)}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label><input required value={checkoutForm.name} onChange={(e) => setCheckoutForm({...checkoutForm,name:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label><input required type="tel" value={checkoutForm.phone} onChange={(e) => setCheckoutForm({...checkoutForm,phone:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address *</label><textarea required value={checkoutForm.address} onChange={(e) => setCheckoutForm({...checkoutForm,address:e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Postcode *</label><input required value={checkoutForm.postcode} onChange={(e) => setCheckoutForm({...checkoutForm,postcode:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Order Notes</label><textarea value={checkoutForm.notes} onChange={(e) => setCheckoutForm({...checkoutForm,notes:e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-medium text-slate-900 mb-2">Order Summary</p>
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <span>{item.item?.name} x{item.quantity}</span>
                        <span>£{(parseFloat(item.item?.price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>£{cartTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">💰 Payment: Cash on Delivery</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const custName = checkoutForm.name?.trim();
                      const custPhone = checkoutForm.phone?.trim();
                      const custAddress = checkoutForm.address?.trim();
                      const custPostcode = checkoutForm.postcode?.trim();
                      const custNotes = checkoutForm.notes?.trim();

                      if (!custName) return alert("⚠️ Please enter your full name");
                      if (!custPhone) return alert("⚠️ Please enter your phone number");
                      if (!custAddress) return alert("⚠️ Please enter your delivery address");
                      const itemsMsg = cart
                        .map((item, idx) => {
                          const name = item.item?.name ?? '';
                          const img = item.item?.images?.[0] || '';
                          const clr = item.variantName || '-';
                          const sz = item.variantSize || '-';
                          const qty = item.quantity;
                          const price = item.item?.price ?? '0';
                          return `[${idx + 1}] ${name}%0A     Colour: ${clr} | Size: ${sz} | Qty: ${qty}%0A     Price: £${price}%0A     Image: ${img}`;
                        })
                        .join('%0A');
                      const msg = `--- NEW ORDER ---%0A%0A*CUSTOMER*%0AName: ${custName}%0APhone: ${custPhone}%0AAddress: ${custAddress}${custPostcode ? `%0APostcode: ${custPostcode}` : ''}${custNotes ? `%0ANotes: ${custNotes}` : ''}%0A%0A*ITEMS*%0A${itemsMsg}%0A%0A*TOTAL: £${cartTotal.toFixed(2)}*`;
                      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Order via WhatsApp (All Items)
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product / Dress Detail Modal (Exact layout as uploaded image) */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailProduct(null)} />
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 p-4 md:p-8">
            <button onClick={() => setDetailProduct(null)} className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Vertical Thumbnail Gallery */}
              <div className="md:col-span-2 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[450px] pb-2 scrollbar-hide order-2 md:order-1">
                {getProductThumbnails(detailProduct).map((thumb, idx) => {
                  const isSelected = selectedImage === thumb.url;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(thumb.url);
                        if (thumb.color) setSelectedColor(thumb.color);
                      }}
                      className={`relative w-16 md:w-full h-auto rounded-xl overflow-hidden border-2 transition ${
                        isSelected ? "border-blue-600 ring-2 ring-blue-600/30 scale-105" : "border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={thumb.url} alt={thumb.color || ""} className="w-full h-auto object-contain" />
                      {thumb.color && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-mono text-center truncate py-0.5 px-1">
                          {thumb.color}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Center Column: Big Main Image Preview with Zoom */}
              <div className="md:col-span-5 aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 relative order-1 md:order-2 shadow-sm cursor-pointer" onClick={() => setZoomOpen(true)}>
                {selectedImage ? (
                  <img src={selectedImage} alt={detailProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">👗</div>
                )}
                {selectedColor && (
                  <span className="absolute bottom-3 left-3 bg-black/75 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur-sm">
                    Color: {selectedColor}
                  </span>
                )}
              </div>

              {/* Zoom Overlay */}
              {zoomOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setZoomOpen(false)}>
                  <img src={selectedImage} alt={detailProduct.name} className="max-w-full max-h-full object-contain" />
                </div>
              )}

              {/* Right Column: Product Specs & Purchase Box */}
              <div className="md:col-span-5 space-y-4 order-3">
                <div>
                  <h2 className="font-editorial text-3xl font-bold text-stone-900 leading-tight">
                    {detailProduct.name}
                  </h2>
                  <div className="text-xs font-mono text-stone-400 mt-1 uppercase tracking-wider">
                    {detailProduct.type || "Traditional"}
                  </div>
                </div>

                {/* Important Color Warning Box (Exact as Image) */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                    <span className="text-amber-600">⚠️</span> Important:
                  </div>
                  <p className="text-xs leading-relaxed text-amber-900/90 font-medium">
                    The <strong className="text-stone-900">colour you buy</strong> will be the <strong className="text-stone-900">image you select</strong> from the thumbnails. Please choose the exact colour image, then click <strong className="text-amber-950">ADD TO BAG</strong> or <strong className="text-amber-950">BUY NOW</strong>.
                  </p>
                  {selectedColor && (
                    <div className="text-xs font-bold text-blue-600 pt-1 font-mono">
                      Selected Colour: <span className="underline">{selectedColor}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="font-editorial text-3xl font-bold text-stone-900">
                    £{detailProduct.price}
                  </span>
                  {detailProduct.compareAtPrice && (
                    <span className="text-base text-stone-400 line-through">
                      £{detailProduct.compareAtPrice}
                    </span>
                  )}
                </div>

                {/* Material tag */}
                <div className="flex items-center gap-2">
                  <span className="bg-stone-100 text-stone-600 border border-stone-200 text-xs px-3 py-1 rounded-lg font-medium">
                    cotton
                  </span>
                </div>

                {/* Available Sizes */}
                {parseSizes(detailProduct.sizes).length > 0 && (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 mb-2">Available Sizes:</label>
                    <div className="flex flex-wrap gap-2">
                      {parseSizes(detailProduct.sizes).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition ${
                            selectedSize === size
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-stone-100 text-stone-700 border-stone-200 hover:border-blue-400"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock info */}
                <div className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                  Only {detailProduct.stock || 4} left in stock!
                </div>

                {/* Quantity selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">Quantity:</label>
                  <div className="inline-flex items-center border border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                    <button type="button" onClick={() => setDetailQty((q) => Math.max(1, q - 1))} className="px-3.5 py-2 hover:bg-stone-200 font-bold text-stone-700 transition">-</button>
                    <span className="px-4 py-2 text-sm font-semibold min-w-[40px] text-center bg-white">{detailQty}</span>
                    <button type="button" onClick={() => setDetailQty((q) => q + 1)} className="px-3.5 py-2 hover:bg-stone-200 font-bold text-stone-700 transition">+</button>
                  </div>
                </div>

                {/* Action Buttons (ADD TO BAG / PRE-ORDER → both go to cart) */}
                <div className="space-y-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (parseSizes(detailProduct.sizes).length > 0 && !selectedSize) {
                        return alert("⚠️ Please select a size before adding to bag");
                      }
                      addToCart(detailProduct.id, `${detailProduct.name} (${selectedColor || 'Default'})`, detailProduct.price, detailQty, detailProduct.isDress ? "dress" : "item", selectedColor, selectedSize);
                      setDetailProduct(null);
                    }}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg uppercase tracking-wider ${
                      isPreOrder(detailProduct)
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/25"
                        : "bg-[#fdd835] hover:bg-[#fbc02d] text-stone-900 shadow-amber-400/20"
                    }`}
                  >
                    {isPreOrder(detailProduct) ? (
                      <><Clock className="w-4 h-4" /> PRE-ORDER — ADD TO CART</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4" /> ADD TO BAG</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (parseSizes(detailProduct.sizes).length > 0 && !selectedSize) {
                        return alert("⚠️ Please select a size before ordering");
                      }
                      const prefix = isPreOrder(detailProduct) ? "PRE-ORDER" : "BUY NOW";
                      const name = detailProduct.name;
                      const img = selectedImage || detailProduct.images?.[0] || '';
                      const clr = selectedColor || '-';
                      const sz = selectedSize || '-';
                      const msg = `--- ${prefix} ---%0A%0A*Item:* ${name}%0A*Colour:* ${clr}%0A*Size:* ${sz}%0A*Qty:* ${detailQty}%0A*Price:* £${detailProduct.price}%0A*Image:* ${img}`;
                      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="w-full bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition uppercase tracking-wider"
                  >
                    ⚡ {isPreOrder(detailProduct) ? "WHATSAPP PRE-ORDER" : "BUY NOW VIA WHATSAPP"}
                  </button>
                </div>

                {/* Key Highlights */}
                <div className="pt-4 border-t border-stone-100 space-y-2">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-stone-900 font-mono">Key Highlights</h4>
                  <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                    <li>Authentic Traditional Kerala Weave</li>
                    <li>Soft, breathable cotton fabric</li>
                    <li>Fast UK Dispatch & Cash on Delivery</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
