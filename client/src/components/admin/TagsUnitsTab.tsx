// src/components/admin/TagsUnitsTab.tsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../../utils/apiConfig';
import { fetchWithAuth } from '../../utils/apiClient';
import { useConfirm } from '../../context/ConfirmContext';

export const TagsUnitsTab = () => {
    const { confirm } = useConfirm();
    const [tags, setTags] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [modifiers, setModifiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newTag, setNewTag] = useState({ name: '', code: '' });
    const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '' });
    const [newModifier, setNewModifier] = useState({ name: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/recipes/taxonomy`);
            const result = await res.json();
            if (result.status === 'success') {
                setTags(result.data.tags || []);
                setUnits(result.data.units || []);
                setModifiers(result.data.modifiers || []);
            }
        } catch (error) {
            toast.error('Failed to load taxonomy data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Handlers for Tags ---
    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTag)
            });
            if (res.ok) {
                toast.success('Tag added!');
                setNewTag({ name: '', code: '' });
                fetchData();
            } else {
                toast.error('Failed to add tag');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTag = async (id: string) => {
         const isConfirmed = await confirm({
            title: "Delete this tag?",
            message: `Are you sure you want to delete this tag?`,
            confirmText: "Yes",
            variant: "warning"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/tags/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Tag deleted');
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- Handlers for Units ---
    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUnit)
            });
            if (res.ok) {
                toast.success('Unit added!');
                setNewUnit({ name: '', abbreviation: '' });
                fetchData();
            } else {
                toast.error('Failed to add unit');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteUnit = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete this unit?",
            message: `Delete this unit? Ingredients using this unit might break.`,
            confirmText: "Yes",
            variant: "warning"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/units/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Unit deleted');
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- Handlers for Modifiers ---
    const handleAddModifier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/modifiers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newModifier)
            });
            if (res.ok) {
                toast.success('Modifier added!');
                setNewModifier({ name: '' });
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to add modifier');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteModifier = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete this modifier?",
            message: `Delete this modifier? Recipes currently using this modifier will lose the description.`,
            confirmText: "Yes",
            variant: "warning"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetchWithAuth(`${API_BASE}/admin/modifiers/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Modifier deleted');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to delete modifier');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center py-10 font-bold text-gray-400">Loading taxonomy...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* TAGS SECTION */}
            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                <h2 className="text-xl font-black text-gray-900 mb-6">Dietary Tags</h2>
                
                <form onSubmit={handleAddTag} className="flex gap-2 mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <input 
                        type="text" 
                        placeholder="Name (e.g. Vegan)" 
                        value={newTag.name}
                        onChange={e => setNewTag({...newTag, name: e.target.value})}
                        className="flex-1 min-w-0 p-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm font-bold text-gray-700"
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Code" 
                        value={newTag.code}
                        onChange={e => setNewTag({...newTag, code: e.target.value})}
                        className="w-16 p-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm font-bold text-gray-700 uppercase text-center"
                        required 
                    />
                    <button type="submit" className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                        Add
                    </button>
                </form>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 flex-1">
                    {tags.map(tag => (
                        <div key={tag.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">{tag.code}</span>
                                <span className="font-bold text-gray-700">{tag.name}</span>
                            </div>
                            <button 
                                onClick={() => handleDeleteTag(tag.id)}
                                className="text-gray-300 hover:text-red-500 font-bold text-sm px-3 py-1 bg-white rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* UNITS SECTION */}
            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                <h2 className="text-xl font-black text-gray-900 mb-6">Measurement Units</h2>
                
                <form onSubmit={handleAddUnit} className="flex gap-2 mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <input 
                        type="text" 
                        placeholder="Name (e.g. Ounce)" 
                        value={newUnit.name}
                        onChange={e => setNewUnit({...newUnit, name: e.target.value})}
                        className="flex-1 min-w-0 p-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm font-bold text-gray-700"
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Abbr" 
                        value={newUnit.abbreviation}
                        onChange={e => setNewUnit({...newUnit, abbreviation: e.target.value})}
                        className="w-16 p-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm font-bold text-gray-700 text-center"
                        required 
                    />
                    <button type="submit" className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                        Add
                    </button>
                </form>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 flex-1">
                    {units.map(unit => (
                        <div key={unit.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-700">{unit.name}</span>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-200/50 px-2 py-1 rounded-md">{unit.abbreviation}</span>
                            </div>
                            <button 
                                onClick={() => handleDeleteUnit(unit.id)}
                                className="text-gray-300 hover:text-red-500 font-bold text-sm px-3 py-1 bg-white rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* MODIFIERS SECTION */}
            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                <h2 className="text-xl font-black text-gray-900 mb-6">Prep Modifiers</h2>
                
                <form onSubmit={handleAddModifier} className="flex gap-2 mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <input 
                        type="text" 
                        placeholder="Name (e.g. Minced)" 
                        value={newModifier.name}
                        onChange={e => setNewModifier({ name: e.target.value })}
                        className="flex-1 min-w-0 p-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 text-sm font-bold text-gray-700"
                        required 
                    />
                    <button type="submit" className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                        Add
                    </button>
                </form>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 flex-1">
                    {modifiers.map(modifier => (
                        <div key={modifier.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors group">
                            <span className="font-bold text-gray-700">{modifier.name}</span>
                            <button 
                                onClick={() => handleDeleteModifier(modifier.id)}
                                className="text-gray-300 hover:text-red-500 font-bold text-sm px-3 py-1 bg-white rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                    
                    {modifiers.length === 0 && (
                        <p className="text-center text-sm font-bold text-gray-400 mt-10">No modifiers added yet.</p>
                    )}
                </div>
            </section>
            
        </div>
    );
};
