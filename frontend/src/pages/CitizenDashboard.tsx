import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Megaphone,
  User,
  PlusCircle,
  TrendingUp,
  MapPin,
  List,
  Heart,
  Eye,
  AlertTriangle,
  Upload,
  Grid,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VirtualMap, { Complaint } from '../components/VirtualMap';
import StatusBadge from '../components/StatusBadge';
import { useNavigate } from 'react-router-dom';

export interface CivicUpdate {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  officerName: string;
  departmentName: string;
}

export const CitizenDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [updates, setUpdates] = useState<CivicUpdate[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'followed' | 'updates'>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'trending'>('recent');
  
  // Create complaint state
  const [showReportModal, setShowReportModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    axios.get(`/api/complaints?sort=${sortOrder === 'trending' ? 'trending' : 'recent'}`)
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error(err));

    axios.get('/api/civic-updates')
      .then((res) => setUpdates(res.data))
      .catch((err) => console.error(err));
  }, [sortOrder, refreshTrigger]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!category) {
      setSubmitError('Please pick a category.');
      return;
    }
    if (lat === undefined || lng === undefined) {
      setSubmitError('Please select a location on the district grid map.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('lat', String(lat));
    formData.append('lng', String(lng));
    if (imageFile) formData.append('image', imageFile);

    try {
      await axios.post('/api/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      setTitle('');
      setDescription('');
      setCategory('');
      setLat(undefined);
      setLng(undefined);
      setImageFile(null);
      setImagePreview(null);
      setShowReportModal(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      const raw = err.response?.data?.error;
      const msg =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
          ? raw.map((e: any) => e.message || JSON.stringify(e)).join(', ')
          : 'Failed to submit complaint.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteToggle = async (id: number) => {
    try {
      const res = await axios.post(`/api/complaints/${id}/vote`);
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const hasVoted = res.data.voted;
            const updatedVotes = hasVoted
              ? [...c.votes, user!.id]
              : c.votes.filter((uid) => uid !== user!.id);
            return {
              ...c,
              votes: updatedVotes,
              votesCount: updatedVotes.length,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = async (id: number) => {
    try {
      const res = await axios.post(`/api/complaints/${id}/follow`);
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const hasFollowed = res.data.followed;
            const updatedFollows = hasFollowed
              ? [...c.follows, user!.id]
              : c.follows.filter((uid) => uid !== user!.id);
            return {
              ...c,
              follows: updatedFollows,
              followsCount: updatedFollows.length,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'mine') return c.userId === user?.id;
    if (activeTab === 'followed') return c.follows.includes(user?.id || 0);
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-brand-955/20 border border-slate-800 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            Empower Your Community
          </h1>
          <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
            Report civic failures directly to municipal officers, trace issue resolution stages, and stay informed on maintenance disruptions.
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2 group self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Report Civic Issue</span>
        </button>
      </div>

      {/* Tabs & Sort Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center overflow-x-auto gap-2 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/80">
          {[
            { id: 'all', label: 'All Issues', icon: Grid },
            { id: 'mine', label: 'My Reports', icon: User },
            { id: 'followed', label: 'Followed Issues', icon: Heart },
            { id: 'updates', label: 'Civic Updates', icon: Megaphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab !== 'updates' && (
          <div className="flex items-center gap-3 self-end md:self-auto bg-slate-900/40 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setSortOrder('recent')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                sortOrder === 'recent' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => setSortOrder('trending')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                sortOrder === 'trending' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Trending
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {activeTab === 'updates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {updates.length === 0 ? (
            <div className="col-span-full py-16 text-center glass-panel rounded-2xl">
              <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-300">No Civic Updates Published</h3>
              <p className="text-slate-500 text-sm mt-1">Check back later for announcements and shutdowns.</p>
            </div>
          ) : (
            updates.map((update) => (
              <div key={update.id} className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4 border-l-4 border-l-brand-500">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-extrabold text-lg text-white leading-snug">{update.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-300 px-2.5 py-1 rounded-md border border-brand-500/20 shrink-0">
                    {update.type}
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">{update.content}</p>
                <div className="border-t border-slate-800/80 pt-3.5 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-400">By: Officer {update.officerName} ({update.departmentName})</span>
                  <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {filteredComplaints.length === 0 ? (
              <div className="py-16 text-center glass-panel rounded-2xl">
                <List className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No Complaints Found</h3>
                <p className="text-slate-500 text-sm mt-1">Be the first to file a complaint in your neighborhood!</p>
              </div>
            ) : (
              filteredComplaints.map((c) => (
                <div key={c.id} className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col md:flex-row gap-5">
                  <div className="w-full md:w-44 h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
                    <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                    {c.status === 'RESOLVED' && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" /> Resolved
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700/30">
                          {c.category}
                        </span>
                      </div>
                      <Link to={`/complaints/${c.id}`} className="font-bold text-lg text-white hover:text-brand-400 transition-colors line-clamp-1">
                        {c.title}
                      </Link>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-800/40 pt-3">
                      <span className="text-[11px] text-slate-500">
                        By {c.reporterName} • {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVoteToggle(c.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            c.votes.includes(user?.id || 0)
                              ? 'bg-brand-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Upvote ({c.votesCount})</span>
                        </button>

                        <button
                          onClick={() => handleFollowToggle(c.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            c.follows.includes(user?.id || 0)
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${c.follows.includes(user?.id || 0) ? 'fill-rose-400 text-rose-400' : ''}`} />
                          <span>{c.follows.includes(user?.id || 0) ? 'Following' : 'Follow'}</span>
                        </button>

                        <Link
                          to={`/complaints/${c.id}`}
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white p-1.5 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-bold text-white text-base mb-1.5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-400" /> Live Interactive District Map
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Pins represent filed complaints. Click on any colored pin to navigate to its details.
              </p>
              <VirtualMap
                readOnly={true}
                complaints={complaints}
                onComplaintClick={(c) => {
                  window.location.href = `/complaints/${c.id}`;
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Complaint Dialog Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative glass-panel w-full max-w-4xl rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex-1 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Report Civic Issue
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Complaint Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of the failure (e.g., Leaking Water Pipeline)"
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Category
                    </label>
                    <select
                      required
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 px-3.5 py-2.5 rounded-xl text-sm focus:border-brand-500 focus:outline-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Choose category...</option>
                      <option value="Sanitation">Sanitation & Cleanliness</option>
                      <option value="Water Supply">Water Supply Pipeline</option>
                      <option value="Roads & Bridges">Roads & Bridges Repairs</option>
                      <option value="Electricity">Electricity & Streetlights</option>
                      <option value="Parks & Public Spaces">Parks & Gardens</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Civic Image Upload
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="issue-image-input"
                      />
                      <label
                        htmlFor="issue-image-input"
                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-sm cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-slate-400">
                          {imageFile ? imageFile.name : 'Choose photo...'}
                        </span>
                        <Upload className="w-4 h-4 text-brand-400 shrink-0" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description & Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about the issue location, severity, etc."
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 border-t border-slate-800/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-brand-500/20 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <span>File Complaint</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="w-full md:w-[380px] space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Issue Location Pin</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click on the visual map grid below to pinpoint exactly where the issue is.
                </p>
              </div>
              
              <VirtualMap
                lat={lat}
                lng={lng}
                onLocationSelect={(lt, ln) => {
                  setLat(lt);
                  setLng(ln);
                }}
              />

              {imagePreview && (
                <div className="border border-slate-800 bg-slate-900/60 p-2.5 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Image Preview:</div>
                  <img src={imagePreview} alt="issue preview" className="w-full h-24 object-cover rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CitizenDashboard;
