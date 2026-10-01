'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Check,
  X,
  FileText,
  Trash2,
  Upload,
  ShieldAlert,
} from 'lucide-react';
import { createStockItem, updateStockLevel, deleteStockItem } from '../actions/inventory';

interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
  updatedAt?: string;
}

export default function InventoryClient({ initialItems }: { initialItems: StockItem[] }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [items, setItems] = useState<StockItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Add Item to Stock Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Vegetables & Produce');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('kg');
  const [minThreshold, setMinThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
  const [billFileName, setBillFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attached bills map
  const [attachedBills, setAttachedBills] = useState<{ [id: string]: { fileName: string; date: string } }>({});

  useEffect(() => {
    const savedUser = localStorage.getItem('mahotsav_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {}
    }

    const saved = localStorage.getItem('mahotsav_stock_bills');
    if (saved) {
      try {
        setAttachedBills(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const isBarManager = currentUser?.role === 'BAR_MANAGER';

  // ACCESS DENIED SCREEN FOR BAR MANAGER
  if (isBarManager) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] text-slate-900 pl-28 pr-8 py-16 font-sans flex items-center justify-center">
        <div className="max-w-md w-full pos-card p-8 bg-white border border-slate-200 text-center space-y-5">
          <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7 stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            Raw materials stock intake and supplier purchase bills are restricted to Kitchen and Restaurant Administrators.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-2xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Bar Terminal
          </Link>
        </div>
      </div>
    );
  }

  const kitchenCategories = [
    'Vegetables & Produce',
    'Dairy & Paneer',
    'Spices & Masalas',
    'Grains & Flour',
    'Oils & Ghee',
    'Poultry & Meat',
    'Packaging & Disposables',
    'Other Kitchen Raw',
  ];

  const categories = ['ALL', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAdjustStock = async (id: string, delta: number) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newStock = Math.max(0, target.currentStock + delta);

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, currentStock: newStock } : i))
    );

    try {
      await updateStockLevel(id, newStock);
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillFileName(file.name);
    }
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemQuantity) return;

    setIsSubmitting(true);
    try {
      const created = await createStockItem({
        name: itemName.trim(),
        category: itemCategory,
        unit: itemUnit,
        currentStock: Number(itemQuantity),
        minThreshold: Number(minThreshold) || 5,
        costPerUnit: Number(costPerUnit) || 0,
      });

      if (created?.id && billFileName) {
        const next = {
          ...attachedBills,
          [created.id]: { fileName: billFileName, date: inwardDate },
        };
        setAttachedBills(next);
        localStorage.setItem('mahotsav_stock_bills', JSON.stringify(next));
      }

      setItems((prev) => [...prev, created]);
      setItemName('');
      setItemQuantity('');
      setCostPerUnit('');
      setBillFileName('');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this raw material from stock?')) return;
    await deleteStockItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-900 pl-28 pr-8 py-8 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-7">
        
        {/* Header Bar */}
        <div className="pos-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Return to floor plan"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Inventory & Stock Management
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-0.5">
                Monitor restaurant ingredients, attach purchase bills, and maintain safety thresholds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search raw material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add Item to Stock
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition shrink-0 ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stock Ledger Table */}
        <div className="pos-card p-6 bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="py-3.5 px-4">Item Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Current Stock</th>
                  <th>Safety Threshold</th>
                  <th>Status</th>
                  <th>Purchase Bill</th>
                  <th className="text-right pr-4">Quick Adjust / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredItems.map((item) => {
                  const isLow = item.currentStock <= item.minThreshold;
                  const bill = attachedBills[item.id];

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="text-slate-600 font-medium">
                        {item.category}
                      </td>
                      <td className="text-slate-500 font-mono text-xs font-medium">
                        {item.unit}
                      </td>
                      <td className="font-semibold text-slate-900 font-mono text-base">
                        {item.currentStock.toFixed(1)}
                      </td>
                      <td className="text-slate-600 font-mono text-xs">
                        Min: {item.minThreshold.toFixed(1)} {item.unit}
                      </td>
                      <td>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 ${
                            isLow
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLow ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
                            }`}
                          />
                          {isLow ? 'Low Stock' : 'Adequate'}
                        </span>
                      </td>
                      <td>
                        {bill ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span className="max-w-[110px] truncate" title={bill.fileName}>
                              {bill.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400">({bill.date})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No bill</span>
                        )}
                      </td>
                      <td className="text-right pr-4">
                        <div className="inline-flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => handleAdjustStock(item.id, -1)}
                              className="p-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white transition"
                              title="Deduct 1"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.id, 1)}
                              className="p-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white transition"
                              title="Add 1"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remove stock entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* "ADD ITEM TO STOCK" MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleAddStockSubmit}
            className="bg-white rounded-3xl p-7 w-full max-w-lg space-y-5 shadow-2xl border border-slate-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-slate-900 stroke-[2]" />
                  Add Raw Material to Restaurant Stock
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record new delivery, set safety threshold, and attach vendor purchase bill
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Raw Material Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Malai Paneer, Onions, Basmati Rice"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Category
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white font-medium"
                >
                  {kitchenCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Measurement Unit
                </label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white font-medium"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="L">Liters (L)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="packets">Packets</option>
                  <option value="bags">Bags / Sacks</option>
                  <option value="cans">Cans / Tins</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Inward Quantity ({itemUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="25.0"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Safety Threshold ({itemUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="5.0"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Alerts cashier when stock drops below this
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Inward Delivery Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Unit Cost (₹) Optional
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="120.00"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white font-medium"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Attach Purchase Bill / Invoice
              </span>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition shadow-sm">
                  <Upload className="w-4 h-4 stroke-[2]" />
                  <span>Choose Bill Image / PDF</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {billFileName ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 truncate max-w-[200px]">
                    <Check className="w-3.5 h-3.5" />
                    {billFileName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">No file attached</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-sm"
            >
              {isSubmitting ? 'Recording Inward Stock...' : 'Save Item & Record Inward Stock'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}