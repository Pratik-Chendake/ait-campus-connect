import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Calendar, Briefcase, Award, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SavedItems() {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, [user]);

  async function loadSaved() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/saved');
      setSavedItems(res.saved_items || []);
    } catch (err) {
      console.error('Failed to load saved items:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = async (itemType, itemId) => {
    try {
      await api.post('/saved/toggle', { item_type: itemType, item_id: itemId });
      setSavedItems(savedItems.filter(i => !(i.item_type === itemType && i.item_id === itemId)));
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
          <Bookmark className="w-3.5 h-3.5 text-blue-600" />
          Personal Library
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Saved Opportunities & Clubs
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Quickly review bookmarked hackathons, internships, scholarships, and campus clubs.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading saved bookmarks...</p>
        </div>
      ) : savedItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No saved items in your library</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click the bookmark icon on any opportunity card to save it for later.
          </p>
          <Link
            to="/opportunities"
            className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs inline-block"
          >
            Explore Opportunities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => {
            const data = item.data;
            if (!data) return null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {item.item_type}
                    </span>
                    <button
                      onClick={() => handleRemove(item.item_type, item.item_id)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                    {data.title || data.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {data.description || data.provider || data.company}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                  <Link
                    to={
                      item.item_type === 'EVENT' || item.item_type === 'HACKATHON'
                        ? `/event/${data.id}`
                        : item.item_type === 'CLUB'
                        ? `/club/${data.id}`
                        : '/opportunities'
                    }
                    className="font-bold text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
