'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Wine,
  Plus,
  ArrowLeft,
  Search,
  Edit2,
  Trash2,
  X,
  FolderPlus,
} from 'lucide-react';
import {
  getCategoriesWithItems,
  createCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItem86,
} from '../actions/menu';

interface Variation {
  name: string;
  price: string;
}

// Helpers to unpack name and variations from storedName
function parseItemNameAndVars(rawName: string) {
  if (rawName.includes('::')) {
    const [namePart, varsPart] = rawName.split('::');
    try {
      const vars = JSON.parse(varsPart);
      return { displayName: namePart.trim(), variations: Array.isArray(vars) ? vars : [] };
    } catch {
      return { displayName: namePart.trim(), variations: [] };
    }
  }
  return { displayName: rawName.trim(), variations: [] };
}

export default function MenuCatalogPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeStationTab, setActiveStationTab] = useState<'KITCHEN' | 'BAR'>('KITCHEN');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form State
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishTaxRate, setDishTaxRate] = useState('5');
  const [dietaryType, setDietaryType] = useState<'VEG' | 'NON_VEG'>('NON_VEG');
  const [listOnZomato, setListOnZomato] = useState(true);
  const [listOnSwiggy, setListOnSwiggy] = useState(true);
  const [modalCategoryId, setModalCategoryId] = useState('');
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [platformFlags, setPlatformFlags] = useState<{ [id: string]: { zomato: boolean; swiggy: boolean } }>({});

  const isBarManager = currentUser?.role === 'BAR_MANAGER';
  const isResto = !isBarManager && activeStationTab === 'KITCHEN';

  const loadData = async () => {
    const data = await getCategoriesWithItems();
    setCategories(data);

    const savedUser = localStorage.getItem('mahotsav_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.role === 'BAR_MANAGER') {
          setActiveStationTab('BAR');
        }
      } catch {}
    }

    const saved = localStorage.getItem('mahotsav_item_platforms');
    if (saved) {
      try {
        setPlatformFlags(JSON.parse(saved));
      } catch {}
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const barKeywords = ['beer', 'whiskey', 'whisky', 'vodka', 'rum', 'gin', 'tequila', 'wine', 'brandy', 'liqueur', 'spirits', 'cocktail', 'scotch'];

  const isBarCategory = (cat: any) => {
    if (cat.station === 'BAR') return true;
    const name = cat.name.toLowerCase();
    return barKeywords.some((kw) => name.includes(kw));
  };

  const restoCategories = useMemo(
    () => categories.filter((c) => !isBarCategory(c)),
    [categories]
  );

  const barCategories = useMemo(
    () => categories.filter((c) => isBarCategory(c)),
    [categories]
  );

  const currentCategoryList = isResto ? restoCategories : barCategories;

  useEffect(() => {
    if (currentCategoryList.length > 0) {
      const exists = currentCategoryList.some((c) => c.id === selectedCatId);
      if (!exists) {
        setSelectedCatId(currentCategoryList[0].id);
      }
    } else {
      setSelectedCatId('');
    }
  }, [activeStationTab, currentCategoryList, selectedCatId]);

  const activeCategory = currentCategoryList.find((c) => c.id === selectedCatId) || currentCategoryList[0];

  const handleToggleStock = async (itemId: string, current86: boolean) => {
    await toggleItem86(itemId, !current86);
    await loadData();
  };

  const applyPreset = (type: 'HALF_FULL' | 'WATER' | 'BAR_PEGS') => {
    if (type === 'HALF_FULL') {
      setHasVariations(true);
      setVariations([
        { name: 'Half', price: '' },
        { name: 'Full', price: '' },
      ]);
    } else if (type === 'WATER') {
      setHasVariations(true);
      setVariations([
        { name: '500 ml', price: '20' },
        { name: '1 Litre', price: '30' },
      ]);
    } else if (type === 'BAR_PEGS') {
      setHasVariations(true);
      setVariations([
        { name: '30 ml', price: '' },
        { name: '60 ml', price: '' },
        { name: '90 ml', price: '' },
        { name: '180 ml', price: '' },
        { name: 'Full Bottle', price: '' },
      ]);
    }
  };

  const handleOpenAddModal = () => {
    setDishName('');
    setDishPrice('');
    setDishTaxRate(isResto ? '5' : '10');
    setDietaryType('NON_VEG');
    setListOnZomato(isResto);
    setListOnSwiggy(isResto);
    setModalCategoryId(selectedCatId || (currentCategoryList[0]?.id || ''));
    
    if (!isResto) {
      setHasVariations(true);
      setVariations([
        { name: '30 ml', price: '' },
        { name: '60 ml', price: '' },
        { name: '90 ml', price: '' },
        { name: '180 ml', price: '' },
      ]);
    } else {
      setHasVariations(false);
      setVariations([]);
    }

    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    const { displayName, variations: parsedVars } = parseItemNameAndVars(item.name);
    setEditingItem(item);
    setDishName(displayName);
    setDishPrice(String(item.price));
    setDishTaxRate(String(item.taxRate));
    setDietaryType(item.isVegetarian ? 'VEG' : 'NON_VEG');
    const flags = platformFlags[item.id] || { zomato: item.station === 'KITCHEN', swiggy: item.station === 'KITCHEN' };
    setListOnZomato(flags.zomato);
    setListOnSwiggy(flags.swiggy);

    if (parsedVars.length > 0) {
      setHasVariations(true);
      setVariations(parsedVars.map((v: any) => ({ name: v.name, price: String(v.price) })));
    } else {
      setHasVariations(false);
      setVariations([]);
    }
  };

  const addVariationRow = () => {
    setVariations((prev) => [...prev, { name: '', price: '' }]);
  };

  const removeVariationRow = (idx: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVariationRow = (idx: number, field: 'name' | 'price', val: string) => {
    setVariations((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const station = isResto ? 'KITCHEN' : 'BAR';
      const created = await createCategory(newCategoryName.trim(), station);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      await loadData();
      if (created?.id) setSelectedCatId(created.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCatId = modalCategoryId || selectedCatId;
    if (!dishName.trim() || !targetCatId) return;

    const validVars = hasVariations
      ? variations
          .filter((v) => v.name.trim() && Number(v.price) > 0)
          .map((v) => ({ name: v.name.trim(), price: Number(v.price) }))
      : [];

    const basePrice = validVars.length > 0 ? validVars[0].price : Number(dishPrice);
    if (!basePrice || basePrice <= 0) {
      alert('Please enter a valid price or at least one portion variation price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const station = isResto ? 'KITCHEN' : 'BAR';

      const newItem = await createMenuItem({
        name: dishName.trim(),
        price: basePrice,
        taxRate: Number(dishTaxRate),
        station,
        isVegetarian: isResto ? dietaryType === 'VEG' : false,
        isAlcoholic: !isResto,
        categoryId: targetCatId,
        variations: validVars,
      });

      if (newItem?.id) {
        const next = {
          ...platformFlags,
          [newItem.id]: {
            zomato: isResto ? listOnZomato : false,
            swiggy: isResto ? listOnSwiggy : false,
          },
        };
        setPlatformFlags(next);
        localStorage.setItem('mahotsav_item_platforms', JSON.stringify(next));
      }

      setDishName('');
      setDishPrice('');
      setVariations([]);
      setIsAddModalOpen(false);
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !dishName) return;

    const isEditingResto = editingItem.station === 'KITCHEN';

    const validVars = hasVariations
      ? variations
          .filter((v) => v.name.trim() && Number(v.price) > 0)
          .map((v) => ({ name: v.name.trim(), price: Number(v.price) }))
      : [];

    const basePrice = validVars.length > 0 ? validVars[0].price : Number(dishPrice);

    setIsSubmitting(true);
    try {
      await updateMenuItem(editingItem.id, {
        name: dishName.trim(),
        price: basePrice,
        taxRate: Number(dishTaxRate),
        isVegetarian: isEditingResto ? dietaryType === 'VEG' : false,
        isAlcoholic: !isEditingResto,
        variations: validVars,
      });

      const next = {
        ...platformFlags,
        [editingItem.id]: {
          zomato: isEditingResto ? listOnZomato : false,
          swiggy: isEditingResto ? listOnSwiggy : false,
        },
      };
      setPlatformFlags(next);
      localStorage.setItem('mahotsav_item_platforms', JSON.stringify(next));

      setEditingItem(null);
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    await deleteMenuItem(id);
    setEditingItem(null);
    await loadData();
  };

  const filteredItems = (activeCategory?.items || []).filter((item: any) => {
    const { displayName } = parseItemNameAndVars(item.name);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-900 pl-28 pr-8 py-8 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-7">
        
        {/* Header Bar */}
        <div className="pos-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Return to floor plan"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {isBarManager ? 'Bar & Spirits Menu Management' : 'Menu Management & Pricing'}
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-0.5">
                {isBarManager
                  ? 'Manage spirits, 30/60/90/180ml peg sizes, beers, and pricing for bar lounge'
                  : 'Manage food dishes, Half/Full portions, water bottle sizes, and online platform listings'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setNewCategoryName('');
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-2xl text-xs transition"
            >
              <FolderPlus className="w-4 h-4 stroke-[2]" />
              New Category
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add New {isResto ? 'Dish' : 'Drink'}
            </button>
          </div>
        </div>

        {/* PRIMARY STATION SPLIT TABS: HIDDEN FOR BAR MANAGER */}
        {!isBarManager ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
              <button
                onClick={() => setActiveStationTab('KITCHEN')}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2.5 ${
                  activeStationTab === 'KITCHEN'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 stroke-[1.8]" />
                Restaurant Food ({restoCategories.length} Categories)
              </button>

              <button
                onClick={() => setActiveStationTab('BAR')}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2.5 ${
                  activeStationTab === 'BAR'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wine className="w-4 h-4 stroke-[1.8]" />
                Bar & Spirits ({barCategories.length} Categories)
              </button>
            </div>

            <span className="text-xs font-normal text-slate-500">
              Showing {isResto ? 'Kitchen & Food' : 'Bar & Spirits'} categories
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200 text-xs font-semibold text-slate-900 w-fit">
            <Wine className="w-4 h-4 text-purple-600 stroke-[2]" />
            <span>Bar Catalog ({barCategories.length} Spirit Categories)</span>
          </div>
        )}

        {/* Categories Directory Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {isResto ? 'Restaurant Categories' : 'Bar & Spirits Categories'} ({currentCategoryList.length})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {currentCategoryList.map((cat) => {
              const isSelected = cat.id === selectedCatId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between h-28 border select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'pos-card hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    {isResto ? (
                      <UtensilsCrossed className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <Wine className="w-4 h-4 stroke-[1.8]" />
                    )}
                    <span className="text-xs font-mono opacity-60">
                      {cat.items?.length || 0} items
                    </span>
                  </div>

                  <div>
                    <span className="text-sm font-semibold block truncate">{cat.name}</span>
                    <span className="text-[11px] opacity-60 mt-0.5 block">
                      {isResto ? 'Kitchen Food' : 'Bar Counter'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dishes & Products Container */}
        <div className="pos-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                {activeCategory?.name || (isResto ? 'Restaurant Dishes' : 'Bar Items')}
                <span className="text-xs font-normal text-slate-500">
                  ({filteredItems.length} items in this category)
                </span>
              </h3>
            </div>

            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={isResto ? 'Search food items...' : 'Search drinks & spirits...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border border-transparent rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-950 focus:outline-none focus:bg-white focus:border-slate-300 font-normal"
              />
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              {currentCategoryList.length === 0 ? (
                <>No categories found. Click &ldquo;New Category&rdquo; at the top to add your first category.</>
              ) : (
                <>No items found in this category. Click &ldquo;Add New {isResto ? 'Dish' : 'Drink'}&rdquo; above to add one.</>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item: any) => {
                const flags = platformFlags[item.id] || { zomato: false, swiggy: false };
                const { displayName, variations: itemVariations } = parseItemNameAndVars(item.name);

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            {isResto && (
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  item.isVegetarian ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                title={item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                              />
                            )}
                            {displayName}
                          </h4>

                          {itemVariations.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {itemVariations.map((v: any, vi: number) => (
                                <span
                                  key={vi}
                                  className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium font-mono"
                                >
                                  {v.name}: ₹{Number(v.price).toFixed(0)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-emerald-700 block">
                              ₹{Number(item.price).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit price & details"
                        >
                          <Edit2 className="w-4 h-4 stroke-[1.8]" />
                        </button>
                      </div>

                      {isResto && (
                        <div className="flex items-center gap-1.5 mt-3">
                          {flags.zomato && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#cb202d] text-white">
                              Zomato
                            </span>
                          )}
                          {flags.swiggy && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fc8019] text-white">
                              Swiggy
                            </span>
                          )}
                          {!flags.zomato && !flags.swiggy && (
                            <span className="text-[10px] font-medium text-slate-400">
                              Dine-In Only
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">
                        {isResto ? `GST: ${item.taxRate}%` : `VAT: ${item.taxRate}%`}
                      </span>

                      <button
                        onClick={() => handleToggleStock(item.id, item.isItem86)}
                        className={`px-3 py-1.5 rounded-xl font-medium transition ${
                          item.isItem86
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {item.isItem86 ? '86 (Out of Stock)' : 'Available'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateCategorySubmit}
            className="bg-white rounded-3xl p-7 w-full max-w-md space-y-5 shadow-2xl border border-slate-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Create {isResto ? 'Restaurant' : 'Bar'} Category
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize your {isResto ? 'kitchen dishes' : 'spirits and drinks'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Category Name</label>
              <input
                type="text"
                required
                placeholder={isResto ? 'e.g. Starters & Tandoor, Kolhapuri Thalis, Mains' : 'e.g. Whiskey, Beer, Vodka, Rum, Cocktails'}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-sm"
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD DISH */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <form
            onSubmit={handleCreateDish}
            className="bg-white rounded-3xl p-7 w-full max-w-xl space-y-5 shadow-2xl border border-slate-200 my-8"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {isResto
                    ? `Add Dish to ${currentCategoryList.find((c) => c.id === modalCategoryId)?.name || 'Restaurant'}`
                    : `Add Drink to ${currentCategoryList.find((c) => c.id === modalCategoryId)?.name || 'Bar'}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isResto
                    ? 'Assigned to Kitchen with portion/size controls'
                    : 'Assigned to Bar with 30/60/90/180ml peg variations'}
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
                Category
              </label>
              {currentCategoryList.length > 0 ? (
                <select
                  value={modalCategoryId}
                  onChange={(e) => setModalCategoryId(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  required
                >
                  {currentCategoryList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                  Please create a category first using &ldquo;New Category&rdquo; button.
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                {isResto ? 'Dish / Food Name' : 'Drink / Bottle Name'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  isResto
                    ? 'e.g. Mutton Fry Thali, Paneer Makhanwala'
                    : 'e.g. Kingfisher Ultra 650ml, Glenfiddich 12Y'
                }
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                {isResto ? 'Tax Rate (GST)' : 'Liquor VAT'}
              </label>
              <select
                value={dishTaxRate}
                onChange={(e) => setDishTaxRate(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white"
              >
                {isResto ? (
                  <>
                    <option value="5">5% (Food GST)</option>
                    <option value="0">0% (Nil)</option>
                    <option value="12">12% (Packaged Beverage)</option>
                    <option value="18">18% (Standard GST)</option>
                  </>
                ) : (
                  <>
                    <option value="10">10% (Liquor VAT)</option>
                    <option value="5">5% (Beer / Mild)</option>
                    <option value="0">0% (Nil)</option>
                  </>
                )}
              </select>
            </div>

            {/* VARIATIONS SECTION */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Portions & Size Variations
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isResto
                      ? 'Add Half/Full portions or bottle sizes with separate rates'
                      : 'Add 30ml, 60ml, 90ml, 180ml peg rates'}
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasVariations}
                    onChange={(e) => {
                      setHasVariations(e.target.checked);
                      if (e.target.checked && variations.length === 0) {
                        if (isResto) applyPreset('HALF_FULL');
                        else applyPreset('BAR_PEGS');
                      }
                    }}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span>Enable Variations</span>
                </label>
              </div>

              {hasVariations ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
                    {isResto ? (
                      <>
                        <button
                          type="button"
                          onClick={() => applyPreset('HALF_FULL')}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100"
                        >
                          Half / Full
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('WATER')}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100"
                        >
                          500ml / 1 Litre
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => applyPreset('BAR_PEGS')}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100"
                      >
                        30ml / 60ml / 90ml / 180ml / Bottle
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {variations.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Portion / Size (e.g. 60 ml, Half)"
                          value={row.name}
                          onChange={(e) => updateVariationRow(idx, 'name', e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                          required
                        />
                        <div className="relative w-32">
                          <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={row.price}
                            onChange={(e) => updateVariationRow(idx, 'price', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariationRow(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition"
                          title="Remove size"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addVariationRow}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Add Another Size / Portion
                  </button>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Single Flat Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={!hasVariations}
                    placeholder="320.00"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              )}
            </div>

            {/* VEG / NON-VEG TOGGLE */}
            {isResto && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Dietary Classification
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDietaryType('VEG')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      dietaryType === 'VEG'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Vegetarian (Veg)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDietaryType('NON_VEG')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      dietaryType === 'NON_VEG'
                        ? 'bg-rose-50 text-rose-900 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Non-Vegetarian (Non-Veg)
                  </button>
                </div>
              </div>
            )}

            {/* ONLINE DELIVERY TOGGLE */}
            {isResto && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Online Delivery Listing
                </span>
                
                <div className="flex gap-5 text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={listOnZomato}
                      onChange={(e) => setListOnZomato(e.target.checked)}
                      className="w-4 h-4 rounded text-[#cb202d]"
                    />
                    <span>List in Zomato</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={listOnSwiggy}
                      onChange={(e) => setListOnSwiggy(e.target.checked)}
                      className="w-4 h-4 rounded text-[#fc8019]"
                    />
                    <span>List in Swiggy</span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || currentCategoryList.length === 0}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save & Publish Product'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL 3: EDIT DISH */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <form
            onSubmit={handleUpdateDish}
            className="bg-white rounded-3xl p-7 w-full max-w-xl space-y-5 shadow-2xl border border-slate-200 my-8"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit {editingItem.station === 'KITCHEN' ? 'Food Dish' : 'Bar Item'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify rates, portions, and availability</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                {editingItem.station === 'KITCHEN' ? 'Dish Name' : 'Drink Name'}
              </label>
              <input
                type="text"
                required
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                {editingItem.station === 'KITCHEN' ? 'Tax Rate (GST)' : 'Liquor VAT'}
              </label>
              <select
                value={dishTaxRate}
                onChange={(e) => setDishTaxRate(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white"
              >
                {editingItem.station === 'KITCHEN' ? (
                  <>
                    <option value="5">5% (Food GST)</option>
                    <option value="0">0% (Nil)</option>
                    <option value="12">12% (Packaged Beverage)</option>
                    <option value="18">18% (Standard GST)</option>
                  </>
                ) : (
                  <>
                    <option value="10">10% (Liquor VAT)</option>
                    <option value="5">5% (Beer / Mild)</option>
                    <option value="0">0% (Nil)</option>
                  </>
                )}
              </select>
            </div>

            {/* EDIT VARIATIONS */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Portions & Size Variations
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure portions like Half/Full or 30ml/60ml/90ml/180ml
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasVariations}
                    onChange={(e) => {
                      setHasVariations(e.target.checked);
                      if (e.target.checked && variations.length === 0) {
                        if (editingItem.station === 'KITCHEN') applyPreset('HALF_FULL');
                        else applyPreset('BAR_PEGS');
                      }
                    }}
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span>Enable Variations</span>
                </label>
              </div>

              {hasVariations ? (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {variations.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Portion / Size"
                          value={row.name}
                          onChange={(e) => updateVariationRow(idx, 'name', e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                          required
                        />
                        <div className="relative w-32">
                          <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={row.price}
                            onChange={(e) => updateVariationRow(idx, 'price', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariationRow(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addVariationRow}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Add Another Size
                  </button>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Single Flat Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={!hasVariations}
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              )}
            </div>

            {/* VEG / NON-VEG TOGGLE */}
            {editingItem.station === 'KITCHEN' && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Dietary Classification
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDietaryType('VEG')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      dietaryType === 'VEG'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Vegetarian (Veg)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDietaryType('NON_VEG')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      dietaryType === 'NON_VEG'
                        ? 'bg-rose-50 text-rose-900 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Non-Vegetarian (Non-Veg)
                  </button>
                </div>
              </div>
            )}

            {/* ONLINE DELIVERY TOGGLE */}
            {editingItem.station === 'KITCHEN' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Online Delivery Listing
                </span>
                
                <div className="flex gap-5 text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={listOnZomato}
                      onChange={(e) => setListOnZomato(e.target.checked)}
                      className="w-4 h-4 rounded text-[#cb202d]"
                    />
                    <span>List in Zomato</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={listOnSwiggy}
                      onChange={(e) => setListOnSwiggy(e.target.checked)}
                      className="w-4 h-4 rounded text-[#fc8019]"
                    />
                    <span>List in Swiggy</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteDish(editingItem.id)}
                className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                title="Delete this item"
              >
                <Trash2 className="w-5 h-5 stroke-[1.8]" />
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-sm"
              >
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}