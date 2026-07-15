import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Send,
  AlertTriangle,
  Upload,
  List,
  Check,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Complaint } from '../components/VirtualMap';

export interface CivicUpdate {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  officerName: string;
  departmentName: string;
}

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [updates, setUpdates] = useState<CivicUpdate[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'announcements'>('assigned');
  
  // Announcement states
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [updateType, setUpdateType] = useState<any>('Road construction');
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  // Status updating states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('PENDING');
  const [resolutionImage, setResolutionImage] = useState<File | null>(null);
  const [resImagePreview, setResImagePreview] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Call the updated endpoint mapping `/api/complaints/officer/assigned`
    axios.get('/api/complaints/officer/assigned')
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error(err));

    axios.get('/api/civic-updates')
      .then((res) => setUpdates(res.data))
      .catch((err) => console.error(err));
  }, [refreshTrigger]);

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementError('');
    setAnnouncementSubmitting(true);

    try {
      await axios.post('/api/civic-updates', {
        title: updateTitle,
        content: updateContent,
        type: updateType,
      });

      setUpdateTitle('');
      setUpdateContent('');
      setUpdateType('Road construction');
      setRefreshTrigger((prev) => prev + 1);
      alert('Civic update successfully broadcasted to citizens!');
    } catch (err: any) {
      setAnnouncementError(err.response?.data?.error || 'Failed to post civic update.');
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setStatusError('');
    setUpdatingStatus(true);

    const formData = new FormData();
    formData.append('status', updatedStatus);
    if (updatedStatus === 'RESOLVED' && resolutionImage) {
      formData.append('resolutionImage', resolutionImage);
    }

    try {
      await axios.patch(`/api/complaints/${selectedComplaint.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedComplaint(null);
      setResolutionImage(null);
      setResImagePreview(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setStatusError(err.response?.data?.error || 'Failed to update complaint status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResolutionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* Officer intro header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/20 p-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Officer Portal
        </h1>
        <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
          Manage issues assigned to your department ({user?.departmentName || 'General'}). Access complaints, update resolution status with completion photos, and broadcast official area closures.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'assigned'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Assigned & Dept Issues ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'announcements'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Broadcast Civic Update
        </button>
      </div>

      {activeTab === 'announcements' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-1.5">Broadcast New Area Update</h2>
            <p className="text-xs text-slate-400 mb-6">This announcement will be displayed in real-time on all citizen dashboard feeds.</p>

            {announcementError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{announcementError}</span>
              </div>
            )}

            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Update Type / Reason</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 px-3.5 py-2.5 rounded-xl text-sm focus:border-brand-500 focus:outline-none"
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value)}
                >
                  <option value="Road construction">Road construction</option>
                  <option value="Water supply maintenance">Water supply maintenance</option>
                  <option value="Power shutdown">Power shutdown</option>
                  <option value="New bridge opening">New bridge opening</option>
                  <option value="Road closure">Road closure</option>
                  <option value="Park renovation">Park renovation</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Broadcast Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 4 Bridge closure for resurfacing"
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Broadcasting Content Details</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Specify affected streets, duration, detour suggestions, etc."
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={announcementSubmitting}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md hover:shadow-brand-500/25 flex items-center justify-center gap-2"
              >
                {announcementSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast Update</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Announcements History</h3>
            {updates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-2xl">
                No past announcements found.
              </div>
            ) : (
              updates.map((up) => (
                <div key={up.id} className="glass-panel p-4 rounded-xl border-l border-l-slate-700 text-xs">
                  <div className="flex justify-between items-start gap-3 mb-1.5">
                    <h4 className="font-bold text-white truncate">{up.title}</h4>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">{up.type}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-2 mb-2">{up.content}</p>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Officer {up.officerName}</span>
                    <span>{new Date(up.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {complaints.length === 0 ? (
              <div className="py-16 text-center glass-panel rounded-2xl">
                <List className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No Assigned Issues</h3>
                <p className="text-slate-500 text-sm mt-1">Great! There are no unresolved complaints filed in your department.</p>
              </div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row gap-5">
                  <img src={c.imageUrl} alt={c.title} className="w-full md:w-36 h-28 object-cover rounded-xl border border-slate-800 shrink-0 bg-slate-900" />
                  <div className="flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {c.category}
                        </span>
                        {!c.officerId && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-955/20 border border-amber-900/30 px-2 py-0.5 rounded">
                            Unassigned
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-base">{c.title}</h3>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{c.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 text-xs text-slate-500">
                      <span>Reporter: {c.reporterName} • {c.votesCount} Upvotes</span>
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setUpdatedStatus(c.status as any);
                        }}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all shadow"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-bold text-white text-sm mb-4">Department Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Total department issues</span>
                  <span className="font-bold text-slate-200">{complaints.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Pending status</span>
                  <span className="font-bold text-amber-400">{complaints.filter(c => c.status === 'PENDING').length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">In Progress</span>
                  <span className="font-bold text-blue-400">{complaints.filter(c => c.status === 'IN_PROGRESS').length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Completed (Resolved)</span>
                  <span className="font-bold text-emerald-400">{complaints.filter(c => c.status === 'RESOLVED').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Update Issue Status</h2>
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setResolutionImage(null);
                  setResImagePreview(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-5">Updating status for: <strong className="text-slate-200">{selectedComplaint.title}</strong></p>

            {statusError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                {statusError}
              </div>
            )}

            <form onSubmit={handleStatusChangeSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PENDING', label: 'Pending' },
                    { id: 'IN_PROGRESS', label: 'In Progress' },
                    { id: 'RESOLVED', label: 'Resolved' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setUpdatedStatus(st.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        updatedStatus === st.id
                          ? 'bg-slate-800 border-brand-500 text-brand-400'
                          : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {updatedStatus === 'RESOLVED' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Resolution Verification Photo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        required={updatedStatus === 'RESOLVED'}
                        onChange={handleResImageChange}
                        className="hidden"
                        id="resolution-image-input"
                      />
                      <label
                        htmlFor="resolution-image-input"
                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-3 rounded-xl text-xs cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-slate-400">
                          {resolutionImage ? resolutionImage.name : 'Choose resolution photo...'}
                        </span>
                        <Upload className="w-4 h-4 text-brand-400 shrink-0" />
                      </label>
                    </div>
                  </div>

                  {resImagePreview && (
                    <div className="border border-slate-800 bg-slate-900/60 p-2 rounded-xl">
                      <img src={resImagePreview} alt="resolution preview" className="w-full h-24 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-800/60 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComplaint(null);
                    setResolutionImage(null);
                    setResImagePreview(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  {updatingStatus ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default OfficerDashboard;
