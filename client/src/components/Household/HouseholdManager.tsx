import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../utils/apiClient';
import { API_BASE } from '../../utils/apiConfig';
import { toast } from 'react-hot-toast';

export const HouseholdManager = () => {
    const { user, switchHousehold } = useAuth();
    
    const [householdData, setHouseholdData] = useState<any>(null);
    const [myInvites, setMyInvites] = useState<any[]>([]);
    const [inviteLink, setInviteLink] = useState<string>("");
    
    const [inviteEmail, setInviteEmail] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    const fetchAllData = async () => {
        try {
            const [hhRes, invRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/household`),
                fetchWithAuth(`${API_BASE}/household/invites/me`)
            ]);
            
            if (hhRes.ok) {
                const data = await hhRes.json();
                setHouseholdData(data.data);
                setEditNameValue(data.data.name);
            }
            if (invRes.ok) {
                const invData = await invRes.json();
                setMyInvites(invData.data);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchAllData(); }, [user?.activeHouseholdId]);

    const myRole = householdData?.members?.find((m: any) => m.user.id === user?.id)?.role;
    const isPrivileged = myRole === 'OWNER' || myRole === 'ADMIN';

    const handleUpdateName = async () => {
        try {
            await fetchWithAuth(`${API_BASE}/household/name`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editNameValue })
            });
            setIsEditingName(false);
            toast.success("Household name updated");
            fetchAllData();
        } catch (err) { toast.error("Failed to update name"); }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${API_BASE}/household/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail || undefined }) // Send generic if empty
            });
            const result = await res.json();

            if (res.ok) {
                setInviteLink(result.data.inviteLink);
                setInviteEmail('');
                toast.success(inviteEmail ? "Invite sent & link generated!" : "Generic link generated!");
                fetchAllData();
            } else {
                toast.error(result.message || "Failed to generate link");
            }
        } catch (err) { toast.error("Failed to invite"); }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!confirm("Revoke this invitation?")) return;
        try {
            await fetchWithAuth(`${API_BASE}/household/invites/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId })
            });
            toast.success("Invite revoked");
            fetchAllData();
        } catch (err) { toast.error("Failed to revoke invite"); }
    };

    const handleRemoveMember = async (targetUserId: string) => {
        if (!confirm("Remove this member?")) return;
        try {
            await fetchWithAuth(`${API_BASE}/household/remove-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            });
            toast.success("Member removed");
            fetchAllData();
        } catch (err) { toast.error("Failed to remove member"); }
    };

    const handleToggleRole = async (targetUserId: string) => {
        try {
            await fetchWithAuth(`${API_BASE}/household/toggle-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            });
            toast.success("Member role updated");
            fetchAllData();
        } catch (err) { 
            toast.error("Failed to update member role"); 
        }
    };

    const handleLeaveHousehold = async () => {
        if (!confirm("Are you sure you want to leave this household? You will be placed in a new personal household.")) return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/household/leave`, { method: 'POST' });
            const result = await res.json();
            if (res.ok) {
                toast.success("Left household");
                await switchHousehold(result.data.newHouseholdId);
            }
        } catch (err) { toast.error("Failed to leave household"); }
    };

    const handleAcceptInvite = async (token: string) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/household/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const result = await res.json();
            if (res.ok) {
                toast.success("Joined new household!");
                await switchHousehold(result.data.householdId);
            }
        } catch (err) { toast.error("Failed to join"); }
    };

    const handleRejectInvite = async (inviteId: string) => {
        try {
            await fetchWithAuth(`${API_BASE}/household/invites/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId })
            });
            toast.success("Invite rejected");
            fetchAllData();
        } catch (err) { toast.error("Failed to reject"); }
    };

    if (!householdData) return <div className="animate-pulse">Loading household...</div>;

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* INBOUND INVITES */}
            {myInvites.length > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-200">
                    <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                        <span>🔔</span> Pending Invitations
                    </h3>
                    <ul className="space-y-2">
                        {myInvites.map(inv => (
                            <li key={inv.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm gap-3">
                                <span className="font-medium text-sm text-center sm:text-left">Join <strong>{inv.household.name}</strong>?</span>
                                <div className="flex gap-2 justify-center sm:justify-end w-full sm:w-auto">
                                    <button onClick={() => handleAcceptInvite(inv.token)} className="flex-1 sm:flex-none text-xs bg-green-500 text-white px-4 py-2 sm:py-1.5 rounded-lg sm:rounded hover:bg-green-600 font-bold">Accept</button>
                                    <button onClick={() => handleRejectInvite(inv.id)} className="flex-1 sm:flex-none text-xs bg-red-100 text-red-600 px-4 py-2 sm:py-1.5 rounded-lg sm:rounded hover:bg-red-200 font-bold">Decline</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* HOUSEHOLD HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 gap-4 sm:gap-0">
                {isEditingName ? (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1 sm:mr-4">
                        <input 
                            value={editNameValue} 
                            onChange={(e) => setEditNameValue(e.target.value)}
                            className="w-full sm:flex-1 p-2.5 sm:p-2 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 outline-none focus:border-orange-500 text-sm"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleUpdateName} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 sm:py-1 rounded-lg text-sm font-bold">Save</button>
                            <button onClick={() => setIsEditingName(false)} className="flex-1 sm:flex-none bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 sm:py-1 rounded-lg text-sm font-bold">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="flex justify-between w-full items-start">
                            <div>
                                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Active Household</p>
                                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 mt-0.5">
                                    {householdData.name}
                                </h3>
                            </div>
                            {isPrivileged && (
                                <button onClick={() => setIsEditingName(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">✏️ Edit</button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MEMBERS LIST */}
            <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Members</h3>
                <ul className="space-y-2">
                    {householdData.members.map((m: any) => (
                        <li key={m.user.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 sm:p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900/50 gap-3 sm:gap-0">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">{m.user.alias || m.user.firstName || m.user.email}</span>
                                {m.user.id === user?.id && <span className="bg-blue-100 text-blue-800 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold">YOU</span>}
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
                                    {m.role}
                                </span>
                            </div>
                            
                            <div className="flex gap-2 w-full sm:w-auto">
                                {myRole === 'OWNER' && m.user.id !== user?.id && m.role !== 'OWNER' && (
                                    <button 
                                        onClick={() => handleToggleRole(m.user.id)} 
                                        className="flex-1 sm:flex-none text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-3 py-2 sm:py-1 rounded-lg font-bold transition-colors"
                                    >
                                        {m.role === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
                                    </button>
                                )}
                                {isPrivileged && m.user.id !== user?.id && m.role !== 'OWNER' && (
                                    <button onClick={() => handleRemoveMember(m.user.id)} className="flex-1 sm:flex-none text-xs text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-2 sm:py-1 rounded-lg font-bold transition-colors">
                                        Remove Member
                                    </button>
                                )}
                                {householdData.members.length > 1 && m.user.id === user?.id && (
                                    <button onClick={handleLeaveHousehold} className="flex-1 sm:flex-none text-xs text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-2 sm:py-1 rounded-lg font-bold transition-colors">
                                        Leave Household
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* INVITE NEW MEMBER */}
            {isPrivileged && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Invite Someone New</h3>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input 
                            type="email" 
                            required // <-- Add this back
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter recipient email..."
                            className="flex-1 p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 outline-none focus:border-orange-500"
                        />
                        <button type="submit" className="px-6 py-3 bg-gray-900 dark:bg-orange-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition">
                            Generate Link
                        </button>
                    </form>

                    {inviteLink && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 flex flex-col gap-2">
                            <p className="text-sm font-bold text-green-800 dark:text-green-400">Success! Send this link:</p>
                            <input 
                                readOnly 
                                value={inviteLink} 
                                className="w-full p-2.5 text-sm bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg outline-none font-medium text-gray-700 dark:text-gray-300"
                                onClick={(e) => e.currentTarget.select()}
                            />
                        </div>
                    )}

                    {/* OUTBOUND PENDING INVITES */}
                    {householdData.invites?.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pending Outbound Links</h4>
                            <ul className="space-y-2">
                                {householdData.invites.map((inv: any) => (
                                    <li key={inv.id} className="text-xs flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 gap-2 sm:gap-0">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{inv.email || 'Generic Link'}</span>
                                            <span className="text-gray-500">Expires in {Math.ceil((new Date(inv.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</span>
                                        </div>
                                        <button 
                                            onClick={() => handleRevokeInvite(inv.id)} 
                                            className="text-red-500 hover:text-red-700 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md w-full sm:w-auto mt-2 sm:mt-0"
                                        >
                                            Revoke
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
