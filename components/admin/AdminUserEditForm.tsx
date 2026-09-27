"use client";

import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { 
    Save, 
    UserCog, 
    ShieldAlert, 
    CheckCircle2, 
    XCircle, 
    Building2, 
    Search, 
    Plus, 
    X, 
    AlertTriangle, 
    AlertCircle, 
    ArrowRight, 
    Loader2 
} from "lucide-react";
import { updateAdminUser } from "@/lib/User/admin/adminUserUpdate";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface InstituteItem {
    id: string;
    name: string;
}

const ROLE_LABELS: Record<string, string> = {
    USER: "Standard User",
    SALES_MANAGER: "Sales Manager",
    INSTITUTE_MANAGER: "Institute Manager",
    ADMIN: "Administrator",
};

export default function AdminUserEditForm({ 
    user, 
    allInstitutes = [] 
}: { 
    user: any; 
    allInstitutes?: InstituteItem[];
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(user.name || "");
    const [phone, setPhone] = useState(user.phone || "");
    const [role, setRole] = useState<string>(user.role || "USER");
    const [isActive, setIsActive] = useState(user.isActive);
    const [canAddInstitute, setCanAddInstitute] = useState(user.canAddInstitute);

    // Initial managed institutes
    const initialManagedInstitutes: InstituteItem[] = useMemo(() => {
        if (!user.managedInstitutes || !Array.isArray(user.managedInstitutes)) return [];
        return user.managedInstitutes
            .map((m: any) => ({
                id: m.instituteId || m.institute?.id,
                name: m.institute?.name || "Institute"
            }))
            .filter((item: InstituteItem) => Boolean(item.id));
    }, [user.managedInstitutes]);

    // Selected institutes for INSTITUTE_MANAGER
    const [selectedInstitutes, setSelectedInstitutes] = useState<InstituteItem[]>(initialManagedInstitutes);
    const [searchQuery, setSearchQuery] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Available institutes filtered by search and excluding already selected
    const availableInstitutes = useMemo(() => {
        const selectedIds = new Set(selectedInstitutes.map((i) => i.id));
        const filtered = allInstitutes.filter((inst) => !selectedIds.has(inst.id));
        if (!searchQuery.trim()) return filtered;
        const q = searchQuery.toLowerCase();
        return filtered.filter((inst) => inst.name.toLowerCase().includes(q));
    }, [allInstitutes, selectedInstitutes, searchQuery]);

    const handleAddInstitute = (inst: InstituteItem) => {
        setSelectedInstitutes((prev) => [...prev, inst]);
        setSearchQuery("");
    };

    const handleRemoveInstitute = (id: string) => {
        setSelectedInstitutes((prev) => prev.filter((i) => i.id !== id));
    };

    // Actual execute save function
    const executeSave = async () => {
        setIsLoading(true);
        setIsConfirmOpen(false);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("role", role);
        formData.append("isActive", String(isActive));
        formData.append("canAddInstitute", String(canAddInstitute));
        formData.append("instituteIds", JSON.stringify(selectedInstitutes.map((i) => i.id)));

        const result = await updateAdminUser(user.id, formData);

        if (result.success) {
            toast.success(result.message || "User data updated successfully!");
        } else {
            toast.error(result.error || "Cannot update user details.");
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 1. Validation: If INSTITUTE_MANAGER, minimum 1 institute must be selected
        if (role === "INSTITUTE_MANAGER" && selectedInstitutes.length === 0) {
            toast.error("Please select at least one institute for Institute Manager.");
            return;
        }

        // 2. If role has changed, trigger confirmation dialog
        if (role !== user.role) {
            setIsConfirmOpen(true);
            return;
        }

        // 3. Otherwise save directly
        await executeSave();
    };

    const isDemotingFromManager = user.role === "INSTITUTE_MANAGER" && role !== "INSTITUTE_MANAGER";
    const hadManagedInstitutes = initialManagedInstitutes.length > 0;

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                    <UserCog className="w-5 h-5 text-amber-500" /> Edit Profile & Permissions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                        <Input 
                            name="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Unknown" 
                            className="rounded-xl border-slate-200 bg-slate-50 font-semibold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                        <Input 
                            name="phone" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                            placeholder="N/A" 
                            className="rounded-xl border-slate-200 bg-slate-50 font-semibold"
                        />
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Platform Role</label>
                        <select 
                            name="role" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                        >
                            <option value="USER">Standard User</option>
                            <option value="SALES_MANAGER">Sales Manager</option>
                            <option value="INSTITUTE_MANAGER">Institute Manager</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                    </div>

                    {/* 🚀 Immediate Warning when changing away from Institute Manager */}
                    {isDemotingFromManager && hadManagedInstitutes && (
                        <div className="col-span-1 md:col-span-2 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1.5 flex-1">
                                <p className="font-bold text-sm text-amber-900">
                                    Automatic Institute Removal Warning
                                </p>
                                <p className="text-amber-800 leading-relaxed">
                                    Changing role from <strong>Institute Manager</strong> to <strong>{ROLE_LABELS[role] || role}</strong> will automatically remove this user from all <strong>{initialManagedInstitutes.length}</strong> assigned institute(s):
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {initialManagedInstitutes.map((inst) => (
                                        <span key={inst.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-bold text-amber-900 shadow-2xs">
                                            <Building2 className="w-3 h-3 text-amber-600" />
                                            {inst.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🚀 Dedicated Institute Assignment Section for INSTITUTE_MANAGER */}
                    {role === "INSTITUTE_MANAGER" && (
                        <div className="col-span-1 md:col-span-2 p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/20 rounded-2xl border border-amber-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-amber-600" />
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Assigned Institutes <span className="text-rose-600">* (Minimum 1 Required)</span>
                                    </label>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                    selectedInstitutes.length > 0 
                                        ? "bg-amber-100 text-amber-800 border-amber-200" 
                                        : "bg-rose-100 text-rose-800 border-rose-200"
                                }`}>
                                    {selectedInstitutes.length} selected
                                </span>
                            </div>

                            {/* Selected Institutes Tag List */}
                            {selectedInstitutes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedInstitutes.map((inst) => (
                                        <span 
                                            key={inst.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 shadow-2xs group"
                                        >
                                            <Building2 className="w-3.5 h-3.5 text-amber-600" />
                                            <span className="max-w-[200px] truncate">{inst.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveInstitute(inst.id)}
                                                className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded-md hover:bg-rose-50 transition-colors"
                                                title="Remove institute"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-xl border border-dashed border-rose-300 bg-rose-50/70 text-rose-700 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span className="font-semibold">No institute selected yet. You must assign at least 1 institute for an Institute Manager.</span>
                                </div>
                            )}

                            {/* Search and Add Institute Input */}
                            <div className="space-y-2 pt-1 border-t border-amber-200/50">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Search & Add Institute</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Type to search institute name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                    {/* Direct Dropdown Quick Select */}
                                    <select
                                        onChange={(e) => {
                                            const found = allInstitutes.find(i => i.id === e.target.value);
                                            if (found) handleAddInstitute(found);
                                            e.target.value = "";
                                        }}
                                        defaultValue=""
                                        className="border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-amber-500 max-w-[180px]"
                                    >
                                        <option value="" disabled>-- Quick Add --</option>
                                        {availableInstitutes.map((inst) => (
                                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dynamic Filtered Dropdown list if searching */}
                                {searchQuery.trim().length > 0 && (
                                    <div className="max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-lg divide-y divide-slate-100">
                                        {availableInstitutes.length > 0 ? (
                                            availableInstitutes.slice(0, 10).map((inst) => (
                                                <button
                                                    key={inst.id}
                                                    type="button"
                                                    onClick={() => handleAddInstitute(inst)}
                                                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between transition-colors"
                                                >
                                                    <span className="truncate">{inst.name}</span>
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                                                        <Plus className="w-3 h-3" /> Add
                                                    </span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-xs text-slate-400 font-medium">
                                                No unassigned institutes match "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Powerful Toggles */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    {/* Active Status */}
                    <div
                        onClick={() => setIsActive(!isActive)}
                        className={`flex-1 flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
                    >
                        <div>
                            <div className={`font-bold text-sm ${isActive ? 'text-emerald-800' : 'text-red-800'}`}>Account Status</div>
                            <div className={`text-xs ${isActive ? 'text-emerald-600' : 'text-red-600'}`}>{isActive ? 'User can log in normally' : 'Account is banned/suspended'}</div>
                        </div>
                        {isActive ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                    </div>

                    {/* Add Institute Permission */}
                    <div
                        onClick={() => setCanAddInstitute(!canAddInstitute)}
                        className={`flex-1 flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${canAddInstitute ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <div>
                            <div className={`font-bold text-sm ${canAddInstitute ? 'text-purple-800' : 'text-slate-700'}`}>Create Listing Pass</div>
                            <div className={`text-xs ${canAddInstitute ? 'text-purple-600' : 'text-slate-500'}`}>{canAddInstitute ? 'Can submit new institutes' : 'Standard limits applied'}</div>
                        </div>
                        {canAddInstitute ? <CheckCircle2 className="w-6 h-6 text-purple-500" /> : <ShieldAlert className="w-6 h-6 text-slate-400" />}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-8 font-bold gap-2 shadow-sm transition-all"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Save Changes</>
                        )}
                    </Button>
                </div>
            </form>

            {/* 🚀 Confirm Role Change Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="bg-white border-slate-200 sm:max-w-md rounded-3xl p-6 shadow-xl">
                    <AlertDialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                isDemotingFromManager && hadManagedInstitutes
                                    ? "bg-rose-100 text-rose-600"
                                    : "bg-amber-100 text-amber-600"
                            }`}>
                                {isDemotingFromManager && hadManagedInstitutes ? (
                                    <AlertTriangle className="w-5 h-5" />
                                ) : (
                                    <Building2 className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <AlertDialogTitle className="text-lg font-bold text-slate-900">
                                    Confirm Role Change
                                </AlertDialogTitle>
                                <p className="text-xs text-slate-500">
                                    For user: <strong className="text-slate-700">{user.name || user.email}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Role Transition Badges */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-center flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Role</span>
                                <span className="text-xs font-bold text-slate-700">{ROLE_LABELS[user.role] || user.role}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-2" />
                            <div className="text-center flex-1">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">New Role</span>
                                <span className="text-xs font-bold text-amber-700">{ROLE_LABELS[role] || role}</span>
                            </div>
                        </div>

                        {/* Detailed Notice */}
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-xs text-slate-600">
                                {isDemotingFromManager && hadManagedInstitutes ? (
                                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                                        <p className="font-bold flex items-center gap-1.5 text-rose-800">
                                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                            Warning: All Managed Institutes Will Be Removed
                                        </p>
                                        <p className="leading-relaxed">
                                            Changing role to <strong>{ROLE_LABELS[role] || role}</strong> will <strong>automatically remove</strong> this user from managing the following {initialManagedInstitutes.length} institute(s):
                                        </p>
                                        <ul className="list-disc list-inside space-y-0.5 font-semibold text-rose-800 pl-1">
                                            {initialManagedInstitutes.map((inst) => (
                                                <li key={inst.id} className="truncate">{inst.name}</li>
                                            ))}
                                        </ul>
                                        <p className="text-[11px] text-rose-700 pt-1 font-medium">
                                            All their administrative permissions and access to institute dashboards will be revoked immediately.
                                        </p>
                                    </div>
                                ) : role === "INSTITUTE_MANAGER" ? (
                                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
                                        <p className="font-bold text-amber-800 flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                                            Assigning Management Access
                                        </p>
                                        <p className="leading-relaxed">
                                            This user will be assigned as <strong>Institute Manager</strong> for <strong>{selectedInstitutes.length} institute(s)</strong>:
                                        </p>
                                        <ul className="list-disc list-inside space-y-0.5 font-semibold text-amber-800 pl-1">
                                            {selectedInstitutes.map((inst) => (
                                                <li key={inst.id} className="truncate">{inst.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-slate-600 leading-relaxed">
                                        Are you sure you want to change this user's platform role from <strong>{ROLE_LABELS[user.role] || user.role}</strong> to <strong>{ROLE_LABELS[role] || role}</strong>?
                                    </p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="mt-5 sm:flex sm:items-center sm:justify-end gap-2">
                        <AlertDialogCancel 
                            disabled={isLoading} 
                            className="rounded-xl border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <button
                            type="button"
                            onClick={executeSave}
                            disabled={isLoading}
                            className={`inline-flex items-center justify-center rounded-xl text-xs font-bold h-9 px-4 py-2 transition-all shadow-sm ${
                                isDemotingFromManager && hadManagedInstitutes
                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : "bg-amber-500 hover:bg-amber-600 text-white"
                            }`}
                        >
                            {isLoading ? (
                                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Updating...</>
                            ) : (
                                "Confirm Role Change"
                            )}
                        </button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}