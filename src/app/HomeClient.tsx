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
  promoBanners?: any[];
}


export default function HomeClient({ data }: { data: HomeData }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("kerala_user");
    if (u) try { setLoggedInUser(JSON.parse(u)); } catch {}
  }, []);
  const [cart, setCart] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [offerIndex, setOfferIndex] = useState(0);
  const [promoBannerIndex, setPromoBannerIndex] = useState(0);
  const [dressFilter, setDressFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", email: "", address: "", postcode: "", notes: "" });
const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (checkoutOpen && loggedInUser) {
      setCheckoutForm((prev) => ({
        ...prev,
        name: loggedInUser.name || prev.name,
        phone: loggedInUser.phone || prev.phone,
        email: loggedInUser.email || prev.email,
        address: loggedInUser.address || prev.address,
        postcode: loggedInUser.postcode || prev.postcode,
      }));
    }
  }, [checkoutOpen, loggedInUser]);

  // Product detail modal state (Shopify style color thumbnail viewer)
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [detailQty, setDetailQty] = useState<number>(1);
  const [zoomOpen, setZoomOpen] = useState<boolean>(false);
  const [promoSelectedSize, setPromoSelectedSize] = useState<Record<number, string>>({});
  const [promoSelectedColor, setPromoSelectedColor] = useState<Record<number, string>>({});
  const [detailSelectedVariant, setDetailSelectedVariant] = useState<any>(null);



  function getFirstImage(item: any): string | null {
    if (!item) return null;
    const raw = item.images ?? item.image ?? null;
    if (Array.isArray(raw)) return raw[0] || null;
    if (typeof raw === "string" && raw.length > 0) {
      if (raw.startsWith("http") || raw.startsWith("/")) return raw;
      const pgMatch = raw.match(/^\{(.+)\}$/);
      if (pgMatch) return pgMatch[1].split(",")[0]?.trim() || null;
      try { const p = JSON.parse(raw); if (Array.isArray(p)) return p[0] || null; } catch {}
    }
    return null;
  }

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

  function getSizePrice(dress: any, size: string): string | null {
    if (dress.sizePrices && dress.sizePrices[size]) {
      return dress.sizePrices[size];
    }
    return null;
  }

  function getPriceRange(dress: any): { min: number; max: number } | null {
    if (!dress.sizePrices || typeof dress.sizePrices !== "object") return null;
    const prices = Object.values(dress.sizePrices).map(Number).filter((p) => !isNaN(p));
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }

  function getEffectivePrice(dress: any, size: string): string {
    const sp = getSizePrice(dress, size);
    return sp || dress.price;
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
    const isDress = !!(prod.type && ['ladies','gents','kids','combo'].includes(prod.type));
    setDetailProduct({ ...prod, isDress });
    const thumbs = getProductThumbnails(prod);
    setSelectedImage(thumbs[0]?.url || prod.images?.[0] || "");
    setSelectedColor(thumbs[0]?.color || prod.colors?.[0] || "");
    setSelectedSize("");
    setDetailQty(1);
    const hasItemVariants = prod.variants && prod.variants.length > 0 && !isDress;
    setDetailSelectedVariant(hasItemVariants ? prod.variants[0] : null);
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

  const { slides, offers, dresses, categories, items, winners, settings, collections = [], promoBanners: allPromoBanners = [] } = data;
  const whatsappNumber = settings.whatsapp_number || "447749132122";

  const preOrderDeadline = settings.pre_order_deadline || "2026-08-05";
  const preOrderDate = new Date(preOrderDeadline + "T00:00:00");
  const preOrderMonthShort = preOrderDate.toLocaleDateString("en-US", { month: "short" });
  const preOrderDay = preOrderDate.getDate();
  const preOrderMonthFull = preOrderDate.toLocaleDateString("en-US", { month: "long" });
  const preOrderLabel = `${preOrderMonthShort} ${preOrderDay}`;
  const preOrderLabelFull = `${preOrderMonthFull} ${preOrderDay}`;
  const preOrderMsg = settings.pre_order_message || `Pre-order before ${preOrderLabelFull} for Onam delivery`;

  // Live viewers counter (ambient, purely decorative)
  const [viewers, setViewers] = useState(47);
  const [revealReady, setRevealReady] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCart();
    const params = new URLSearchParams(window.location.search);
    const collectionParam = params.get("collection");
    if (collectionParam) {
      setDressFilter(collectionParam);
      setTimeout(() => document.getElementById("dresses")?.scrollIntoView({ behavior: "smooth" }), 600);
    }
    const interval = setInterval(() => setHeroIndex((i) => (i + 1) % Math.max(slides.length, 1)), 5500);
    const offerInterval = setInterval(() => setOfferIndex((i) => (i + 1) % Math.max(offers.length, 1)), 2000);
    const promoInterval = setInterval(() => {
      setPromoBannerIndex((i) => (i + 1) % Math.max(allPromoBanners.length, 1));
    }, 4000);
    const viewerTick = setInterval(() => {
      setViewers((v) => {
        const next = v + Math.floor(Math.random() * 7) - 3;
        return Math.max(28, Math.min(96, next));
      });
    }, 4000);
    return () => { clearInterval(interval); clearInterval(offerInterval); clearInterval(promoInterval); clearInterval(viewerTick); };
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

  async function addToCart(itemId: number, name: string, price: string, quantity = 1, itemType = "item", variantName: string | null = null, variantSize: string | null = null, variantId: number | null = null) {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity, itemType, variantName, variantSize, variantId }),
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

  function shareOnWhatsApp(name: string, price: string | undefined, slug?: string) {
    const url = slug ? `${window.location.origin}/product/${slug}` : window.location.href;
    const text = price
      ? `Check out ${name} (£${price}) on Kerala Super Store!`
      : `Check out ${name} on Kerala Super Store!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
  }

  function shareCollection(collectionName: string, collectionType: string) {
    const url = `${window.location.origin}?collection=${collectionType}`;
    const text = `🛍️ ${collectionName} Collection — Kerala Super Store\n\nBrowse our ${collectionName} collection for Onam 2026!\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function getTypeDisplayName(type: string): string {
    const map: Record<string, string> = {
      "all": "All",
      "ladies": "Ladies",
      "gents": "Gents",
      "kids": "Kids",
      "kids-boys": "Kids Boys",
      "kids-girls": "Kids Girls",
      "combo": "Combo",
    };
    return map[type] || type;
  }

  function isPreOrderCategory(categoryId?: number) {
    if (!categoryId) return false;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return false;
    const col = collections.find((col) => col.id === cat.collectionId);
    return col?.orderType === "pre_order";
  }

  function getCartUnitPrice(cartItem: any): string {
    const variantPrice = cartItem.variant?.price;
    const sizeKey = cartItem.variantSize || cartItem.variant?.size || null;
    const sizePrice = sizeKey && cartItem.item?.sizePrices?.[sizeKey] ? cartItem.item.sizePrices[sizeKey] : null;
    return variantPrice || sizePrice || cartItem.item?.price || "0";
  }

  const cartTotal = cart.reduce((sum, item) => {
    return sum + parseFloat(getCartUnitPrice(item)) * item.quantity;
  }, 0);

  const filteredDresses = dresses.filter((d) => {
    if (d.type === "fresh_pookkal") return false;
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
    if (cart.length === 0) {
      alert("Cart is empty! Please add items before placing order.");
      return;
    }
    if (checkoutLoading) return;
    
    // Validate required fields
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.postcode) {
      alert("Please fill all required fields: Name, Phone, Address, Postcode");
      return;
    }
    
    setCheckoutLoading(true);
    try {
      const cartData = cart.map((item) => {
        const sizeKey = item.variantSize || item.variant?.size || null;
        const unitPrice = getCartUnitPrice(item);
        return {
          itemId: item.itemId,
          variantId: item.variantId,
          name: item.item?.name,
          variantName: item.variant ? `${item.variant.color || ""} ${item.variant.size || ""}`.trim() : null,
          color: item.variant?.color || item.variantName || null,
          size: sizeKey,
          quantity: item.quantity,
          price: unitPrice,
          imageUrl: getFirstImage(item.item) || item.variant?.images?.[0] || item.item?.image || null,
        };
      });
      console.log("Submitting order:", { checkoutForm, cartData, cartTotal });
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...checkoutForm, customerName: checkoutForm.name, customerPhone: checkoutForm.phone, customerEmail: checkoutForm.email, totalAmount: cartTotal.toFixed(2), paymentMethod: "cod", items: cartData }),
      });
      const data = await res.json();
      console.log("Order response:", data);
      if (!res.ok) {
        alert(data.error || "Order failed: " + JSON.stringify(data));
        return;
      }
      if (data.orderNumber) {
        setOrderNumber(data.orderNumber);
        setOrderPlaced(true);
        for (const item of cart) {
          await fetch(`/api/cart?id=${item.id}`, { method: "DELETE" });
        }
        fetchCart();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert("Order failed: " + msg);
      console.error("Order error:", err);
    } finally {
      setCheckoutLoading(false);
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
              <Link href={loggedInUser ? "/account" : "/login"} className="hidden md:flex items-center gap-1 text-sm text-stone-600 font-medium hover:text-emerald-700">
                {loggedInUser ? "My Account" : "Login"}
              </Link>
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
        <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 relative">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none ml-2 w-full text-sm" />
          {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-slate-400" /></button>}
          {searchQuery.trim() && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSearchQuery("")} />
              <div className="absolute top-12 left-0 right-0 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 p-3 max-h-80 overflow-y-auto space-y-2 text-left">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-stone-500 px-2 font-bold border-b border-stone-100 pb-2">
                  <span>Found {searchMatches.length} matching item(s)</span>
                  <button onClick={() => setSearchQuery("")} className="text-stone-400 hover:text-stone-600">Close</button>
                </div>
                {searchMatches.length > 0 ? (
                  <div className="divide-y divide-stone-100">
                    {searchMatches.slice(0, 6).map((match: any) => (
                      <div key={`${match.isDress ? "dress" : "item"}-${match.id}`} onClick={() => { openDetailModal(match); if (match.categoryId) setCatFilter(String(match.categoryId)); const el = match.isDress ? document.querySelector("#dresses") : document.querySelector("#products"); if (el) el.scrollIntoView({ behavior: "smooth" }); setSearchQuery(""); }} className="flex items-center justify-between p-2 hover:bg-emerald-50/60 rounded-xl cursor-pointer transition group">
                        <div className="flex items-center gap-3">
                          {match.images && match.images[0] ? <img src={match.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0" /> : <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-xs text-stone-400 shrink-0">{match.isDress ? "👗" : "📦"}</div>}
                          <div>
                            <div className="font-bold text-stone-900 text-xs group-hover:text-emerald-800 transition">{match.name}</div>
                            <div className="text-[10px] text-stone-500">{match.isDress ? `👗 ${match.type || ""}` : "🛒 Grocery"}</div>
                          </div>
                        </div>
                        <div className="font-bold text-stone-900 text-xs">£{match.price}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-stone-500">No matching products found for "{searchQuery}".</div>
                )}
                {searchMatches.length > 0 && (
                  <button onClick={() => { const el = document.querySelector("#dresses") || document.querySelector("#products"); if (el) el.scrollIntoView({ behavior: "smooth" }); setSearchQuery(""); }} className="w-full text-center py-2 bg-[#0b2416] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition mt-2 shadow-sm">View all matching products below ↓</button>
                )}
              </div>
            </>
          )}
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
      <section id="home" className="relative overflow-hidden h-[520px] sm:h-[560px] md:h-[620px] lg:h-[640px] flex items-center bg-[#0b2416] text-white">
        {/* Full-width Background Hero Images */}
        {heroSlides.map((slide, i) => (
          <div
            key={slide.id || i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === heroIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
          >
            {slide.image ? (
              <img src={slide.image} alt={slide.title || ""} className="w-full h-full object-cover object-center" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-forest-900 to-amber-950" />
            )}
            {/* Lighter left overlay - image visible, text still readable */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.65) 25%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.10) 75%, rgba(0,0,0,0.05) 100%)' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />
          </div>
        ))}

        {/* Hero Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
          <div className="max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              {(heroSlides[heroIndex]?.badgeText || settings.hero_badge_text) && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-amber-300 bg-amber-500/20 border border-amber-400/30 rounded-full px-3 py-1.5 backdrop-blur-sm font-semibold">
                <Sparkles className="w-3 h-3 text-amber-400" /> {heroSlides[heroIndex]?.badgeText || settings.hero_badge_text || "Authentic Kerala Store · UK Delivery"}
              </span>
              )}
              {settings.hero_viewers_text !== "" && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1.5 backdrop-blur-sm font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                {settings.hero_viewers_text || `${viewers} shopping now`}
              </span>
              )}
            </div>

            {/* Title */}
            <h1 
              style={{ 
                color: heroSlides[heroIndex]?.titleColor || "#ffffff",
                fontSize: heroSlides[heroIndex]?.titleSize ? `${heroSlides[heroIndex].titleSize}px` : undefined,
                fontFamily: heroSlides[heroIndex]?.titleFont || undefined,
              }}
              className="font-editorial font-bold leading-[1.05] tracking-tight drop-shadow-lg text-[clamp(32px,5.5vw,68px)]"
            >
              {heroSlides[heroIndex]?.title || "Grand Onam & Kerala Festive Collection 2026"}
            </h1>

            {/* Subtitle */}
            <p 
              style={{ 
                color: heroSlides[heroIndex]?.subtitleColor || "#ffffffcc",
                fontSize: heroSlides[heroIndex]?.subtitleSize ? `${heroSlides[heroIndex].subtitleSize}px` : undefined,
                fontFamily: heroSlides[heroIndex]?.subtitleFont || undefined,
              }}
              className="mt-4 max-w-xl leading-relaxed font-light drop-shadow-sm text-[clamp(13px,2vw,18px)] opacity-90"
            >
              {heroSlides[heroIndex]?.subtitle || "Authentic Kasavu sarees, shirts, kids attire & traditional Kerala groceries delivered straight to your doorstep across the UK."}
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap gap-3 items-center">
              <button
                onClick={() => handleExploreSlide(heroSlides[heroIndex])}
                style={{ 
                  backgroundColor: heroSlides[heroIndex]?.btnBgColor || "#f59e0b",
                  color: heroSlides[heroIndex]?.btnTextColor || "#1c1917"
                }}
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all shadow-xl hover:scale-105 hover:shadow-2xl cursor-pointer"
              >
                {heroSlides[heroIndex]?.buttonText || "Explore Collection"}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={whatsappOrderLink}
                target="_blank"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 text-white px-6 py-3.5 rounded-full font-semibold text-sm sm:text-base transition hover:scale-105"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                WhatsApp Order
              </a>
            </div>

            {/* Trust strip */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] sm:text-xs text-emerald-100/80 font-medium pt-4 border-t border-white/10">
              {(settings.hero_trust_1 || "Free UK delivery over £30") && <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-amber-400" /> {settings.hero_trust_1 || "Free UK delivery over £30"}</div>}
              {(settings.hero_trust_2 || "Cash on Delivery Available") && <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-400" /> {settings.hero_trust_2 || "Cash on Delivery Available"}</div>}
              {(settings.hero_trust_3 || "100% Authentic Products") && <div className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-amber-400" /> {settings.hero_trust_3 || "100% Authentic Products"}</div>}
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
              {(settings.marquee_1 || "🚚 Free Delivery on orders over £30") && <span>{settings.marquee_1 || "🚚 Free Delivery on orders over £30"}</span>}
              {(settings.marquee_2 || "🔥 Special Offers Available") && <span>{settings.marquee_2 || "🔥 Special Offers Available"}</span>}
              {(settings.marquee_3 || "📱 Order via WhatsApp: +44 7749 132122") && <span>{settings.marquee_3 || "📱 Order via WhatsApp: +44 7749 132122"}</span>}
              {(settings.marquee_4 || "🌿 Fresh Products Daily") && <span>{settings.marquee_4 || "🌿 Fresh Products Daily"}</span>}
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

      {/* Promo Banners Auto-Slide Carousel */}
      {allPromoBanners.length > 0 ? (
        <section id="promo-banner" className="relative overflow-hidden bg-stone-900">
          <div className="relative h-[200px] sm:h-[280px] md:h-[400px]">
            {allPromoBanners.map((banner, i) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === promoBannerIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              >
                <a href={banner.link || "#dresses"} className="block w-full h-full">
                  {/* Desktop image (hidden on mobile) */}
                  <img src={banner.image} alt="" className="hidden md:block w-full h-full object-cover object-center" />
                  {/* Mobile image if available, otherwise fallback to desktop image */}
                  <img src={banner.mobileImage || banner.image} alt="" className="block md:hidden w-full h-full object-cover object-center" />
                </a>
              </div>
            ))}
          </div>
          {allPromoBanners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {allPromoBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPromoBannerIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === promoBannerIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          )}
        </section>
      ) : settings.promo_banner_active !== "false" && (settings.promo_banner_tag || settings.promo_banner_title || settings.promo_banner_image) ? (
        <section id="promo-banner" className="relative overflow-hidden">
          <div className="relative h-[200px] sm:h-[280px] md:h-[400px]">
            <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${settings.promo_banner_color1 || '#f97316'}, ${settings.promo_banner_color2 || '#fbbf24'}, ${settings.promo_banner_color3 || '#eab308'})` }} />
            {settings.promo_banner_image && (
              <img src={settings.promo_banner_image} alt="Promo Banner" className="absolute inset-0 w-full h-full object-cover object-center" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative max-w-7xl mx-auto px-4 text-center">
                {settings.promo_banner_tag && (
                  <span style={{ color: settings.promo_banner_tag_color || "#ffffff" }} className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-medium mb-4">{settings.promo_banner_tag}</span>
                )}
                {settings.promo_banner_title && (
                  <h2 style={{ color: settings.promo_banner_title_color || "#ffffff" }} className="text-3xl md:text-5xl font-bold mb-4">{settings.promo_banner_title}</h2>
                )}
                {settings.promo_banner_subtitle && (
                  <p style={{ color: settings.promo_banner_subtitle_color || "#ffffffcc" }} className="text-base md:text-lg max-w-2xl mx-auto mb-6">{settings.promo_banner_subtitle}</p>
                )}
                {settings.promo_banner_btn_text && (
                  <a href={settings.promo_banner_btn_link || "#dresses"} style={{ backgroundColor: settings.promo_banner_btn_color || "#f97316", color: settings.promo_banner_btn_text_color || "#ffffff" }} className="inline-block px-8 py-3 rounded-lg font-bold hover:opacity-90 transition">{settings.promo_banner_btn_text}</a>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Shop by Collection */}
      {dresses.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-amber-50/60 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-amber-700/80 mb-3">
                <span className="w-8 h-px bg-amber-700/40" /> Onam 2026 <span className="w-8 h-px bg-amber-700/40" />
              </div>
              <h2 className="font-editorial text-4xl md:text-5xl font-bold text-[#0b2416] leading-[0.95]">
                Shop by <span className="italic text-amber-700">Collection.</span>
              </h2>
              <p className="text-stone-600 mt-4">Choose your festive look — curated collections for the whole family.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { type: "ladies", name: "Ladies Kasavu", emoji: "👩", desc: "Sarees & Set Mundu", bg: "bg-rose-50", border: "border-rose-200", hover: "hover:bg-rose-100", iconBg: "bg-rose-100", iconText: "text-rose-600" },
                { type: "gents", name: "Gents Jubba", emoji: "👨", desc: "Shirt & Kasavu Mundu", bg: "bg-blue-50", border: "border-blue-200", hover: "hover:bg-blue-100", iconBg: "bg-blue-100", iconText: "text-blue-600" },
                { type: "kids-boys", name: "Kids Boys", emoji: "👦", desc: "Boys Festival Attire", bg: "bg-sky-50", border: "border-sky-200", hover: "hover:bg-sky-100", iconBg: "bg-sky-100", iconText: "text-sky-600" },
                { type: "kids-girls", name: "Kids Girls", emoji: "👧", desc: "Girls Festival Attire", bg: "bg-pink-50", border: "border-pink-200", hover: "hover:bg-pink-100", iconBg: "bg-pink-100", iconText: "text-pink-600", preOrder: `Pre-order before ${preOrderLabel}` },
                { type: "combo", name: "Family Combo", emoji: "👪", desc: "Complete Family Sets", bg: "bg-amber-50", border: "border-amber-200", hover: "hover:bg-amber-100", iconBg: "bg-amber-100", iconText: "text-amber-600" },
              ].map((col) => {
                const count = dresses.filter((d) => d.type === col.type).length;
                return (
                  <div
                    key={col.type}
                    className={`${col.bg} ${col.border} ${col.hover} border-2 rounded-2xl p-5 text-center cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group`}
                    onClick={() => { setDressFilter(col.type); document.getElementById("dresses")?.scrollIntoView({ behavior: "smooth" }); }}
                  >
                    <div className={`w-16 h-16 mx-auto ${col.iconBg} rounded-full flex items-center justify-center text-3xl mb-3 ${col.iconText} group-hover:scale-110 transition-transform`}>
                      {col.emoji}
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm">{col.name}</h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">{col.desc}</p>
                    <p className="text-[10px] font-mono text-stone-400 mt-1">{count} items</p>
                    {col.preOrder && <p className="text-[8px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 mt-1 inline-block">⏰ {col.preOrder}</p>}
                    <div className="flex gap-1.5 mt-3 justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDressFilter(col.type); document.getElementById("dresses")?.scrollIntoView({ behavior: "smooth" }); }}
                        className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold py-2 rounded-xl transition"
                      >
                        Explore →
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); shareCollection(col.name, col.type); }}
                        className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition"
                        title={`Share ${col.name} on WhatsApp`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
              {["all","ladies","gents","kids","kids-boys","kids-girls","combo"].map((type) => (
                <button key={type} onClick={() => setDressFilter(type)} className={`px-5 py-2 rounded-full text-sm font-medium transition ${dressFilter === type ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {getTypeDisplayName(type)}
                </button>
              ))}
            </div>
            {(dressFilter === "kids-girls" || dressFilter === "kids-boys" || dressFilter === "kids") && (
              <div className="mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-900">
                <span className="text-lg">⏰</span>
                <div>
                  <p className="font-bold text-sm">{preOrderMsg}</p>
                  <p className="text-[11px] text-amber-700/70">Order now to guarantee arrival before Thiruvonam</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDresses.map((dress) => (
                <div key={dress.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer" onClick={() => openDetailModal(dress)}>
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                    {dress.images?.[0] ? <img src={dress.images[0]} alt={dress.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-4xl">👗</div>}
                    {(dress.type === "kids" || dress.type === "kids-boys" || dress.type === "kids-girls") && (
                      <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-md leading-tight text-center">
                        ⏰ Pre-order before<br />{preOrderLabel}
                      </span>
                    )}
                    {dress.colorVariants?.length > 0 && (
                      <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {dress.colorVariants.length} colors
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition">{dress.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const range = getPriceRange(dress);
                        if (range && range.min !== range.max) {
                          return <span className="font-bold text-slate-900">£{range.min.toFixed(2)} – £{range.max.toFixed(2)}</span>;
                        }
                        return <span className="font-bold text-slate-900">£{dress.price}</span>;
                      })()}
                      {dress.compareAtPrice && <span className="text-sm text-slate-400 line-through">£{dress.compareAtPrice}</span>}
                    </div>
                    {parseSizes(dress.sizes).length > 0 && <p className="text-xs text-slate-500 mt-1">Sizes: {parseSizes(dress.sizes).join(", ")}</p>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openDetailModal(dress); }} className="flex-1 bg-[#fdd835] hover:bg-[#fbc02d] text-stone-900 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider">
                        Add to Cart
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(dress.name, dress.price, dress.slug); }} className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition shadow-sm" title="Share on WhatsApp">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Onam Sadhya — Pre-Order Section */}
      {(() => {
        const sadhyaCat = categories.find((c) => c.name?.toLowerCase().includes("sadhya"));
        const sadhyaItems = sadhyaCat ? items.filter((i) => i.categoryId === sadhyaCat.id) : [];
        return (
          <section id="onam-sadhya" className="py-16 bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 mb-10 shadow-xl min-h-[200px] md:min-h-[300px]">
                {settings.onam_sadhya_banner_image && (
                  <img src={settings.onam_sadhya_banner_image} alt="" className="hidden md:block absolute inset-0 w-full h-full object-cover" />
                )}
                {settings.onam_sadhya_banner_mobile_image ? (
                  <img src={settings.onam_sadhya_banner_mobile_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
                ) : settings.onam_sadhya_banner_image ? (
                  <img src={settings.onam_sadhya_banner_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/70 via-amber-800/50 to-transparent" />
                <div className="relative px-6 py-12 md:px-12 md:py-16 text-center text-white">
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-amber-200 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                    🍛 Onam 2026
                  </div>
                  <h2 className="font-editorial text-4xl md:text-6xl font-bold leading-[0.95] mb-3">
                    Onam <span className="italic text-amber-200">Sadhya.</span>
                  </h2>
                  <p className="text-amber-50/90 text-base md:text-lg max-w-2xl mx-auto mb-6">
                    Pre-order your traditional Onam feast — banana chips, sambar powder, payasam mix & more.
                    Freshly packed & delivered before Thiruvonam.
                  </p>
                  <a
                    href={sadhyaItems.length > 0 ? `#cat-${sadhyaCat.id}` : "#products"}
                    className="inline-flex items-center gap-2 bg-white text-amber-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-amber-50 transition shadow-lg"
                  >
                    {sadhyaItems.length > 0 ? `Shop Sadhya (${sadhyaItems.length} items) →` : "Browse Sadhya Items →"}
                  </a>
                  <button
                    onClick={() => shareCollection("Onam Sadhya", "onam-sadhya")}
                    className="ml-3 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-5 py-3.5 rounded-full font-bold text-sm transition"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              {sadhyaItems.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {sadhyaItems.slice(0, 8).map((item, idx) => {
                    const discountPct = item.compareAtPrice ? Math.round((1 - parseFloat(item.price) / parseFloat(item.compareAtPrice)) * 100) : 0;
                    return (
                      <div key={item.id} className="reveal group bg-white rounded-2xl border border-amber-200/60 overflow-hidden hover:border-amber-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                        <div className="aspect-square bg-amber-50/50 relative overflow-hidden cursor-pointer" onClick={() => openDetailModal(item)}>
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">🍛</div>
                          )}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {discountPct > 0 && <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">-{discountPct}%</div>}
                            <div className="bg-amber-700 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1"><Clock className="w-3 h-3" /> Pre-Order</div>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">Quick View</span>
                          </div>
                        </div>
                        <div className="p-4 cursor-pointer" onClick={() => openDetailModal(item)}>
                          <h3 className="font-semibold text-stone-900 text-sm line-clamp-2">{item.name}</h3>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-bold text-stone-900">£{item.price}</span>
                            {item.compareAtPrice && <span className="text-xs text-stone-400 line-through">£{item.compareAtPrice}</span>}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={(e) => { e.stopPropagation(); addToCart(item.id, item.name, item.price, 1, "item"); }} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">Pre-Order</button>
                            <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(item.name, item.price, item.slug); }} className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition" title="Share"><Share2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {sadhyaItems.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">🍌</div>
                  <p className="text-stone-600 font-medium">Onam Sadhya items coming soon!</p>
                  <p className="text-sm text-stone-400 mt-1">Click the button above to browse all our products or check back later.</p>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Pookkalam Promo Section */}
      {(() => {
        const catId = settings.pookkalam_category_id;
        const dressTypes = (settings.pookkalam_dress_types || "").split(",").filter(Boolean);
        let pookkalamProducts: any[] = [];
        if (catId) pookkalamProducts = [...pookkalamProducts, ...items.filter((i) => String(i.categoryId) === String(catId))];
        if (dressTypes.length > 0) pookkalamProducts = [...pookkalamProducts, ...dresses.filter((d) => dressTypes.includes(d.type))];
        const title = settings.pookkalam_title || "Onam Pookkalam";
        const desc = settings.pookkalam_description || "Celebrate the vibrant floral traditions of Onam with our curated Pookkalam collection.";
        const btnText = settings.pookkalam_btn_text || "Shop Pookkalam";
        const btnLink = settings.pookkalam_btn_link || "#products";
        const pookkalamAction = settings.pookkalam_button_action || "add_to_bag";
        const hasBanner = settings.pookkalam_banner_image;
        if (!hasBanner && pookkalamProducts.length === 0) return null;
        return (
          <section id="pookkalam" className="py-16 bg-gradient-to-b from-pink-50 via-rose-50/30 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-700 mb-10 shadow-xl min-h-[200px] md:min-h-[300px]">
                {settings.pookkalam_banner_image && (
                  <img src={settings.pookkalam_banner_image} alt="" className="hidden md:block absolute inset-0 w-full h-full object-cover" />
                )}
                {settings.pookkalam_banner_mobile_image ? (
                  <img src={settings.pookkalam_banner_mobile_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
                ) : settings.pookkalam_banner_image ? (
                  <img src={settings.pookkalam_banner_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-900/70 via-pink-800/50 to-transparent" />
                <div className="relative px-6 py-12 md:px-12 md:py-16 text-center text-white">
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-pink-200 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                    🌸 Onam 2026
                  </div>
                  <h2 className="font-editorial text-4xl md:text-6xl font-bold leading-[0.95] mb-3">
                    <span className="italic text-pink-200">{title}.</span>
                  </h2>
                  <p className="text-pink-50/90 text-base md:text-lg max-w-2xl mx-auto mb-6">{desc}</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <a href={btnLink} className="inline-flex items-center gap-2 bg-white text-pink-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-pink-50 transition shadow-lg">
                      {pookkalamProducts.length > 0 ? `${btnText} (${pookkalamProducts.length} items) →` : `${btnText} →`}
                    </a>
                    <button onClick={() => shareCollection(title, "pookkalam")} className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-5 py-3.5 rounded-full font-bold text-sm transition">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>
              </div>
              {pookkalamProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {pookkalamProducts.slice(0, 8).map((item, idx) => {
                    const discountPct = item.compareAtPrice ? Math.round((1 - parseFloat(item.price) / parseFloat(item.compareAtPrice)) * 100) : 0;
                    const hasVariants = item.variants && item.variants.length > 0;
                    const selectedSz = promoSelectedSize[item.id] || (hasVariants ? item.variants[0].size : "");
                    const variantData = hasVariants ? item.variants.find((v: any) => v.size === selectedSz) : null;
                    const displayPrice = variantData ? variantData.price : item.price;
                    const hasColorVariants = hasVariants && item.variants.some((v: any) => v.color && v.images && v.images[0]);
                    const activeColorVariant = hasColorVariants ? (item.variants.find((v: any) => v.size === selectedSz && v.color && v.images && v.images[0]) || null) : null;
                    const displayImage = activeColorVariant ? activeColorVariant.images[0] : (item.images?.[0] || null);
                    return (
                      <div key={item.id} className="reveal group bg-white rounded-2xl border border-pink-200/60 overflow-hidden hover:border-pink-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                        <div className="aspect-square bg-pink-50/50 relative overflow-hidden cursor-pointer" onClick={() => openDetailModal(item)}>
                          {displayImage ? (
                            <img src={displayImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
                          )}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {discountPct > 0 && <div className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">-{discountPct}%</div>}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">Quick View</span>
                          </div>
                        </div>
                        <div className="p-4 cursor-pointer" onClick={() => openDetailModal(item)}>
                          <h3 className="font-semibold text-stone-900 text-sm line-clamp-2">{item.name}</h3>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-bold text-stone-900">£{displayPrice}</span>
                            {item.compareAtPrice && <span className="text-xs text-stone-400 line-through">£{item.compareAtPrice}</span>}
                          </div>
                          {hasVariants && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {item.variants.map((v: any) => (
                                <button key={v.size} onClick={(e) => { e.stopPropagation(); setPromoSelectedSize((prev) => ({ ...prev, [item.id]: v.size })); }} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${selectedSz === v.size ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-stone-50 border-stone-200 text-stone-600 hover:border-amber-300"}`}>{v.size}</button>
                              ))}
                            </div>
                          )}
                          {hasColorVariants && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {item.variants.filter((v: any) => v.color && v.colorCode).reduce((acc: any[], v: any) => { if (!acc.find((a: any) => a.color === v.color)) acc.push(v); return acc; }, []).map((cv: any) => (
                                <button key={cv.color} onClick={(e) => { e.stopPropagation(); setPromoSelectedSize((prev) => ({ ...prev, [item.id]: cv.size })); }} title={cv.color} className={`w-5 h-5 rounded-full border-2 transition ${selectedSz === cv.size ? "border-pink-500 scale-125 shadow-md" : "border-stone-300 hover:scale-110"}`} style={{ backgroundColor: cv.colorCode }} />
                              ))}
                              {activeColorVariant?.color && <span className="text-[9px] text-stone-500 font-mono">{activeColorVariant.color}</span>}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            {(item.buttonAction === "pre_order" || item.buttonAction === "both") && (
                              <button onClick={(e) => { e.stopPropagation(); addToCart(item.id, item.name, displayPrice, 1, "item", null, selectedSz, variantData?.id || null); }} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">⏳ Pre-Order</button>
                            )}
                            {(item.buttonAction === "add_to_bag" || item.buttonAction === "both" || !item.buttonAction) && (
                              <button onClick={(e) => { e.stopPropagation(); addToCart(item.id, item.name, displayPrice, 1, "item", null, selectedSz, variantData?.id || null); }} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">Add to Cart</button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(item.name, displayPrice, item.slug); }} className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition" title="Share"><Share2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {pookkalamProducts.length === 0 && hasBanner && (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">🌸</div>
                  <p className="text-stone-600 font-medium">{title} items coming soon!</p>
                  <p className="text-sm text-stone-400 mt-1">Add products in Admin → Categories → link to this section.</p>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Onam Fresh Pookkal Promo Section */}
      {(() => {
        const catId = settings.fresh_pookkal_category_id;
        const freshDressTypes = (settings.fresh_pookkal_dress_types || "").split(",").filter(Boolean);
        let freshProducts: any[] = [];
        if (catId) freshProducts = [...freshProducts, ...items.filter((i) => String(i.categoryId) === String(catId))];
        if (freshDressTypes.length > 0) freshProducts = [...freshProducts, ...dresses.filter((d) => freshDressTypes.includes(d.type))];
        const title = settings.fresh_pookkal_title || "Onam Fresh Pookkal";
        const desc = settings.fresh_pookkal_description || "Fresh flowers and floral arrangements to bring the spirit of Onam to your home.";
        const btnText = settings.fresh_pookkal_btn_text || "Shop Fresh Pookkal";
        const btnLink = settings.fresh_pookkal_btn_link || "#products";
        const freshAction = settings.fresh_pookkal_button_action || "add_to_bag";
        const hasBanner = settings.fresh_pookkal_banner_image;
        if (!hasBanner && freshProducts.length === 0) return null;
        return (
          <section id="fresh-pookkal" className="py-16 bg-gradient-to-b from-emerald-50 via-green-50/30 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 mb-10 shadow-xl min-h-[200px] md:min-h-[300px]">
                {settings.fresh_pookkal_banner_image && (
                  <img src={settings.fresh_pookkal_banner_image} alt="" className="hidden md:block absolute inset-0 w-full h-full object-cover" />
                )}
                {settings.fresh_pookkal_banner_mobile_image ? (
                  <img src={settings.fresh_pookkal_banner_mobile_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
                ) : settings.fresh_pookkal_banner_image ? (
                  <img src={settings.fresh_pookkal_banner_image} alt="" className="block md:hidden absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 via-emerald-800/50 to-transparent" />
                <div className="relative px-6 py-12 md:px-12 md:py-16 text-center text-white">
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-200 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                    🌿 Onam 2026
                  </div>
                  <h2 className="font-editorial text-4xl md:text-6xl font-bold leading-[0.95] mb-3">
                    <span className="italic text-emerald-200">{title}.</span>
                  </h2>
                  <p className="text-emerald-50/90 text-base md:text-lg max-w-2xl mx-auto mb-6">{desc}</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <a href={btnLink} className="inline-flex items-center gap-2 bg-white text-emerald-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-emerald-50 transition shadow-lg">
                      {freshProducts.length > 0 ? `${btnText} (${freshProducts.length} items) →` : `${btnText} →`}
                    </a>
                    <button onClick={() => shareCollection(title, "fresh-pookkal")} className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-5 py-3.5 rounded-full font-bold text-sm transition">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>
              </div>
              {freshProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {freshProducts.slice(0, 8).map((item, idx) => {
                    const isDress = !!(item.type);
                    const discountPct = item.compareAtPrice ? Math.round((1 - parseFloat(item.price) / parseFloat(item.compareAtPrice)) * 100) : 0;
                    const dressSizes = isDress ? (item.sizes || []) : (item.variants ? item.variants.map((v: any) => v.size).filter((s: string, i: number, a: string[]) => a.indexOf(s) === i) : []);
                    const allSizes = isDress ? dressSizes : dressSizes;
                    const selectedSz = promoSelectedSize[item.id] || (allSizes[0] || "");
                    const displayPrice = isDress ? (item.sizePrices?.[selectedSz] || item.price) : ((item.variants && item.variants.find((v: any) => v.size === selectedSz))?.price || item.price);
                    const dressColors = isDress ? (item.colorVariants || []) : [];
                    const selectedCol = promoSelectedColor[item.id] || (dressColors.find((c: any) => c.isDefault)?.color || dressColors[0]?.color || "");
                    const activeColorVariant = isDress ? dressColors.find((c: any) => c.color === selectedCol) || null : (item.variants && item.variants.find((v: any) => v.size === selectedSz && v.color && v.images && v.images[0]) || null);
                    const displayImage = activeColorVariant?.image || activeColorVariant?.images?.[0] || item.images?.[0] || null;
                    const effAction = isDress ? (item.orderType || "add_to_bag") : (item.buttonAction || "add_to_bag");
                    return (
                      <div key={item.id} className="reveal group bg-white rounded-2xl border border-emerald-200/60 overflow-hidden hover:border-emerald-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                        <div className="aspect-square bg-emerald-50/50 relative overflow-hidden cursor-pointer" onClick={() => openDetailModal(item)}>
                          {displayImage ? (
                            <img src={displayImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">🌿</div>
                          )}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {discountPct > 0 && <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">-{discountPct}%</div>}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">Quick View</span>
                          </div>
                        </div>
                        <div className="p-4 cursor-pointer" onClick={() => openDetailModal(item)}>
                          <h3 className="font-semibold text-stone-900 text-sm line-clamp-2">{item.name}</h3>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-bold text-stone-900">£{displayPrice}</span>
                            {item.compareAtPrice && <span className="text-xs text-stone-400 line-through">£{item.compareAtPrice}</span>}
                          </div>
                          {allSizes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {allSizes.map((sz: string) => (
                                <button key={sz} onClick={(e) => { e.stopPropagation(); setPromoSelectedSize((prev) => ({ ...prev, [item.id]: sz })); }} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${selectedSz === sz ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-stone-50 border-stone-200 text-stone-600 hover:border-emerald-300"}`}>{sz}</button>
                              ))}
                            </div>
                          )}
                          {dressColors.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {dressColors.map((cv: any) => (
                                <button key={cv.color} onClick={(e) => { e.stopPropagation(); setPromoSelectedColor((prev) => ({ ...prev, [item.id]: cv.color })); }} title={cv.color} className={`w-5 h-5 rounded-full border-2 transition ${selectedCol === cv.color ? "border-emerald-500 scale-125 shadow-md" : "border-stone-300 hover:scale-110"}`} style={{ backgroundColor: cv.image ? undefined : "#ccc" }}>
                                  {cv.image && <img src={cv.image} alt="" className="w-full h-full rounded-full object-cover" />}
                                </button>
                              ))}
                              {activeColorVariant?.color && <span className="text-[9px] text-stone-500 font-mono">{activeColorVariant.color}</span>}
                            </div>
                          )}
                          {!isDress && item.variants && item.variants.filter((v: any) => v.color && v.colorCode).reduce((acc: any[], v: any) => { if (!acc.find((a: any) => a.color === v.color)) acc.push(v); return acc; }, []).length > 0 && !dressColors.length && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {item.variants.filter((v: any) => v.color && v.colorCode).reduce((acc: any[], v: any) => { if (!acc.find((a: any) => a.color === v.color)) acc.push(v); return acc; }, []).map((cv: any) => (
                                <button key={cv.color} onClick={(e) => { e.stopPropagation(); setPromoSelectedSize((prev) => ({ ...prev, [item.id]: cv.size })); }} title={cv.color} className={`w-5 h-5 rounded-full border-2 transition ${selectedSz === cv.size ? "border-emerald-500 scale-125 shadow-md" : "border-stone-300 hover:scale-110"}`} style={{ backgroundColor: cv.colorCode }} />
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            {(effAction === "pre_order" || effAction === "both") && (
                              <button onClick={(e) => { e.stopPropagation(); addToCart(item.id, item.name, displayPrice, 1, isDress ? "dress" : "item", activeColorVariant?.color || null, selectedSz, null); }} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">⏳ Pre-Order</button>
                            )}
                            {(effAction === "add_to_bag" || effAction === "both" || !effAction) && (
                              <button onClick={(e) => { e.stopPropagation(); addToCart(item.id, item.name, displayPrice, 1, isDress ? "dress" : "item", activeColorVariant?.color || null, selectedSz, null); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">Add to Cart</button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(item.name, displayPrice, item.slug); }} className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition" title="Share"><Share2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {freshProducts.length === 0 && hasBanner && (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">🌿</div>
                  <p className="text-stone-600 font-medium">{title} items coming soon!</p>
                  <p className="text-sm text-stone-400 mt-1">Add products in Admin → Categories → link to this section.</p>
                </div>
              )}
            </div>
          </section>
        );
      })()}

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
                      <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 relative overflow-hidden cursor-pointer" onClick={() => openDetailModal(item)}>
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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">Quick View</span>
                        </div>
                      </div>
                      <div className="p-4 cursor-pointer" onClick={() => openDetailModal(item)}>
                        <div className="flex items-center gap-1 text-amber-500 mb-1">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                          <span className="text-[10px] text-stone-400 font-mono ml-1">(4.7)</span>
                        </div>
                        <h3 className="font-display text-[15px] font-semibold text-[#0b2416] line-clamp-2 leading-snug">{item.name}</h3>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="font-display text-xl font-bold text-[#0b2416]">£{item.price}</span>
                          {item.compareAtPrice && <span className="text-xs text-stone-400 line-through">£{item.compareAtPrice}</span>}
                        </div>
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
                  <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 relative overflow-hidden cursor-pointer" onClick={() => openDetailModal(item)}>
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">Quick View</span>
                    </div>
                  </div>
                  <div className="p-4 cursor-pointer" onClick={() => openDetailModal(item)}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        <span className="text-[10px] text-stone-400 font-mono ml-1">({(4.5 + (idx % 3) * 0.1).toFixed(1)})</span>
                      </div>
                    </div>
                    <h3 className="font-display text-[15px] font-semibold text-[#0b2416] line-clamp-2 leading-snug">{item.name}</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-display text-xl font-bold text-[#0b2416]">£{item.price}</span>
                      {item.compareAtPrice && <span className="text-xs text-stone-400 line-through">£{item.compareAtPrice}</span>}
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
                      <p className="text-xs text-slate-500">£{getCartUnitPrice(item)}</p>
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
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Email (for order tracking)</label><input type="email" value={checkoutForm.email} onChange={(e) => setCheckoutForm({...checkoutForm,email:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address *</label><textarea required value={checkoutForm.address} onChange={(e) => setCheckoutForm({...checkoutForm,address:e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Postcode *</label><input required value={checkoutForm.postcode} onChange={(e) => setCheckoutForm({...checkoutForm,postcode:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Order Notes</label><textarea value={checkoutForm.notes} onChange={(e) => setCheckoutForm({...checkoutForm,notes:e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-medium text-slate-900 mb-2">Order Summary</p>
                    {cart.map((item) => {
                      const effPrice = getCartUnitPrice(item);
                      return (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span>{item.item?.name}{item.variantSize ? ` (${item.variantName || ''} Size: ${item.variantSize})` : ''} x{item.quantity}</span>
                          <span>£{(parseFloat(effPrice) * item.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>£{cartTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">💰 Payment: Cash on Delivery</p>
                  </div>
                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Place Order
                      </>
)}
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
                    {detailProduct.isDress ? (detailProduct.type || "Traditional") : (detailProduct.buttonAction === "pre_order" ? "Pre-Order" : detailProduct.buttonAction === "both" ? "Pre-Order / Add to Bag" : "Add to Bag")}
                  </div>
                </div>

                {/* Important Color Warning Box — only for dresses */}
                {detailProduct.isDress && (
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
                )}

                {/* Price */}
                {(() => {
                  const isItemWithVariants = detailProduct.variants && detailProduct.variants.length > 0 && !detailProduct.isDress;
                  const modalPrice = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.price : (selectedSize && getSizePrice(detailProduct, selectedSize) ? getSizePrice(detailProduct, selectedSize) : detailProduct.price);
                  return (
                    <div className="flex items-baseline gap-3 pt-1">
                      <span className="font-editorial text-3xl font-bold text-stone-900">£{modalPrice}</span>
                      {detailProduct.compareAtPrice && <span className="text-base text-stone-400 line-through">£{detailProduct.compareAtPrice}</span>}
                      {isItemWithVariants && detailSelectedVariant && (
                        <span className="text-[10px] text-emerald-600 font-semibold font-mono bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {detailSelectedVariant.size}
                        </span>
                      )}
                      {!isItemWithVariants && selectedSize && getSizePrice(detailProduct, selectedSize) && (
                        <span className="text-[10px] text-emerald-600 font-semibold font-mono bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Size: {selectedSize}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Material tag */}
                {detailProduct.isDress && (
                <div className="flex items-center gap-2">
                  <span className="bg-stone-100 text-stone-600 border border-stone-200 text-xs px-3 py-1 rounded-lg font-medium">
                    cotton
                  </span>
                </div>
                )}

                {/* Available Sizes — Dress Sizes */}
                {!detailProduct.isDress && parseSizes(detailProduct.sizes).length > 0 && (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 mb-2">Available Sizes:</label>
                    <div className="flex flex-wrap gap-2">
                      {parseSizes(detailProduct.sizes).map((size) => {
                        const sp = getSizePrice(detailProduct, size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition flex flex-col items-center ${
                              selectedSize === size
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-stone-100 text-stone-700 border-stone-200 hover:border-blue-400"
                            }`}
                          >
                            <span>{size}</span>
                            {sp && (
                              <span className={`text-[9px] font-mono ${selectedSize === size ? "text-blue-200" : "text-emerald-600"}`}>
                                £{sp}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Item Variant Selector (grams/feet/cm) */}
                {detailProduct.variants && detailProduct.variants.length > 0 && !detailProduct.isDress && (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-stone-500 mb-2">Select Size / Weight:</label>
                    <div className="flex flex-wrap gap-2">
                      {detailProduct.variants.map((v: any) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => { setDetailSelectedVariant(v); setSelectedSize(v.size); }}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition flex flex-col items-center ${
                            detailSelectedVariant?.id === v.id
                              ? "bg-amber-500 text-white border-amber-500 shadow-md"
                              : "bg-stone-100 text-stone-700 border-stone-200 hover:border-amber-400"
                          }`}
                        >
                          <span>{v.size}</span>
                          <span className={`text-[9px] font-mono ${detailSelectedVariant?.id === v.id ? "text-amber-100" : "text-emerald-600"}`}>
                            £{v.price}
                          </span>
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
                      const isItemWithVariants = detailProduct.variants && detailProduct.variants.length > 0 && !detailProduct.isDress;
                      if (parseSizes(detailProduct.sizes).length > 0 && !selectedSize) {
                        return alert("⚠️ Please select a size before adding to bag");
                      }
                      if (isItemWithVariants && !detailSelectedVariant) {
                        return alert("⚠️ Please select a size/weight before adding to bag");
                      }
                      const effPrice = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.price : getEffectivePrice(detailProduct, selectedSize);
                      const vName = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.size : selectedColor;
                      const vSize = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.size : selectedSize;
                      const vId = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.id : null;
                      addToCart(detailProduct.id, `${detailProduct.name} (${vName || 'Default'})`, effPrice, detailQty, detailProduct.isDress ? "dress" : "item", vName, vSize, vId);
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
                      const isItemWithVariants = detailProduct.variants && detailProduct.variants.length > 0 && !detailProduct.isDress;
                      if (parseSizes(detailProduct.sizes).length > 0 && !selectedSize) {
                        return alert("⚠️ Please select a size before ordering");
                      }
                      if (isItemWithVariants && !detailSelectedVariant) {
                        return alert("⚠️ Please select a size/weight before ordering");
                      }
                      const prefix = isPreOrder(detailProduct) ? "PRE-ORDER" : "BUY NOW";
                      const name = detailProduct.name;
                      const img = selectedImage || detailProduct.images?.[0] || '';
                      const clr = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.size : (selectedColor || '-');
                      const sz = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.size : (selectedSize || '-');
                      const effPrice2 = isItemWithVariants && detailSelectedVariant ? detailSelectedVariant.price : getEffectivePrice(detailProduct, selectedSize);
                      const msg = `${prefix}\n\nItem: ${name}\nSize: ${sz}\nQty: ${detailQty}\nPrice: £${effPrice2}\nImage: ${img}`;
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
                  {detailProduct.isDress ? (
                    <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                      <li>Authentic Traditional Kerala Weave</li>
                      <li>Soft, breathable cotton fabric</li>
                      <li>Fast UK Dispatch & Cash on Delivery</li>
                    </ul>
                  ) : (
                    <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                      <li>Authentic Kerala Pookkalam Art</li>
                      <li>Fresh, vibrant floral arrangements</li>
                      <li>Fast UK Dispatch</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
