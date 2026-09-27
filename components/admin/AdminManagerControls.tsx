"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Building2, Loader2, Search, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { addManagerRelation, removeManagerRelation, searchInstitutesForAdmin } from "@/lib/User/admin/adminUserUpdate"; 
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface InstituteItem {
    id: string;
    name: string;
}

export default function ManagerControl({ 
    userId, 
    managedInstitutes, 
    allInstitutes 
}: { 
    userId: string;
    managedInstitutes: any[];
    allInstitutes?: any[];
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<InstituteItem[]>([]);
    const [selectedInstitute, setSelectedInstitute] = useState<InstituteItem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [targetInstitute, setTargetInstitute] = useState({ id: "", name: "" });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close search dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 🚀 Debounced Server-side Institute Search (Instant & Lag-Free)
    useEffect(() => {
        const query = searchQuery.trim();
        if (query.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const results = await searchInstitutesForAdmin(query);
                // Exclude already managed institutes
                const managedSet = new Set(managedInstitutes.map((mi) => mi.instituteId));
                const filtered = results.filter((r) => !managedSet.has(r.id));
                setSearchResults(filtered);
                setIsDropdownOpen(true);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [searchQuery, managedInstitutes]);

    const handleSelect = (inst: InstituteItem) => {
        setSelectedInstitute(inst);
        setSearchQuery("");
        setIsDropdownOpen(false);
        setSearchResults([]);
    };

    const handleAdd = async () => {
        if (!selectedInstitute) return toast.error("Please select an institute first.");
        setIsLoading(true);
        const res = await addManagerRelation(userId, selectedInstitute.id);
        if (res.success) {
            toast.success(res.message || "Successfully added to institute");
            setSelectedInstitute(null);
            setSearchQuery("");
            setSearchResults([]);
        } else {
            toast.error(res.error || "Cannot add institute");
        }
        setIsLoading(false);
    };

    const executeRemove = async () => {
        setIsLoading(true);
        setIsConfirmOpen(false);
        const res = await removeManagerRelation(userId, targetInstitute.id);
        if (res.success) toast.success(res.message || "Successfully removed access");
        else toast.error(res.error || "Cannot remove access");
        setIsLoading(false);
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-stone-200/60 shadow-sm space-y-4 max-w-full overflow-hidden">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2">
                <Building2 className="w-5 h-5 text-amber-500" /> Managed Institutes Workspace
            </h3>

            {/* Current Managed List */}
            {managedInstitutes.length > 0 ? (
                <ul className="space-y-2">
                    {managedInstitutes.map((mi) => (
                        <li key={mi.instituteId} className="text-sm p-3 bg-stone-50/50 border border-stone-100 rounded-xl flex items-center justify-between group">
                            <span className="font-semibold text-stone-700 truncate mr-2 min-w-0">{mi.institute?.name}</span>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                    setTargetInstitute({ id: mi.instituteId, name: mi.institute?.name || "Institute" });
                                    setIsConfirmOpen(true);
                                }}
                                disabled={isLoading}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-slate-400 p-2 text-center bg-slate-50 rounded-xl border border-dashed">Not managing any institute currently.</p>
            )}

            {/* 🚀 Snappy Debounced Search & Assign */}
            <div className="pt-4 mt-2 border-t border-stone-100 space-y-3" ref={containerRef}>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Assign New Institute</label>
                
                <div className="flex flex-col gap-2 relative">
                    {/* Search Input Box */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Type institute name (min 2 letters)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) setIsDropdownOpen(true);
                            }}
                            className="w-full pl-9 pr-9 py-2 bg-stone-50 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-stone-800 transition-all placeholder:text-stone-400"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
                        )}
                    </div>

                    {/* Floating Search Results Dropdown */}
                    {isDropdownOpen && searchQuery.trim().length >= 2 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-xl divide-y divide-stone-100 animate-in fade-in-0 duration-100">
                            {searchResults.length > 0 ? (
                                searchResults.map((inst) => (
                                    <button
                                        key={inst.id}
                                        type="button"
                                        onClick={() => handleSelect(inst)}
                                        className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between transition-colors group"
                                    >
                                        <span className="truncate flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 shrink-0" />
                                            {inst.name}
                                        </span>
                                        <span className="text-[11px] font-bold text-amber-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Select
                                        </span>
                                    </button>
                                ))
                            ) : !isSearching ? (
                                <div className="p-3 text-center text-xs text-stone-400">
                                    No matching institutes found
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Selected Institute Card & Assign Action */}
                    {selectedInstitute ? (
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2 animate-in fade-in-50">
                            <div className="flex items-center gap-2 min-w-0">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="text-xs font-bold text-amber-900 truncate">
                                    {selectedInstitute.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    size="sm"
                                    onClick={handleAdd}
                                    disabled={isLoading}
                                    className="bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold h-8 px-3 rounded-lg shadow-sm"
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Assign"}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedInstitute(null)}
                                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-amber-100 transition-colors"
                                    title="Clear selection"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
            
            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={executeRemove}
                title={`Remove access to ${targetInstitute.name}?`}
                description="This manager will no longer be able to access this institute's dashboard."
                destructive={true}
                confirmText="Remove Access"
            />
        </div>
    );
}