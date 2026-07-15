import React from 'react';
import { MapPin } from 'lucide-react';

export interface Complaint {
  id: number;
  title: string;
  category: string;
  status: string;
  lat: number;
  lng: number;
  createdAt: string;
  reporterName: string;
  votesCount: number;
  followsCount: number;
  votes: number[];
  follows: number[];
  description: string;
  imageUrl: string;
  resolutionImageUrl?: string | null;
}

interface VirtualMapProps {
  lat?: number;
  lng?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  complaints?: Complaint[];
  onComplaintClick?: (complaint: Complaint) => void;
  readOnly?: boolean;
}

export const VirtualMap: React.FC<VirtualMapProps> = ({
  lat,
  lng,
  onLocationSelect,
  complaints = [],
  onComplaintClick,
  readOnly = false,
}) => {
  const width = 600;
  const height = 400;

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onLocationSelect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const virtualLat = 40.75 - (y / height) * 0.05;
    const virtualLng = -74.00 + (x / width) * 0.05;

    onLocationSelect(
      parseFloat(virtualLat.toFixed(5)),
      parseFloat(virtualLng.toFixed(5))
    );
  };

  const getCoordinates = (latitude: number, longitude: number) => {
    const x = ((longitude - (-74.00)) / 0.05) * width;
    const y = ((40.75 - latitude) / 0.05) * height;
    return { x, y };
  };

  const selectedPin = lat && lng ? getCoordinates(lat, lng) : null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl">
      <div className="absolute top-3 left-3 z-10 glass-panel px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-300">
        <MapPin className="w-3.5 h-3.5 text-brand-500" />
        <span>Virtual District Grid (City Centre)</span>
      </div>

      {readOnly && (
        <div className="absolute top-3 right-3 z-10 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wider">
          View Mode
        </div>
      )}

      <svg
        className={`w-full h-[400px] ${readOnly ? '' : 'cursor-crosshair'}`}
        viewBox={`0 0 ${width} ${height}`}
        onClick={handleMapClick}
      >
        <rect width={width} height={height} fill="#0d1b2a" />
        <path d="M -10 150 Q 150 180 300 200 T 610 320 L 610 410 L -10 410 Z" fill="#1b263b" opacity="0.6" />
        <rect x="50" y="50" width="120" height="80" rx="10" fill="#143625" opacity="0.5" />
        <text x="110" y="95" fill="#4ade80" fontSize="12" fontWeight="600" opacity="0.4" textAnchor="middle">District Park</text>

        <rect x="420" y="80" width="110" height="70" rx="8" fill="#3a1c1c" opacity="0.4" />
        <text x="475" y="120" fill="#ef4444" fontSize="11" fontWeight="600" opacity="0.4" textAnchor="middle">HQ Ward 4</text>

        <line x1="200" y1="0" x2="200" y2={height} stroke="#334155" strokeWidth="12" opacity="0.4" />
        <line x1="0" y1="280" x2={width} y2="280" stroke="#334155" strokeWidth="12" opacity="0.4" />
        <line x1="400" y1="0" x2="400" y2={height} stroke="#334155" strokeWidth="6" opacity="0.4" />
        <line x1="0" y1="120" x2={width} y2="120" stroke="#334155" strokeWidth="8" opacity="0.4" />

        <line x1="200" y1="0" x2="200" y2={height} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6,8" opacity="0.5" />
        <line x1="0" y1="280" x2={width} y2="280" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6,8" opacity="0.5" />

        <text x="10" y="390" fill="#475569" fontSize="10">40.75° N, 74.00° W</text>
        <text x="490" y="20" fill="#475569" fontSize="10">40.70° N, 73.95° W</text>

        {complaints.map((c) => {
          const coords = getCoordinates(c.lat, c.lng);
          let pinColor = '#f59e0b';
          if (c.status === 'IN_PROGRESS') pinColor = '#3b82f6';
          if (c.status === 'RESOLVED') pinColor = '#10b981';

          return (
            <g
              key={c.id}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={(e) => {
                e.stopPropagation();
                if (onComplaintClick) onComplaintClick(c);
              }}
            >
              <circle cx={coords.x} cy={coords.y} r="16" fill={pinColor} opacity="0.15" />
              <circle cx={coords.x} cy={coords.y} r="8" fill={pinColor} stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={coords.x} cy={coords.y} r="3" fill="#ffffff" />
            </g>
          );
        })}

        {selectedPin && (
          <g>
            <circle cx={selectedPin.x} cy={selectedPin.y} r="24" fill="#3b82f6" opacity="0.25" className="animate-ping" style={{ transformOrigin: `${selectedPin.x}px ${selectedPin.y}px` }} />
            <path
              d={`M ${selectedPin.x} ${selectedPin.y} 
                 C ${selectedPin.x - 8} ${selectedPin.y - 12} ${selectedPin.x - 12} ${selectedPin.y - 24} ${selectedPin.x} ${selectedPin.y - 28} 
                 C ${selectedPin.x + 12} ${selectedPin.y - 24} ${selectedPin.x + 8} ${selectedPin.y - 12} ${selectedPin.x} ${selectedPin.y}`}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx={selectedPin.x} cy={selectedPin.y - 20} r="4" fill="#ffffff" />
          </g>
        )}
      </svg>

      {lat && lng && (
        <div className="bg-slate-900 border-t border-slate-800 p-2.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Dropped Pin Coordinates:</span>
            <span className="font-semibold text-slate-200">{lat}° N, {lng}° W</span>
          </div>
          {!readOnly && (
            <span className="text-slate-500 italic">Click elsewhere to move pin</span>
          )}
        </div>
      )}

      {!lat && !readOnly && (
        <div className="bg-slate-900 border-t border-slate-800 p-2.5 text-center text-xs text-amber-400 font-medium">
          ⚠️ Click on the map grid to mark the issue location
        </div>
      )}
    </div>
  );
};
export default VirtualMap;
