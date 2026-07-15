import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, TrendingUp, Heart, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VirtualMap, { Complaint } from '../components/VirtualMap';
import StatusBadge from '../components/StatusBadge';

export const ComplaintDetailView: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/complaints/${id}`)
      .then((res) => {
        setComplaint(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to fetch complaint detail.');
        setLoading(false);
      });
  }, [id]);

  const handleVoteToggle = async () => {
    if (!complaint || !user || user.role !== 'CITIZEN') return;
    try {
      const res = await axios.post(`/api/complaints/${complaint.id}/vote`);
      const hasVoted = res.data.voted;
      const updatedVotes = hasVoted
        ? [...complaint.votes, user.id]
        : complaint.votes.filter((uid) => uid !== user.id);

      setComplaint({
        ...complaint,
        votes: updatedVotes,
        votesCount: updatedVotes.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = async () => {
    if (!complaint || !user || user.role !== 'CITIZEN') return;
    try {
      const res = await axios.post(`/api/complaints/${complaint.id}/follow`);
      const hasFollowed = res.data.followed;
      const updatedFollows = hasFollowed
        ? [...complaint.follows, user.id]
        : complaint.follows.filter((uid) => uid !== user.id);

      setComplaint({
        ...complaint,
        follows: updatedFollows,
        followsCount: updatedFollows.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-md mx-auto py-16 text-center glass-panel rounded-2xl space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Complaint Not Found</h3>
        <p className="text-slate-400 text-sm">{error || 'The issue you are requesting does not exist.'}</p>
        <button onClick={() => navigate(-1)} className="bg-slate-800 text-slate-300 py-2 px-5 rounded-lg border border-slate-700 text-xs">
          Go Back
        </button>
      </div>
    );
  }

  const isCitizen = user?.role === 'CITIZEN';

  return (
    <div className="space-y-6">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-300 text-xs font-semibold flex items-center gap-1.5 mb-2.5 transition-colors">
            ← Back to Feed
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{complaint.title}</h1>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap text-xs text-slate-400">
            <StatusBadge status={complaint.status} />
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/40">{complaint.category}</span>
            <span>•</span>
            <span>Reported by {complaint.reporterName}</span>
            <span>•</span>
            <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {isCitizen && (
          <div className="flex gap-2">
            <button
              onClick={handleVoteToggle}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                complaint.votes.includes(user.id)
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Upvote ({complaint.votesCount})</span>
            </button>
            <button
              onClick={handleFollowToggle}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                complaint.follows.includes(user.id)
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${complaint.follows.includes(user.id) ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{complaint.follows.includes(user.id) ? 'Following' : 'Follow Issue'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-800/80">
            <div className="bg-slate-900/60 p-4 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Issue Photo Submitted
            </div>
            <img src={complaint.imageUrl} alt="Civic complaint issue" className="w-full max-h-[420px] object-cover bg-slate-955" />
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Detailed Description</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.status === 'RESOLVED' && (
            <div className="glass-panel border-l-4 border-l-emerald-500 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-emerald-950/20 p-4 border-b border-emerald-900/20 flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span>Verification & Resolution Photo</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Solved by Officer {complaint.officerName || 'Staff'}</span>
              </div>
              {complaint.resolutionImageUrl ? (
                <img src={complaint.resolutionImageUrl} alt="Civic resolution completion verification" className="w-full max-h-[420px] object-cover bg-slate-955" />
              ) : (
                <div className="p-8 text-center text-sm text-slate-500 italic bg-slate-955">
                  Officer marked this as resolved. No verification photo was uploaded.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="font-bold text-white text-sm mb-1.5 flex items-center gap-2"><MapPin className="w-4.5 h-4.5 text-brand-400" /> Issue Location Pin</h3>
            <p className="text-xs text-slate-400 mb-4">Located at virtual city grid ward division.</p>
            <VirtualMap readOnly={true} lat={complaint.lat} lng={complaint.lng} />
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm">Complaint Timeline Info</h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0 mt-0.5">1</div>
                <div className="leading-tight">
                  <div className="font-bold text-slate-200">Filing Reported</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{new Date(complaint.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {complaint.status !== 'PENDING' && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-955/40 border border-brand-900/30 flex items-center justify-center text-[10px] text-brand-400 font-bold shrink-0 mt-0.5">2</div>
                  <div className="leading-tight">
                    <div className="font-bold text-slate-200">Assigned & In Progress</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Assigned to Officer: {complaint.officerName || 'Staff'}</div>
                  </div>
                </div>
              )}

              {complaint.status === 'RESOLVED' && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-955/40 border border-emerald-900/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0 mt-0.5">3</div>
                  <div className="leading-tight">
                    <div className="font-bold text-slate-200">Resolution Complete</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Issue resolved successfully.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ComplaintDetailView;
