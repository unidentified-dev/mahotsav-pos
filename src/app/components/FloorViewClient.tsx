'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Minus,
  UtensilsCrossed,
  Wine,
  Share2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  X,
  Flame,
  Truck,
  Boxes,
  AlertCircle,
  Trash2,
  ShoppingBag,
  Send,
  Receipt,
  CheckCircle,
  Lock,
  Building,
  LayoutGrid,
  Bell,
  CheckCircle2,
  Tag,
  Percent,
} from 'lucide-react';
import { submitOrder, printBill, settleTableOrder, getTableOrder, applyOrderDiscount } from '../actions/order';
import PinLoginGate from './PinLoginGate';
import OwnerDashboardView from './OwnerDashboardView';

interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLED';
  orders?: { id: string; grandTotal: number }[];
}

interface Section {
  id: string;
  name: string;
  tables: Table[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  taxRate: number;
  station: 'KITCHEN' | 'BAR';
  isVegetarian: boolean;
  isAlcoholic: boolean;
  isItem86: boolean;
  description?: string | null;
  category?: { name: string; station?: string };
}

interface Category {
  id: string;
  name: string;
  station: string;
  items: MenuItem[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
}

function parseItemInfo(rawName: string) {
  if (rawName && rawName.includes('::')) {
    const [title, varsPart] = rawName.split('::');
    try {
      const parsed = JSON.parse(varsPart);
      return {
        cleanName: title.trim(),
        variations: Array.isArray(parsed) ? parsed : [],
      };
    } catch {
      return { cleanName: title.trim(), variations: [] };
    }
  }
  return { cleanName: (rawName || '').trim(), variations: [] };
}

export default function FloorViewClient({
  sections,
  categories,
  inventoryItems = [],
  financialStats,
  ownerSummary,
}: {
  sections: Section[];
  categories: Category[];
  inventoryItems?: InventoryItem[];
  financialStats: any;
  ownerSummary?: any;
}) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const isBarManager = currentUser?.role === 'BAR_MANAGER';
  const isOwner = currentUser?.role === 'OWNER';
  const isRestoManager = currentUser?.role === 'RESTO_MANAGER' || isOwner;

  const [ownerViewMode, setOwnerViewMode] = useState<'EXECUTIVE' | 'FLOOR'>('EXECUTIVE');
  const [activeSectionTab, setActiveSectionTab] = useState<'Restaurant' | 'Bar'>('Restaurant');

  // KDS Dispatch Notification State
  const [kdsNotification, setKdsNotification] = useState<{
    id: string;
    tableNumber: string;
    orderNumber: string;
    itemsCount: number;
    timestamp: string;
  } | null>(null);

  // Online Orders State
  const [onlineOrders, setOnlineOrders] = useState<any[]>(financialStats.initialOnlineOrders || []);
  const [activeOnlineTab, setActiveOnlineTab] = useState<'ALL' | 'ZOMATO' | 'SWIGGY'>('ALL');

  // Modal Table State
  const [modalTable, setModalTable] = useState<Table | null>(null);
  const [activeOrderData, setActiveOrderData] = useState<any>(null);

  // Discount State (Resto Manager / Owner only)
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Cart state keyed by composite key (itemId + portionName)
  const [cart, setCart] = useState<{
    [key: string]: {
      item: MenuItem;
      quantity: number;
      portionName?: string;
      customPrice?: number;
    };
  }>({});

  // Active item popover for size selection
  const [sizePickerItem, setSizePickerItem] = useState<MenuItem | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CARD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingMoreItems, setIsAddingMoreItems] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mahotsav_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && (u.name || u.id)) {
          setCurrentUser(u);
          setIsAuthenticated(true);
          if (u.role === 'BAR_MANAGER') {
            setActiveSectionTab('Bar');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Cross-tab KDS notification listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mahotsav_kds_dispatch_event' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          setKdsNotification(payload);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLockTerminal = () => {
    localStorage.removeItem('mahotsav_current_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const allAvailableItems = useMemo(() => {
    const list: MenuItem[] = [];
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (!item.isItem86) {
          if (!isBarManager || item.station === 'BAR' || cat.station === 'BAR') {
            list.push({ ...item, category: { name: cat.name, station: cat.station } });
          }
        }
      });
    });
    return list;
  }, [categories, isBarManager]);

  const availableCategories = useMemo(() => {
    if (!isBarManager) return categories;
    return categories.filter((c) => c.station === 'BAR' || c.items.some((i) => i.station === 'BAR'));
  }, [categories, isBarManager]);

  const filteredItems = useMemo(() => {
    let items = allAvailableItems;
    if (selectedCategory !== 'ALL') {
      items = items.filter((i) => i.category?.name === selectedCategory);
    }
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const { cleanName } = parseItemInfo(item.name);
      const name = cleanName.toLowerCase();
      if (name.includes(term)) return true;
      const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .join('');
      return initials.includes(term) || item.category?.name.toLowerCase().includes(term);
    });
  }, [allAvailableItems, selectedCategory, searchTerm]);

  const currentSection = useMemo(() => {
    if (isBarManager) {
      return sections.find((s) => s.name.toLowerCase() === 'bar') || sections[0];
    }
    return sections.find((s) => s.name.toLowerCase() === activeSectionTab.toLowerCase()) || sections[0];
  }, [sections, activeSectionTab, isBarManager]);

  const totalOccupied = currentSection?.tables?.filter((t) => t.status === 'OCCUPIED').length || 0;
  const totalBilled = currentSection?.tables?.filter((t) => t.status === 'BILLED').length || 0;
  const totalAvailable = currentSection?.tables?.filter((t) => t.status === 'AVAILABLE').length || 0;

  const lowStockItems = inventoryItems.filter(
    (i) => Number(i.currentStock) <= Number(i.minThreshold)
  );

  const handleAcceptOnline = (orderId: string) => {
    setOnlineOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'PREPARING' } : o))
    );
  };

  const handleRejectOnline = (orderId: string) => {
    setOnlineOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleMarkOnlineReady = (orderId: string) => {
    setOnlineOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'READY' } : o))
    );
  };

  const filteredOnlineOrders = onlineOrders.filter((o) => {
    if (activeOnlineTab === 'ZOMATO') return o.platform === 'ZOMATO';
    if (activeOnlineTab === 'SWIGGY') return o.platform === 'SWIGGY';
    return true;
  });

  const handleOpenTable = async (table: Table) => {
    setModalTable(table);
    setCart({});
    setSizePickerItem(null);
    setSearchTerm('');
    setSelectedCategory('ALL');
    setIsAddingMoreItems(false);
    setDiscountInput('');

    if (table.status === 'OCCUPIED' || table.status === 'BILLED') {
      const order = await getTableOrder(table.id);
      setActiveOrderData(order);
      if (order?.discountAmount && Number(order.discountAmount) > 0) {
        setDiscountInput(String(order.discountAmount));
      }
    } else {
      setActiveOrderData(null);
    }
  };

  const closeModal = () => {
    setModalTable(null);
    setActiveOrderData(null);
    setCart({});
    setSizePickerItem(null);
    setIsAddingMoreItems(false);
    setDiscountInput('');
  };

  const handleItemCardClick = (item: MenuItem) => {
    const { variations } = parseItemInfo(item.name);
    if (variations.length > 0) {
      setSizePickerItem(item);
    } else {
      addPortionToCart(item);
    }
  };

  const addPortionToCart = (item: MenuItem, portion?: { name: string; price: number }) => {
    const portionKey = portion ? `${item.id}_${portion.name}` : item.id;
    const finalPrice = portion ? portion.price : Number(item.price);
    const portionName = portion ? portion.name : undefined;

    setCart((prev) => {
      const current = prev[portionKey]?.quantity || 0;
      return {
        ...prev,
        [portionKey]: {
          item,
          quantity: current + 1,
          portionName,
          customPrice: finalPrice,
        },
      };
    });

    setSizePickerItem(null);
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => {
      const current = prev[key]?.quantity || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { ...prev[key], quantity: current - 1 } };
    });
  };

  const deleteItemFromCart = (key: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const cartList = Object.entries(cart).map(([key, data]) => ({ key, ...data }));
  const cartSubtotal = cartList.reduce(
    (acc, c) => acc + (c.customPrice ?? Number(c.item.price)) * c.quantity,
    0
  );
  const cartTax = cartList.reduce(
    (acc, c) =>
      acc +
      ((c.customPrice ?? Number(c.item.price)) * c.quantity * Number(c.item.taxRate)) / 100,
    0
  );
  const cartTotal = cartSubtotal + cartTax;
  const totalItemUnits = cartList.reduce((acc, c) => acc + c.quantity, 0);

  const handleSendKOT = async () => {
    if (!modalTable || cartList.length === 0) return;
    setIsSubmitting(true);
    try {
      await submitOrder({
        tableId: modalTable.id,
        items: cartList.map((c) => {
          const { cleanName } = parseItemInfo(c.item.name);
          return {
            menuItemId: c.item.id,
            quantity: c.quantity,
            price: c.customPrice ?? Number(c.item.price),
            taxRate: Number(c.item.taxRate),
            name: c.portionName ? `${cleanName} (${c.portionName})` : cleanName,
          };
        }),
      });
      closeModal();
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!activeOrderData?.id || !isRestoManager) return;

    let calculatedDiscount = 0;
    const subtotal = Number(activeOrderData.subtotal || 0);

    if (discountType === 'PERCENT') {
      const pct = Math.min(100, Math.max(0, Number(discountInput) || 0));
      calculatedDiscount = (subtotal * pct) / 100;
    } else {
      calculatedDiscount = Math.min(subtotal, Math.max(0, Number(discountInput) || 0));
    }

    setIsApplyingDiscount(true);
    try {
      const updatedOrder = await applyOrderDiscount({
        orderId: activeOrderData.id,
        discountAmount: calculatedDiscount,
      });
      setActiveOrderData(updatedOrder);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!activeOrderData?.id || !isRestoManager) return;
    setIsApplyingDiscount(true);
    try {
      const updatedOrder = await applyOrderDiscount({
        orderId: activeOrderData.id,
        discountAmount: 0,
      });
      setActiveOrderData(updatedOrder);
      setDiscountInput('');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handlePrintBill = async () => {
    if (!modalTable) return;
    setIsSubmitting(true);
    try {
      await printBill(modalTable.id);
      window.print();
      closeModal();
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettle = async () => {
    if (!modalTable) return;
    setIsSubmitting(true);
    try {
      await settleTableOrder({
        tableId: modalTable.id,
        paymentMethod: selectedPaymentMethod,
      });
      closeModal();
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1 & 2. Role-specific WhatsApp Report Generator (Resto Manager vs Bar Manager)
  const handleShareDashboardWhatsApp = () => {
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (isBarManager) {
      // 2. Bar Manager Dashboard: Detailed Bar & Spirits Report Only
      const barSales =
        financialStats.topBarItems?.reduce((acc: number, it: any) => acc + (it.revenue || 0), 0) || 0;

      const message =
        `🍾 *MAHOTSAV RESTOBAR - BAR & SPIRITS DAILY REPORT*\n` +
        `📅 *Date:* ${dateStr}\n` +
        `👤 *Terminal:* Bar Lounge Terminal\n` +
        `─────────────────────────────\n` +
        `🍸 *Total Spirits & Drinks Revenue:* ₹${barSales > 0 ? barSales.toFixed(2) : financialStats.totalRevenue.toFixed(2)}\n` +
        `🍾 *Liquor VAT Collected (10%):* ₹${financialStats.liquorVatTotal.toFixed(2)}\n` +
        `🏷️ *Bar Discounts Deducted:* ₹${financialStats.discountTotal.toFixed(2)}\n` +
        `🧾 *Bar Settled Tickets:* ${financialStats.orderCount}\n` +
        `─────────────────────────────\n` +
        `🏆 *TOP MOVING SPIRITS & BEVERAGES:*\n` +
        (financialStats.topBarItems?.length > 0
          ? financialStats.topBarItems
              .map((b: any, idx: number) => {
                const { cleanName } = parseItemInfo(b.name);
                return `${idx + 1}. ${cleanName} — ${b.quantity} pours (₹${b.revenue.toFixed(0)})`;
              })
              .join('\n')
          : '• No spirits settled yet today') +
        `\n─────────────────────────────\n` +
        `_Report auto-dispatched from Bar Terminal._`;

      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // 1. Resto Manager Dashboard: Detailed Restaurant & Kitchen Food Report Only
      const restoSales =
        financialStats.topRestoItems?.reduce((acc: number, it: any) => acc + (it.revenue || 0), 0) ||
        (financialStats.totalRevenue - financialStats.liquorVatTotal);

      const message =
        `🍴 *MAHOTSAV RESTOBAR - RESTAURANT FOOD DAILY REPORT*\n` +
        `📅 *Date:* ${dateStr}\n` +
        `👤 *Terminal:* Resto Manager Command Terminal\n` +
        `─────────────────────────────\n` +
        `🍛 *Kitchen & Food Sales:* ₹${restoSales > 0 ? restoSales.toFixed(2) : financialStats.totalRevenue.toFixed(2)}\n` +
        `🍴 *Food GST Collected (5%):* ₹${financialStats.foodGstTotal.toFixed(2)}\n` +
        `🏷️ *Authorized Discounts Absorbed:* ₹${financialStats.discountTotal.toFixed(2)}\n` +
        `🧾 *Total Restaurant Settled Bills:* ${financialStats.orderCount}\n` +
        `─────────────────────────────\n` +
        `🏆 *TOP MOVING KITCHEN DISHES:*\n` +
        (financialStats.topRestoItems?.length > 0
          ? financialStats.topRestoItems
              .map((it: any, idx: number) => {
                const { cleanName } = parseItemInfo(it.name);
                return `${idx + 1}. ${cleanName} — ${it.quantity} plates (₹${it.revenue.toFixed(0)})`;
              })
              .join('\n')
          : '• No restaurant dishes settled yet today') +
        `\n─────────────────────────────\n` +
        `_Report auto-dispatched from Resto Manager Terminal._`;

      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-900 pl-28 pr-8 py-8 font-sans">
      
      {/* PIN Login Gate Overlay */}
      {!isAuthenticated && (
        <PinLoginGate
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            if (user?.role === 'BAR_MANAGER') {
              setActiveSectionTab('Bar');
            }
          }}
        />
      )}

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* CENTER / MAIN VIEWPORT */}
        <div className="xl:col-span-8 space-y-7">
          
          {/* Greeting Banner */}
          <div className="pos-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white border border-slate-200">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back, {currentUser?.name || 'Staff Member'}
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-1">
                Mahotsav Restobar • {isBarManager ? 'Bar & Lounge Terminal' : isOwner ? 'Executive Owner Command Terminal' : currentUser?.role ? currentUser.role.replace('_', ' ') : 'Live Operations'}
              </p>
            </div>

            {/* Quick Status Badges, Owner Toggle & Lock Button */}
            <div className="flex items-center gap-3 flex-wrap">
              {isOwner && (
                <button
                  onClick={() => setOwnerViewMode(ownerViewMode === 'EXECUTIVE' ? 'FLOOR' : 'EXECUTIVE')}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-semibold text-xs shadow-sm hover:bg-slate-800 transition"
                >
                  {ownerViewMode === 'EXECUTIVE' ? (
                    <>
                      <LayoutGrid className="w-4 h-4 stroke-[2]" />
                      <span>Switch to Table Floor</span>
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 stroke-[2]" />
                      <span>Switch to Executive P&L</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl text-xs font-medium text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>{totalAvailable} Vacant</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl text-xs font-medium text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{totalOccupied} Seated</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl text-xs font-medium text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>{totalBilled} Billed</span>
              </div>

              <button
                onClick={handleLockTerminal}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                title="Lock Terminal"
              >
                <Lock className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Real-time KDS ready notification toast */}
          {kdsNotification && isRestoManager && (
            <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-200 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 stroke-[2] animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Kitchen Food Ready for Pickup!
                    <span className="text-[11px] font-semibold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md">
                      Table #{kdsNotification.tableNumber}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Order #{kdsNotification.orderNumber} marked ready & dispatched by kitchen at {kdsNotification.timestamp}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setKdsNotification(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* View Routing */}
          {isOwner && ownerViewMode === 'EXECUTIVE' && ownerSummary ? (
            <OwnerDashboardView summary={ownerSummary} />
          ) : (
            <>
              {/* Online orders: Hidden for Bar Manager */}
              {!isBarManager && (
                <div className="pos-card p-7 space-y-5 bg-white border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                        <Truck className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2.5">
                          Live Online Orders
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            {onlineOrders.filter((o) => o.status === 'NEW').length} New
                          </span>
                        </h3>
                        <p className="text-xs font-normal text-slate-500 mt-0.5">Zomato & Swiggy kitchen dispatch feed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-medium">
                      <button
                        onClick={() => setActiveOnlineTab('ALL')}
                        className={`px-4 py-1.5 rounded-xl transition ${
                          activeOnlineTab === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All ({onlineOrders.length})
                      </button>
                      <button
                        onClick={() => setActiveOnlineTab('ZOMATO')}
                        className={`px-4 py-1.5 rounded-xl transition ${
                          activeOnlineTab === 'ZOMATO' ? 'bg-[#cb202d] text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Zomato
                      </button>
                      <button
                        onClick={() => setActiveOnlineTab('SWIGGY')}
                        className={`px-4 py-1.5 rounded-xl transition ${
                          activeOnlineTab === 'SWIGGY' ? 'bg-[#fc8019] text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Swiggy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredOnlineOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-white flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md text-white ${
                                  ord.platform === 'ZOMATO' ? 'bg-[#cb202d]' : 'bg-[#fc8019]'
                                }`}
                              >
                                {ord.platform}
                              </span>
                              <span className="text-sm font-semibold text-slate-900">#{ord.id}</span>
                            </div>
                            <span className="text-xs font-normal text-slate-500 block mt-1">
                              Guest: {ord.customerName} • {ord.time}
                            </span>
                          </div>

                          <span className="text-sm font-semibold text-slate-900 font-mono">
                            ₹{ord.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-xs font-normal text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                          {ord.items.map((it: string, i: number) => (
                            <div key={i}>{it}</div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              ord.status === 'NEW'
                                ? 'bg-rose-100 text-rose-700'
                                : ord.status === 'PREPARING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ord.status.replace('_', ' ')}
                          </span>

                          {ord.status === 'NEW' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectOnline(ord.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 font-medium text-xs transition"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleAcceptOnline(ord.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs transition"
                              >
                                Accept KOT
                              </button>
                            </div>
                          ) : ord.status === 'PREPARING' ? (
                            <button
                              onClick={() => handleMarkOnlineReady(ord.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition"
                            >
                              Ready for Pickup
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">{ord.riderName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Floor Section Tabs & Tables */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  {!isBarManager ? (
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                      <button
                        onClick={() => setActiveSectionTab('Restaurant')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                          activeSectionTab === 'Restaurant'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <UtensilsCrossed className="w-4 h-4 stroke-[1.8]" />
                        Restaurant (6 Tables)
                      </button>

                      <button
                        onClick={() => setActiveSectionTab('Bar')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                          activeSectionTab === 'Bar'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Wine className="w-4 h-4 stroke-[1.8]" />
                        Bar Lounge (15 Tables)
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200 text-xs font-semibold text-slate-900 w-fit">
                      <Wine className="w-4 h-4 text-purple-600 stroke-[2]" />
                      <span>Bar Lounge Floor (15 Tables)</span>
                    </div>
                  )}

                  <span className="text-xs font-normal text-slate-500">
                    Click any table to punch orders, print bill or settle
                  </span>
                </div>

                {/* Table Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
                  {currentSection?.tables?.map((table) => {
                    const isOccupied = table.status === 'OCCUPIED';
                    const isBilled = table.status === 'BILLED';
                    
                    // Display ₹0.00 if table is vacant, otherwise show running bill
                    const runningTotal =
                      table.status === 'AVAILABLE'
                        ? 0
                        : table.orders?.[0]?.grandTotal
                        ? Number(table.orders[0].grandTotal)
                        : 0;

                    return (
                      <div
                        key={table.id}
                        onClick={() => handleOpenTable(table)}
                        className="pos-card p-6 cursor-pointer select-none transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-44 group bg-white border border-slate-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 group-hover:text-black transition">
                              Table #{table.tableNumber.replace(/[^0-9]/g, '') || table.tableNumber}
                            </h3>
                            <span className="text-xs font-normal text-slate-500 block mt-0.5">
                              {table.capacity} Seater {isBarManager ? 'Lounge' : ''}
                            </span>
                          </div>

                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              isBilled
                                ? 'bg-amber-100 text-amber-800'
                                : isOccupied
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isBilled ? 'Billed' : isOccupied ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                          <div>
                            <span className="text-[11px] font-medium text-slate-400 block tracking-wider uppercase">
                              Running Bill
                            </span>
                            <span
                              className={`text-lg font-semibold mt-0.5 block ${
                                runningTotal > 0 ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              ₹{runningTotal.toFixed(2)}
                            </span>
                          </div>

                          <button className="text-xs font-medium text-slate-700 bg-slate-100 group-hover:bg-slate-900 group-hover:text-white px-3.5 py-1.5 rounded-xl transition">
                            Manage &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: FINANCIAL STATS, TOP SELLERS & DISPATCH */}
        <div className="xl:col-span-4 space-y-7">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="pos-card p-6 bg-white border border-slate-200">
              <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                {isBarManager ? 'Bar Sales' : "Today's Sales"}
              </span>
              <span className="text-2xl font-semibold text-slate-900 block mt-1.5 font-mono">
                ₹{financialStats.totalRevenue.toFixed(2)}
              </span>
              <span className="text-xs font-medium text-emerald-600 mt-1 block">
                {isBarManager ? 'Liquor & Cocktails' : 'Settled Revenue'}
              </span>
            </div>

            <div className="pos-card p-6 bg-white border border-slate-200">
              <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                Settled Bills
              </span>
              <span className="text-2xl font-semibold text-slate-900 block mt-1.5 font-mono">
                {financialStats.orderCount}
              </span>
              <span className="text-xs font-normal text-slate-500 mt-1 block">
                Tables Completed
              </span>
            </div>
          </div>

          {/* Highest Selling Items */}
          <div className="pos-card p-6 space-y-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 stroke-[1.8]" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {isBarManager ? 'Top Selling Bar Items' : 'Highest Selling Items'}
                </h3>
              </div>
              <span className="text-xs font-normal text-slate-400">By quantity</span>
            </div>

            {!isBarManager && (
              <div className="space-y-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Kitchen Classics
                </span>
                {financialStats.topRestoItems.map((item: any, idx: number) => {
                  const { cleanName } = parseItemInfo(item.name);
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-medium text-slate-800">{cleanName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900 text-sm">{item.quantity} sold</span>
                        <span className="text-xs text-slate-400 block font-mono">₹{item.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Bar & Spirits Hits
              </span>
              {financialStats.topBarItems.map((item: any, idx: number) => {
                const { cleanName } = parseItemInfo(item.name);
                return (
                  <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-slate-800">{cleanName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 text-sm">{item.quantity} sold</span>
                      <span className="text-xs text-slate-400 block font-mono">₹{item.revenue.toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kitchen Inventory Status */}
          {!isBarManager && (
            <div className="pos-card p-6 space-y-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Boxes className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Inventory Status</h3>
                </div>
                <Link href="/inventory" className="text-xs font-medium text-slate-600 hover:text-slate-900">
                  Full Stock &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {inventoryItems.slice(0, 4).map((item) => {
                  const isLow = Number(item.currentStock) <= Number(item.minThreshold);
                  const pct = Math.min(100, Math.round((Number(item.currentStock) / (Number(item.minThreshold) * 3)) * 100));

                  return (
                    <div key={item.id} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          {Number(item.currentStock)} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {lowStockItems.length > 0 && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs font-medium text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lowStockItems.length} items reaching safety reorder threshold</span>
                </div>
              )}
            </div>
          )}

          {/* Daily WhatsApp Dispatch Card (Resto or Bar report based on login) */}
          <div className="pos-card p-6 bg-slate-900 text-white space-y-3">
            <h4 className="text-base font-semibold text-white">
              {isBarManager ? 'Bar Sales WhatsApp Dispatch' : 'Restaurant Food WhatsApp Dispatch'}
            </h4>
            <p className="text-xs font-normal text-slate-400">
              {isBarManager
                ? 'Send liquor sales, 10% Liquor VAT, and top-selling spirits directly to management via WhatsApp.'
                : 'Send restaurant food collections, 5% Food GST, and top dishes directly to management via WhatsApp.'}
            </p>
            <button
              onClick={handleShareDashboardWhatsApp}
              className="w-full mt-2 py-3 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4 stroke-[2]" />
              {isBarManager ? 'Send Bar Report to WhatsApp' : 'Send Resto Report to WhatsApp'}
            </button>
          </div>
        </div>
      </div>

      {/* POPUP TERMINAL MODAL */}
      {modalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-[1300px] h-[92vh] rounded-[36px] shadow-2xl flex flex-col overflow-hidden select-none relative">
            
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold font-mono shadow-md">
                  #{modalTable.tableNumber.replace(/[^0-9]/g, '') || modalTable.tableNumber}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                      Table #{modalTable.tableNumber.replace(/[^0-9]/g, '') || modalTable.tableNumber}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        modalTable.status === 'BILLED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : modalTable.status === 'OCCUPIED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {modalTable.status === 'AVAILABLE' ? 'Vacant (New Ticket)' : modalTable.status}
                    </span>
                  </div>
                  <p className="text-sm font-normal text-slate-500 mt-0.5">
                    {modalTable.status === 'AVAILABLE'
                      ? 'Select items and choose portions (Half/Full or Peg size). Ordered items and live total will appear on the right.'
                      : modalTable.status === 'OCCUPIED'
                      ? 'Active seated table. Review ordered items ledger and tax details below.'
                      : 'Bill printed. Review consolidated order breakdown and settle payment below.'}
                  </p>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
                title="Close"
              >
                <X className="w-6 h-6 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col">
              
              {/* STATE 1: AVAILABLE -> TWO COLUMN MENU (LEFT) + ORDER LEDGER (RIGHT) */}
              {(modalTable.status === 'AVAILABLE' || (modalTable.status === 'OCCUPIED' && isAddingMoreItems)) && (
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* LEFT COLUMN: MENU CATALOG & DISH SELECTION */}
                  <div
                    className={`flex-1 flex flex-col p-8 overflow-y-auto space-y-6 transition-all duration-200 ${
                      cartList.length > 0 ? 'pr-6' : ''
                    }`}
                  >
                    {modalTable.status === 'OCCUPIED' && (
                      <div className="flex items-center justify-between pb-2">
                        <button
                          onClick={() => setIsAddingMoreItems(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                        >
                          &larr; Back to Running Bill
                        </button>
                        <span className="text-xs font-medium text-slate-500">
                          Punching additional items for Table #{modalTable.tableNumber}
                        </span>
                      </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative shrink-0">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="text"
                        placeholder={isBarManager ? "Search drink, spirit or peg..." : "Search dish or initial (e.g. 'pm' for Paneer Makhanwala)..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 border border-slate-200/80 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition font-normal"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-4 top-3.5 px-3 py-1 rounded-xl bg-slate-200 text-xs font-medium text-slate-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
                      <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition shrink-0 ${
                          selectedCategory === 'ALL'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        All {isBarManager ? 'Drinks' : 'Items'} ({allAvailableItems.length})
                      </button>
                      {availableCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition shrink-0 ${
                            selectedCategory === cat.name
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                          }`}
                        >
                          {cat.name} ({cat.items.length})
                        </button>
                      ))}
                    </div>

                    {/* Touch Dish Cards Grid */}
                    <div
                      className={`grid gap-4 ${
                        cartList.length > 0
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      }`}
                    >
                      {filteredItems.map((item) => {
                        const { cleanName, variations: itemVars } = parseItemInfo(item.name);
                        const hasVars = itemVars.length > 0;

                        const totalInCart = cartList
                          .filter((c) => c.item.id === item.id)
                          .reduce((acc, c) => acc + c.quantity, 0);

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemCardClick(item)}
                            className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 select-none shadow-sm ${
                              totalInCart > 0
                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2">
                                {cleanName}
                              </h4>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                {hasVars ? (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                    {itemVars.length} Sizes Available
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-emerald-700">
                                    ₹{Number(item.price).toFixed(2)}
                                  </span>
                                )}
                                <span className="text-[11px] font-medium text-slate-400 uppercase">
                                  • {item.station}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasVars ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSizePickerItem(item);
                                  }}
                                  className="px-3.5 py-2 rounded-2xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition active:scale-95 shadow-sm"
                                >
                                  {totalInCart > 0 ? `${totalInCart} in Ticket` : 'Choose Size'}
                                </button>
                              ) : (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200"
                                >
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    disabled={totalInCart === 0}
                                    className="w-9 h-9 rounded-xl bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition active:scale-95 shadow-sm"
                                  >
                                    <Minus className="w-4 h-4 stroke-[2.5]" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-semibold text-slate-900">
                                    {totalInCart}
                                  </span>
                                  <button
                                    onClick={() => addPortionToCart(item)}
                                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition active:scale-95 shadow-sm"
                                  >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: LIVE ORDERED ITEMS LIST, TOTAL & CTA */}
                  {cartList.length > 0 ? (
                    <div className="w-[410px] bg-slate-50 border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-xl animate-in slide-in-from-right-4 duration-200">
                      
                      {/* Top Header of Ticket */}
                      <div className="p-6 border-b border-slate-200/80 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <ShoppingBag className="w-5 h-5 text-slate-900 stroke-[2]" />
                            <h3 className="text-base font-semibold text-slate-900">
                              Order Ticket {isBarManager && '(BOT)'}
                            </h3>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                            {totalItemUnits} items
                          </span>
                        </div>
                      </div>

                      {/* Scrollable Order Items List */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {cartList.map(({ key, item, quantity, portionName, customPrice }) => {
                          const unitRate = customPrice ?? Number(item.price);
                          const { cleanName } = parseItemInfo(item.name);
                          return (
                            <div
                              key={key}
                              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 truncate">
                                  {cleanName}
                                  {portionName && (
                                    <span className="ml-1.5 px-2 py-0.5 text-[11px] font-bold bg-purple-100 text-purple-800 rounded-md">
                                      {portionName}
                                    </span>
                                  )}
                                </h4>
                                <span className="text-xs text-slate-500 font-medium block mt-0.5">
                                  ₹{unitRate.toFixed(2)} × {quantity} ={' '}
                                  <strong className="text-slate-900 font-semibold font-mono">
                                    ₹{(unitRate * quantity).toFixed(2)}
                                  </strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => removeFromCart(key)}
                                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                                >
                                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-slate-900">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    addPortionToCart(
                                      item,
                                      portionName ? { name: portionName, price: unitRate } : undefined
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  onClick={() => deleteItemFromCart(key)}
                                  className="w-8 h-8 ml-1 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom Calculation & Dispatch CTA */}
                      <div className="p-6 bg-white border-t border-slate-200 space-y-4">
                        <div className="space-y-1.5 text-xs text-slate-500">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold text-slate-900 font-mono">
                              ₹{cartSubtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{isBarManager ? 'Liquor VAT (10%)' : 'Estimated Taxes (GST/VAT)'}</span>
                            <span className="font-semibold text-slate-900 font-mono">
                              ₹{cartTax.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t border-slate-100">
                            <span>Total Payable</span>
                            <span className="text-xl font-bold text-emerald-700 font-mono">
                              ₹{cartTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleSendKOT}
                          disabled={isSubmitting}
                          className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-base transition flex items-center justify-center gap-2.5 shadow-lg"
                        >
                          <Send className="w-4 h-4 stroke-[2.5]" />
                          {isSubmitting ? 'Dispatching...' : isBarManager ? 'Dispatch BOT (Bar)' : 'Dispatch KOT / BOT'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden lg:flex w-80 bg-slate-50/60 border-l border-slate-200/80 flex-col items-center justify-center p-8 text-center text-slate-400 shrink-0">
                      <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
                      <h4 className="text-sm font-semibold text-slate-600">Ticket is Empty</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                        Tap any dish or drink to select portion sizes and review live totals here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STATE 2: OCCUPIED -> RUNNING BILL */}
              {modalTable.status === 'OCCUPIED' && !isAddingMoreItems && activeOrderData && (
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 flex flex-col p-8 overflow-y-auto space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Receipt className="w-5 h-5 stroke-[2] text-slate-900" />
                          Active Running Bill Breakdown
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Order #{activeOrderData.orderNumber || '101'} • Seated guests
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsAddingMoreItems(true)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          Punch More Items
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Printer className="w-4 h-4 stroke-[2]" />
                          Print Preview
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100/70 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                          <tr>
                            <th className="py-3 px-5">Item Name & Size</th>
                            <th className="text-center">Station</th>
                            <th className="text-center">Qty</th>
                            <th className="text-right">Rate</th>
                            <th className="text-right pr-5">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeOrderData.items?.map((item: any) => {
                            const raw = item.menuItem?.name || item.name || 'Dish';
                            const { cleanName } = parseItemInfo(raw);
                            return (
                              <tr key={item.id} className="hover:bg-white transition">
                                <td className="py-3.5 px-5 font-medium text-slate-900">
                                  {cleanName}
                                </td>
                                <td className="text-center">
                                  <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                      item.menuItem?.station === 'BAR'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                  >
                                    {item.menuItem?.station || 'BAR'}
                                  </span>
                                </td>
                                <td className="text-center font-semibold text-slate-900">
                                  {item.quantity}
                                </td>
                                <td className="text-right text-slate-600 font-mono">
                                  ₹{Number(item.unitPrice).toFixed(2)}
                                </td>
                                <td className="text-right pr-5 font-semibold text-slate-900 font-mono">
                                  ₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Items Subtotal</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          ₹{Number(activeOrderData.subtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      {Number(activeOrderData.liquorVat) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Liquor VAT (10%)</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            ₹{Number(activeOrderData.liquorVat).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {Number(activeOrderData.foodGst) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Food GST (5%)</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            ₹{Number(activeOrderData.foodGst).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {Number(activeOrderData.discountAmount) > 0 && (
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>Discount Applied</span>
                          <span className="font-mono">
                            -₹{Number(activeOrderData.discountAmount).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-semibold text-slate-900">
                        <span>Current Running Total</span>
                        <span className="text-lg font-bold text-emerald-700 font-mono">
                          ₹{Number(activeOrderData.grandTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-[430px] bg-slate-50 border-l border-slate-200 p-8 flex flex-col justify-between shrink-0 shadow-xl">
                    <div className="space-y-6">
                      <div className="p-7 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Current Running Bill
                        </span>
                        <span className="text-4xl font-semibold text-slate-900 block mt-2 font-mono">
                          ₹{Number(activeOrderData.grandTotal).toFixed(2)}
                        </span>
                      </div>

                      {/* DISCOUNT MANAGER CARD (RESTO MANAGER ONLY) */}
                      <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-purple-600" />
                            Bill Discount
                          </span>
                          {!isRestoManager && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              🔒 Resto Mgr Only
                            </span>
                          )}
                        </div>

                        {isRestoManager ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  placeholder={discountType === 'PERCENT' ? 'e.g. 10%' : 'e.g. 150'}
                                  value={discountInput}
                                  onChange={(e) => setDiscountInput(e.target.value)}
                                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setDiscountType(discountType === 'FLAT' ? 'PERCENT' : 'FLAT')}
                                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
                                title="Toggle Flat ₹ or %"
                              >
                                {discountType === 'FLAT' ? '₹ Flat' : '% Pct'}
                              </button>

                              <button
                                type="button"
                                onClick={handleApplyDiscount}
                                disabled={isApplyingDiscount || !discountInput}
                                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40"
                              >
                                {isApplyingDiscount ? '...' : 'Apply'}
                              </button>
                            </div>

                            {Number(activeOrderData.discountAmount) > 0 && (
                              <div className="flex items-center justify-between text-xs text-rose-600 font-semibold pt-1">
                                <span>Applied: -₹{Number(activeOrderData.discountAmount).toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={handleRemoveDiscount}
                                  className="text-[11px] underline hover:text-rose-800"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            Discounts are restricted. Only Resto Manager or Owner can apply bill discounts.
                          </p>
                        )}
                      </div>

                      <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Table Information
                        </span>
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Table Number</span>
                            <span className="font-semibold text-slate-900">#{modalTable.tableNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status</span>
                            <span className="font-semibold text-rose-700">Seated (Occupied)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePrintBill}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-base flex items-center justify-center gap-3 transition shadow-xl mt-6"
                    >
                      <Printer className="w-5 h-5 stroke-[1.8]" />
                      {isSubmitting ? 'Printing...' : 'Print 80mm Bill & Mark Billed'}
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: BILLED -> SETTLEMENT */}
              {modalTable.status === 'BILLED' && activeOrderData && (
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 flex flex-col p-8 overflow-y-auto space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Receipt className="w-5 h-5 stroke-[2] text-slate-900" />
                          Consolidated Bill Breakdown
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Order #{activeOrderData.orderNumber || '101'} • Guest audit ledger
                        </p>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Printer className="w-4 h-4 stroke-[2]" />
                        Reprint 80mm Bill
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100/70 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                          <tr>
                            <th className="py-3 px-5">Item Name & Size</th>
                            <th className="text-center">Station</th>
                            <th className="text-center">Qty</th>
                            <th className="text-right">Rate</th>
                            <th className="text-right pr-5">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeOrderData.items?.map((item: any) => {
                            const raw = item.menuItem?.name || item.name || 'Dish';
                            const { cleanName } = parseItemInfo(raw);
                            return (
                              <tr key={item.id} className="hover:bg-white transition">
                                <td className="py-3.5 px-5 font-medium text-slate-900">
                                  {cleanName}
                                </td>
                                <td className="text-center">
                                  <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                      item.menuItem?.station === 'BAR'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                  >
                                    {item.menuItem?.station || 'BAR'}
                                  </span>
                                </td>
                                <td className="text-center font-semibold text-slate-900">
                                  {item.quantity}
                                </td>
                                <td className="text-right text-slate-600 font-mono">
                                  ₹{Number(item.unitPrice).toFixed(2)}
                                </td>
                                <td className="text-right pr-5 font-semibold text-slate-900 font-mono">
                                  ₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Items Subtotal</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          ₹{Number(activeOrderData.subtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      {Number(activeOrderData.liquorVat) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Liquor VAT (10%)</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            ₹{Number(activeOrderData.liquorVat).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {Number(activeOrderData.foodGst) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Food GST (5%)</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            ₹{Number(activeOrderData.foodGst).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {Number(activeOrderData.discountAmount) > 0 && (
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>Discount Applied</span>
                          <span className="font-mono">
                            -₹{Number(activeOrderData.discountAmount).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-semibold text-slate-900">
                        <span>Net Grand Total</span>
                        <span className="text-lg font-bold text-emerald-700 font-mono">
                          ₹{Number(activeOrderData.grandTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-[430px] bg-slate-50 border-l border-slate-200 p-8 flex flex-col justify-between shrink-0 shadow-xl">
                    <div className="space-y-6">
                      <div className="p-7 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Total Amount Payable
                        </span>
                        <span className="text-4xl font-semibold text-slate-900 block mt-2 font-mono">
                          ₹{Number(activeOrderData.grandTotal).toFixed(2)}
                        </span>
                      </div>

                      {/* DISCOUNT MANAGER CARD (RESTO MANAGER ONLY) */}
                      <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-purple-600" />
                            Bill Discount
                          </span>
                          {!isRestoManager && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              🔒 Resto Mgr Only
                            </span>
                          )}
                        </div>

                        {isRestoManager ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  placeholder={discountType === 'PERCENT' ? 'e.g. 10%' : 'e.g. 150'}
                                  value={discountInput}
                                  onChange={(e) => setDiscountInput(e.target.value)}
                                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setDiscountType(discountType === 'FLAT' ? 'PERCENT' : 'FLAT')}
                                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
                                title="Toggle Flat ₹ or %"
                              >
                                {discountType === 'FLAT' ? '₹ Flat' : '% Pct'}
                              </button>

                              <button
                                type="button"
                                onClick={handleApplyDiscount}
                                disabled={isApplyingDiscount || !discountInput}
                                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40"
                              >
                                {isApplyingDiscount ? '...' : 'Apply'}
                              </button>
                            </div>

                            {Number(activeOrderData.discountAmount) > 0 && (
                              <div className="flex items-center justify-between text-xs text-rose-600 font-semibold pt-1">
                                <span>Applied: -₹{Number(activeOrderData.discountAmount).toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={handleRemoveDiscount}
                                  className="text-[11px] underline hover:text-rose-800"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            Discounts are restricted. Only Resto Manager or Owner can apply bill discounts.
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Select Settlement Mode
                        </span>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setSelectedPaymentMethod('CASH')}
                            className={`p-4 rounded-2xl border text-sm font-semibold flex flex-col items-center gap-2 transition ${
                              selectedPaymentMethod === 'CASH'
                                ? 'bg-slate-900 text-white shadow-md border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Banknote className="w-6 h-6 stroke-[1.8]" />
                            Cash
                          </button>
                          
                          <button
                            onClick={() => setSelectedPaymentMethod('CARD')}
                            className={`p-4 rounded-2xl border text-sm font-semibold flex flex-col items-center gap-2 transition ${
                              selectedPaymentMethod === 'CARD'
                                ? 'bg-slate-900 text-white shadow-md border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <CreditCard className="w-6 h-6 stroke-[1.8]" />
                            Card POS
                          </button>
                          
                          <button
                            onClick={() => setSelectedPaymentMethod('UPI')}
                            className={`p-4 rounded-2xl border text-sm font-semibold flex flex-col items-center gap-2 transition ${
                              selectedPaymentMethod === 'UPI'
                                ? 'bg-slate-900 text-white shadow-md border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <QrCode className="w-6 h-6 stroke-[1.8]" />
                            UPI / QR
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSettle}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-base transition shadow-xl mt-6"
                    >
                      {isSubmitting ? 'Settling...' : 'Complete Payment & Vacate Table'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PORTION / SIZE PICKER POPOVER MODAL */}
            {sizePickerItem && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {parseItemInfo(sizePickerItem.name).cleanName}
                      </h4>
                      <p className="text-xs text-slate-500">Choose portion / peg size to punch</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSizePickerItem(null)}
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {parseItemInfo(sizePickerItem.name).variations.map((portion: any, pi: number) => (
                      <button
                        key={pi}
                        type="button"
                        onClick={() => addPortionToCart(sizePickerItem, portion)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 flex items-center justify-between transition group text-left"
                      >
                        <span className="font-semibold text-slate-800 group-hover:text-slate-950 text-sm">
                          {portion.name}
                        </span>
                        <span className="font-bold text-emerald-700 font-mono text-sm">
                          ₹{Number(portion.price).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 80MM THERMAL RECEIPT */}
      <div id="thermal-receipt" className="hidden print:block text-[12px] text-black bg-white p-2">
        <div className="text-center pb-2 border-b border-black">
          <h2 className="text-base font-semibold tracking-wider">MAHOTSAV RESTOBAR</h2>
          <p className="text-[10px]">Kolhapur, Maharashtra</p>
          <div className="flex justify-between text-[11px] mt-2 pt-1 border-t border-dashed border-black">
            <span>Table: #{modalTable?.tableNumber}</span>
            <span>Order: #{activeOrderData?.orderNumber || '101'}</span>
          </div>
        </div>

        <div className="py-2 border-b border-dashed border-black space-y-1">
          {activeOrderData?.items?.map((item: any) => {
            const raw = item.menuItem?.name || item.name || 'Dish';
            const { cleanName } = parseItemInfo(raw);
            return (
              <div key={item.id} className="flex justify-between text-[11px]">
                <span>{item.quantity}x {cleanName}</span>
                <span>₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <div className="py-2 space-y-1 text-right text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{Number(activeOrderData?.subtotal || 0).toFixed(2)}</span>
          </div>
          {Number(activeOrderData?.discountAmount) > 0 && (
            <div className="flex justify-between font-semibold">
              <span>Discount:</span>
              <span>-₹{Number(activeOrderData?.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-sm pt-1 border-t border-black">
            <span>GRAND TOTAL:</span>
            <span>₹{Number(activeOrderData?.grandTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-dashed border-black text-[10px]">
          <p>Thank You! Visit Us Again</p>
        </div>
      </div>
    </div>
  );
}