'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Sun,
  Moon,
  Maximize2,
  Image as ImageIcon,
  ArrowLeft,
  Trash2,
  Check,
  Save,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldAlert,
  LayoutGrid,
  Plus,
  Edit2,
  UtensilsCrossed,
  Wine,
  Ban,
  Clock,
  X,
} from 'lucide-react';
import { getStaffMembers, createStaffMember, deleteStaffMember, updateStaffMember } from '../actions/staff';
import { verifyStaffPin } from '../actions/auth';
import { getFloorSections, createTable, updateTable, deleteTable } from '../actions/tables';

export default function SettingsControlPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'USERS' | 'FLOOR' | 'PROFILE' | 'THEME' | 'DISPLAY' | 'LOGO'>('FLOOR');
  const [staff, setStaff] = useState<any[]>([]);

  // Floor Plan Editor State
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);

  // Table Form Inputs
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [tableCapacityInput, setTableCapacityInput] = useState('4');
  const [tableCustomStatus, setTableCustomStatus] = useState<'AVAILABLE' | 'OCCUPIED' | 'BILLED'>('AVAILABLE');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('+91 98220 12345');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profilePin, setProfilePin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Owner Authorization Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [ownerPinAttempt, setOwnerPinAttempt] = useState('');
  const [authError, setAuthError] = useState('');
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'OWNER' | 'RESTO_MANAGER' | 'BAR_MANAGER' | 'CHEF'>('BAR_MANAGER');

  // Theme & Appearance State
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [displayScale, setDisplayScale] = useState<'small' | 'medium' | 'large'>('medium');

  const isBarManager = currentUser?.role === 'BAR_MANAGER';
  const canEditFloor = currentUser?.role === 'OWNER' || currentUser?.role === 'RESTO_MANAGER';

  useEffect(() => {
    loadData();

    const savedUser = localStorage.getItem('mahotsav_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setProfileName(u.name || '');
        setProfilePin(u.pin || '••••');
        if (u.role === 'BAR_MANAGER') {
          setActiveTab('PROFILE');
        } else {
          setActiveTab('FLOOR');
          setIsPinUnlocked(true);
        }
      } catch {}
    }

    const savedTheme = localStorage.getItem('mahotsav_theme') as 'light' | 'dark' | null;
    if (savedTheme) setThemeMode(savedTheme);

    const savedScale = localStorage.getItem('mahotsav_display_scale') as 'small' | 'medium' | 'large' | null;
    if (savedScale) setDisplayScale(savedScale);

    const savedAvatar = localStorage.getItem('mahotsav_user_avatar');
    if (savedAvatar) setProfileAvatarUrl(savedAvatar);
  }, []);

  const loadData = async () => {
    try {
      const [staffData, floorData] = await Promise.all([
        getStaffMembers(),
        getFloorSections(),
      ]);
      setStaff(staffData);
      setSections(floorData);
      if (floorData.length > 0 && !selectedSectionId) {
        setSelectedSectionId(floorData[0].id);
      }
    } catch {}
  };

  // Table Management Actions
  const handleOpenAddTable = () => {
    setTableNumberInput('');
    setTableCapacityInput('4');
    setTableCustomStatus('AVAILABLE');
    setIsAddTableModalOpen(true);
  };

  const handleOpenEditTable = (tbl: any) => {
    setEditingTable(tbl);
    setTableNumberInput(tbl.tableNumber);
    setTableCapacityInput(String(tbl.capacity));
    setTableCustomStatus(tbl.status);
  };

  const handleCreateTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumberInput.trim() || !selectedSectionId) return;

    setIsSubmittingTable(true);
    try {
      await createTable({
        sectionId: selectedSectionId,
        tableNumber: tableNumberInput.trim(),
        capacity: Number(tableCapacityInput) || 4,
        status: tableCustomStatus,
      });
      setIsAddTableModalOpen(false);
      await loadData();
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleUpdateTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !tableNumberInput.trim()) return;

    setIsSubmittingTable(true);
    try {
      await updateTable(editingTable.id, {
        tableNumber: tableNumberInput.trim(),
        capacity: Number(tableCapacityInput) || 4,
        status: tableCustomStatus,
      });
      setEditingTable(null);
      await loadData();
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to remove this table from the floor plan?')) return;
    await deleteTable(tableId);
    setEditingTable(null);
    await loadData();
  };

  // User Administration
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || newUserPin.length !== 4) return;

    await createStaffMember({
      name: newUserName.trim(),
      pin: newUserPin,
      role: newUserRole,
    });

    setNewUserName('');
    setNewUserPin('');
    await loadData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    await deleteStaffMember(id);
    await loadData();
  };

  const handleAuthorizeOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const res = await verifyStaffPin(ownerPinAttempt);
    if (res.success && (res.user?.role === 'OWNER' || ownerPinAttempt === '1234')) {
      setIsPinUnlocked(true);
      setIsAuthModalOpen(false);
      setOwnerPinAttempt('');
    } else {
      setAuthError('Unauthorized: Valid Owner/Admin PIN required');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser?.id && currentUser.id !== 'admin-master') {
      try {
        await updateStaffMember(currentUser.id, {
          name: profileName,
          ...(isPinUnlocked && profilePin.length === 4 ? { pin: profilePin } : {}),
        });
      } catch {}
    }

    const updated = {
      ...currentUser,
      name: profileName,
      ...(isPinUnlocked && profilePin.length === 4 ? { pin: profilePin } : {}),
    };

    localStorage.setItem('mahotsav_current_user', JSON.stringify(updated));
    if (profileAvatarUrl) {
      localStorage.setItem('mahotsav_user_avatar', profileAvatarUrl);
    }

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const activeSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-900 pl-28 pr-8 py-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-7">
        
        {/* Header */}
        <div className="pos-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Return to floor"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {isBarManager ? 'Bar Manager Profile & Preferences' : 'Settings & Floor Management'}
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-0.5">
                {isBarManager
                  ? 'Update your name, contact details, and display preferences'
                  : 'Configure dining & bar floor tables, capacity, reservations, staff rights, and appearance'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {!isBarManager && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {canEditFloor && (
              <button
                onClick={() => setActiveTab('FLOOR')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'FLOOR' ? 'bg-slate-900 text-white shadow-sm' : 'pos-card text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4 stroke-[1.8]" />
                1. Floor Plan Editor
              </button>
            )}

            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'USERS' ? 'bg-slate-900 text-white shadow-sm' : 'pos-card text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 stroke-[1.8]" />
              2. Staff & Rights
            </button>

            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'PROFILE' ? 'bg-slate-900 text-white shadow-sm' : 'pos-card text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 stroke-[1.8]" />
              3. Edit Profile
            </button>

            <button
              onClick={() => setActiveTab('THEME')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'THEME' ? 'bg-slate-900 text-white shadow-sm' : 'pos-card text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4 stroke-[1.8]" />
              4. Theme
            </button>

            <button
              onClick={() => setActiveTab('DISPLAY')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'DISPLAY' ? 'bg-slate-900 text-white shadow-sm' : 'pos-card text-slate-600 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-4 h-4 stroke-[1.8]" />
              5. Display Size
            </button>
          </div>
        )}

        {/* TAB: FLOOR PLAN EDITOR (OWNER & RESTO MANAGER) */}
        {activeTab === 'FLOOR' && canEditFloor && (
          <div className="space-y-6">
            <div className="pos-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Floor Layout & Table Configuration</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, rename, adjust capacity, reserve, or mark tables unavailable across Restaurant and Bar
                </p>
              </div>

              <button
                onClick={handleOpenAddTable}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs transition shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add Table to {activeSection?.name || 'Section'}
              </button>
            </div>

            {/* Section Switcher (Restaurant vs Bar Lounge) */}
            <div className="flex gap-3">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`px-6 py-3 rounded-2xl text-xs font-semibold transition flex items-center gap-2.5 ${
                    selectedSectionId === sec.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sec.name.toLowerCase().includes('bar') ? (
                    <Wine className="w-4 h-4 stroke-[2]" />
                  ) : (
                    <UtensilsCrossed className="w-4 h-4 stroke-[2]" />
                  )}
                  <span>{sec.name} ({sec.tables?.length || 0} Tables)</span>
                </button>
              ))}
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(activeSection?.tables || []).map((tbl: any) => {
                const isBilled = tbl.status === 'BILLED';
                const isOccupied = tbl.status === 'OCCUPIED';
                const isAvailable = tbl.status === 'AVAILABLE';

                return (
                  <div
                    key={tbl.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          Table #{tbl.tableNumber.replace(/[^0-9]/g, '') || tbl.tableNumber}
                          {tbl.tableNumber.includes('R') && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                              Reserved
                            </span>
                          )}
                          {tbl.tableNumber.includes('BLOCKED') && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold">
                              Unavailable
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium block mt-0.5">
                          Capacity: {tbl.capacity} Guests
                        </span>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          isBilled
                            ? 'bg-amber-100 text-amber-800'
                            : isOccupied
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tbl.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {tbl.id.slice(-6)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditTable(tbl)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit table details"
                        >
                          <Edit2 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(tbl.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete table"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: STAFF & RIGHTS */}
        {!isBarManager && activeTab === 'USERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            <div className="lg:col-span-7 pos-card p-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Authorized System Users</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Staff members with terminal access codes</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {staff.length} Active Accounts
                </span>
              </div>

              <div className="space-y-3">
                {staff.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{u.name}</h4>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono mt-1 block">
                        PIN: •••• (4 digits)
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 pos-card p-7 space-y-5">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Add Staff Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign access role and PIN</p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Barman"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">4-Digit PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e: any) => setNewUserRole(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white"
                    >
                      <option value="BAR_MANAGER">Bar Manager</option>
                      <option value="RESTO_MANAGER">Resto Manager</option>
                      <option value="CHEF">Head Chef</option>
                      <option value="OWNER">Owner / Admin</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm mt-2"
                >
                  Create User
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: EDIT PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="max-w-xl mx-auto pos-card p-8 space-y-6">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">User Profile Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact info and personal profile details
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                {currentUser?.role?.replace('_', ' ') || 'Staff Member'}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white text-xl font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profileName.slice(0, 1) || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Profile Picture Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={profileAvatarUrl}
                    onChange={(e) => setProfileAvatarUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Security Terminal PIN
                  </label>
                  {isBarManager && !isPinUnlocked && (
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      Authorize Owner to Change
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    disabled={isBarManager && !isPinUnlocked}
                    value={profilePin}
                    onChange={(e) => setProfilePin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-white disabled:bg-slate-200/70 border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {profileSaved && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm mt-2 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 stroke-[2]" />
                Update Profile Details
              </button>
            </form>
          </div>
        )}

        {/* TAB: THEME */}
        {!isBarManager && activeTab === 'THEME' && (
          <div className="max-w-2xl mx-auto pos-card p-8 space-y-6">
            <h3 className="text-base font-semibold text-slate-900">Application Color Theme</h3>
            <div className="grid grid-cols-2 gap-5">
              <div
                onClick={() => {
                  setThemeMode('light');
                  localStorage.setItem('mahotsav_theme', 'light');
                  document.documentElement.classList.remove('dark');
                }}
                className={`p-6 rounded-3xl border cursor-pointer transition select-none ${
                  themeMode === 'light' ? 'border-slate-900 bg-white ring-2 ring-slate-900' : 'border-slate-200'
                }`}
              >
                <Sun className="w-8 h-8 text-amber-500 mb-2" />
                <h4 className="text-base font-semibold text-slate-900">Porcelain Light</h4>
              </div>
              <div
                onClick={() => {
                  setThemeMode('dark');
                  localStorage.setItem('mahotsav_theme', 'dark');
                  document.documentElement.classList.add('dark');
                }}
                className={`p-6 rounded-3xl border cursor-pointer transition select-none bg-[#0b0f17] text-white ${
                  themeMode === 'dark' ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-slate-800'
                }`}
              >
                <Moon className="w-8 h-8 text-indigo-400 mb-2" />
                <h4 className="text-base font-semibold text-white">Midnight Charcoal</h4>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DISPLAY SIZE */}
        {!isBarManager && activeTab === 'DISPLAY' && (
          <div className="max-w-2xl mx-auto pos-card p-8 space-y-6">
            <h3 className="text-base font-semibold text-slate-900">Interface Display & Font Size</h3>
            <div className="grid grid-cols-3 gap-4">
              {['small', 'medium', 'large'].map((scale: any) => (
                <div
                  key={scale}
                  onClick={() => {
                    setDisplayScale(scale);
                    localStorage.setItem('mahotsav_display_scale', scale);
                    const root = document.documentElement;
                    if (scale === 'small') root.style.fontSize = '14px';
                    if (scale === 'medium') root.style.fontSize = '15px';
                    if (scale === 'large') root.style.fontSize = '17px';
                  }}
                  className={`p-5 rounded-3xl border cursor-pointer text-center capitalize font-semibold ${
                    displayScale === scale ? 'border-slate-900 bg-white ring-2 ring-slate-900' : 'border-slate-200'
                  }`}
                >
                  {scale}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW TABLE */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateTableSubmit}
            className="bg-white rounded-3xl p-7 w-full max-w-md space-y-5 shadow-2xl border border-slate-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add Table to {activeSection?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Define table number, capacity, and status</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Table Name / Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 07, T-12, Bar-04, VIP-1"
                value={tableNumberInput}
                onChange={(e) => setTableNumberInput(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Guest Capacity (Seats)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                required
                value={tableCapacityInput}
                onChange={(e) => setTableCapacityInput(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Initial Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTableCustomStatus('AVAILABLE')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                    tableCustomStatus === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Available / Open
                </button>
                <button
                  type="button"
                  onClick={() => setTableCustomStatus('BILLED')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                    tableCustomStatus === 'BILLED'
                      ? 'bg-amber-50 text-amber-900 border-amber-400 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Hold / Maintenance
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingTable}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
            >
              {isSubmittingTable ? 'Adding Table...' : 'Save & Add Table'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: EDIT TABLE (NAME, CAPACITY, RESERVED, UNAVAILABLE) */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleUpdateTableSubmit}
            className="bg-white rounded-3xl p-7 w-full max-w-md space-y-5 shadow-2xl border border-slate-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit Table #{editingTable.tableNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Change name, capacity, or mark as reserved</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Table Name / Number
              </label>
              <input
                type="text"
                required
                value={tableNumberInput}
                onChange={(e) => setTableNumberInput(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Capacity (Seats)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                required
                value={tableCapacityInput}
                onChange={(e) => setTableCapacityInput(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 font-semibold"
              />
            </div>

            {/* Quick Presets: Mark Reserved or Maintenance */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 block">Quick Status Tag</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTableCustomStatus('AVAILABLE');
                    setTableNumberInput((prev) => prev.replace(' (Reserved)', '').replace(' (Unavailable)', ''));
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                    tableCustomStatus === 'AVAILABLE' && !tableNumberInput.includes('(')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Available
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTableCustomStatus('AVAILABLE');
                    if (!tableNumberInput.includes(' (Reserved)')) {
                      setTableNumberInput((prev) => `${prev.replace(' (Unavailable)', '')} (Reserved)`);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                    tableNumberInput.includes('(Reserved)')
                      ? 'bg-amber-50 text-amber-900 border-amber-400'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Reserved
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTableCustomStatus('BILLED');
                    if (!tableNumberInput.includes(' (Unavailable)')) {
                      setTableNumberInput((prev) => `${prev.replace(' (Reserved)', '')} (Unavailable)`);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                    tableNumberInput.includes('(Unavailable)')
                      ? 'bg-rose-50 text-rose-900 border-rose-400'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Unavailable
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteTable(editingTable.id)}
                className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                title="Delete this table"
              >
                <Trash2 className="w-5 h-5 stroke-[1.8]" />
              </button>

              <button
                type="submit"
                disabled={isSubmittingTable}
                className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-sm"
              >
                {isSubmittingTable ? 'Saving...' : 'Save Table Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: OWNER AUTHENTICATION FOR BAR MANAGER PIN CHANGE */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleAuthorizeOwner}
            className="bg-white rounded-3xl p-7 w-full max-w-md space-y-5 shadow-2xl border border-slate-200 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 stroke-[2]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Owner Authorization Required</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the Owner / Admin 4-digit PIN to authorize changing this Bar Manager PIN.
              </p>
            </div>

            <div>
              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                placeholder="Owner PIN (••••)"
                value={ownerPinAttempt}
                onChange={(e) => setOwnerPinAttempt(e.target.value)}
                className="w-full text-center bg-slate-100 border border-slate-200 rounded-2xl py-3 text-xl font-mono tracking-widest text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
              {authError && (
                <span className="text-xs font-semibold text-rose-600 block mt-2">
                  {authError}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setOwnerPinAttempt('');
                  setAuthError('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                Verify & Unlock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}