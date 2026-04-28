"use client";

import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { useManga } from "@/hooks/useManga";
import { Manga } from "@/types";
import { MangaModal } from "@/components/admin/MangaModal";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import toast from "react-hot-toast";

export default function MangaManagementPage() {
  const { manga, loading } = useManga();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);

  const handleEdit = (m: Manga) => {
    setSelectedManga(m);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedManga(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this manga? This will also delete all its chapters.")) {
      try {
        await deleteDoc(doc(db, Collections.MANGA, id));
        toast.success("Manga deleted successfully");
      } catch (error: any) {
        toast.error("Failed to delete: " + error.message);
      }
    }
  };

  const filteredManga = manga.filter(m => 
    m.nameEn.toLowerCase().includes(search.toLowerCase()) || 
    m.nameAr.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manga Management</h1>
          <p className="text-sm text-dark-subtext mt-1">Add, edit, and organize all manga series.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-primary text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Manga
        </button>
      </div>

      <div className="bg-[#0B0B0E] rounded-2xl border border-white/5 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-subtext" />
            <input 
              type="text" 
              placeholder="Search by title..." 
              className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 bg-black border border-white/10 rounded-xl text-sm font-medium text-white flex items-center gap-2 hover:border-white/20 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark-subtext">
            <thead className="bg-black/50 text-xs uppercase font-semibold text-white">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Chapters</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredManga.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-14 bg-dark-muted rounded overflow-hidden shadow-lg border border-white/5">
                      {item.posterURL ? (
                        <img src={item.posterURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Plus className="w-4 h-4 opacity-20" /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white line-clamp-1">{item.nameEn}</p>
                      <p className="text-xs line-clamp-1">{item.nameAr}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      item.status === 'ongoing' ? 'bg-primary/10 text-primary border border-primary/20' : 
                      item.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{item.totalChapters}</td>
                  <td className="px-6 py-4">{item.totalViews.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white mr-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredManga.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">No manga found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MangaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        manga={selectedManga}
      />
    </div>
  );
}
