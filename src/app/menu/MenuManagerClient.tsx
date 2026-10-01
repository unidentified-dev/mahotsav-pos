'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Ban,
  CheckCircle2,
  UtensilsCrossed,
  Wine,
  CupSoda,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  toggleItem86,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../actions/menu';

type ItemType = 'VEG' | 'NON_VEG' | 'ALCOHOL' | 'SOFT_DRINK';

export default function MenuManagerClient({
  initialItems,
  categories,
}: {
  initialItems: any[];
  categories: any[];
}) {
  const [items, setItems] = useState(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [price, setPrice] = useState<number | string>('');
  const [taxRate, setTaxRate] = useState<number>(5);
  const [station, setStation] = useState<'KITCHEN' | 'BAR'>('KITCHEN');
  const [itemType, setItemType] = useState<ItemType>('VEG');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle switching item type (Veg, Non-Veg, Alcohol, Soft Drink)
  const applyItemType = (type: ItemType) => {
    setItemType(type);
    if (type === 'VEG') {
      setStation('KITCHEN');
      setTaxRate(5);
    } else if (type === 'NON_VEG') {
      setStation('KITCHEN');
      setTaxRate(5);
    } else if (type === 'ALCOHOL') {
      setStation('BAR');
      setTaxRate(10);
    } else if (type === 'SOFT_DRINK') {
      setStation('BAR');
      setTaxRate(5);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    const defaultCat = categories[0];
    setCategoryId(defaultCat?.id || '');
    setPrice('');
    applyItemType('VEG');
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.categoryId);
    setPrice(Number(item.price));
    setTaxRate(Number(item.taxRate));
    setStation(item.station);

    // Determine current item type
    if (item.station === 'BAR') {
      if (item.isAlcoholic) {
        setItemType('ALCOHOL');
      } else {
        setItemType('SOFT_DRINK');
      }
    } else {
      if (item.isVegetarian) {
        setItemType('VEG');
      } else {
        setItemType('NON_VEG');
      }
    }

    setIsModalOpen(true);
  };

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const selectedCat = categories.find((c) => c.id === catId);
    if (!selectedCat) return;

    if (selectedCat.station === 'BAR') {
      const lower = selectedCat.name.toLowerCase();
      if (
        lower.includes('soft') ||
        lower.includes('water') ||
        lower.includes('mocktail') ||
        lower.includes('soda')
      ) {
        applyItemType('SOFT_DRINK');
      } else {
        applyItemType('ALCOHOL');
      }
    } else {
      if (itemType === 'ALCOHOL' || itemType === 'SOFT_DRINK') {
        applyItemType('VEG');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) return;
    setIsSubmitting(true);

    const isVegetarian = itemType === 'VEG' || itemType === 'SOFT_DRINK';
    const isAlcoholic = itemType === 'ALCOHOL';

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, {
          name,
          categoryId,
          price: Number(price),
          taxRate: Number(taxRate),
          station,
          isVegetarian,
          isAlcoholic,
        });
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id
              ? {
                  ...i,
                  name,
                  categoryId,
                  category: categories.find((c) => c.id === categoryId),
                  price: Number(price),
                  taxRate: Number(taxRate),
                  station,
                  isVegetarian,
                  isAlcoholic,
                }
              : i
          )
        );
      } else {
        const res = await createMenuItem({
          name,
          categoryId,
          price: Number(price),
          taxRate: Number(taxRate),
          station,
          isVegetarian,
          isAlcoholic,
        });
        if (res.success) {
          const categoryObj = categories.find((c) => c.id === categoryId);
          setItems((prev) => [...prev, { ...res.item, category: categoryObj }]);
        }
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    setLoadingId(itemId);
    try {
      await deleteMenuItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggle = async (item: any) => {
    setLoadingId(item.id);
    try {
      await toggleItem86(item.id, item.isItem86);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isItem86: !i.isItem86 } : i))
      );
    } finally {
      setLoadingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const outOfStockCount = items.filter((i) => i.isItem86).length;

  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-100 p-8 font-sans selection:bg-zinc-800">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <UtensilsCrossed className="w-6 h-6 text-amber-400" />
              Menu & Pricing Management
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add new items, adjust prices, edit details, or mark items Out of Stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold px-4 py-2 rounded-2xl text-xs shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
          <span className="px-3.5 py-2 rounded-2xl text-xs font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
            {outOfStockCount} Out of Stock
          </span>
        </div>
      </header>

      {/* Search Bar */}
      <div className="mt-8 flex items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 max-w-md">
        <Search className="w-4 h-4 text-zinc-500 mr-3" />
        <input
          type="text"
          placeholder="Search dish or beverage..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 w-full"
        />
      </div>

      {/* Items List */}
      <div className="mt-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
        <div className="divide-y divide-zinc-800/60">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No items match your search.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-900/50 transition gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center">
                    {item.station === 'BAR' ? (
                      item.isAlcoholic ? (
                        <Wine className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CupSoda className="w-4 h-4 text-cyan-400" />
                      )
                    ) : (
                      <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      {item.name}
                      {item.isItem86 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                          Out of Stock
                        </span>
                      )}
                      {item.station === 'BAR' ? (
                        item.isAlcoholic ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Alcohol
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Soft Drink
                          </span>
                        )
                      ) : item.isVegetarian ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Veg
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Non-Veg
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {item.category?.name} • ₹{Number(item.price).toFixed(2)} • Tax: {item.taxRate}% • Station: {item.station}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Stock Toggle */}
                  <button
                    disabled={loadingId === item.id}
                    onClick={() => handleToggle(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      item.isItem86
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {item.isItem86 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        Mark Out
                      </>
                    )}
                  </button>

                  {/* Edit / Change Price */}
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                    title="Edit Item / Change Price"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    disabled={loadingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121316] border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {editingItem ? 'Edit Item & Price' : 'Add New Menu Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Item Classification Checkboxes */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Item Classification
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Vegetarian */}
                  <label
                    onClick={() => applyItemType('VEG')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                      itemType === 'VEG'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={itemType === 'VEG'}
                      onChange={() => applyItemType('VEG')}
                      className="hidden"
                    />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Vegetarian
                  </label>

                  {/* Non-Vegetarian */}
                  <label
                    onClick={() => applyItemType('NON_VEG')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                      itemType === 'NON_VEG'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={itemType === 'NON_VEG'}
                      onChange={() => applyItemType('NON_VEG')}
                      className="hidden"
                    />
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Non-Veg
                  </label>

                  {/* Alcohol */}
                  <label
                    onClick={() => applyItemType('ALCOHOL')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                      itemType === 'ALCOHOL'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={itemType === 'ALCOHOL'}
                      onChange={() => applyItemType('ALCOHOL')}
                      className="hidden"
                    />
                    <Wine className="w-3.5 h-3.5 text-amber-400" />
                    Alcohol
                  </label>

                  {/* Soft Drink */}
                  <label
                    onClick={() => applyItemType('SOFT_DRINK')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                      itemType === 'SOFT_DRINK'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={itemType === 'SOFT_DRINK'}
                      onChange={() => applyItemType('SOFT_DRINK')}
                      className="hidden"
                    />
                    <CupSoda className="w-3.5 h-3.5 text-cyan-400" />
                    Soft Drink
                  </label>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Tikka / Old Monk / Fresh Lime Soda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Category & Station */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Course / Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Order Station
                  </label>
                  <select
                    value={station}
                    onChange={(e) => setStation(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    <option value="KITCHEN">Kitchen KOT</option>
                    <option value="BAR">Bar BOT</option>
                  </select>
                </div>
              </div>

              {/* Price & Tax Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="350.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}