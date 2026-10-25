import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Heart, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center border border-white/20 shadow-sm overflow-hidden shrink-0">
                <img src="/ait-logo.png" alt="AIT Pune Crest" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">AIT CAMPUS CONNECT</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              The centralized opportunity discovery, team formation, and verified digital portfolio ecosystem for Army Institute of Technology, Pune.
            </p>
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Discover. Participate. Achieve. Showcase.
            </p>
          </div>

          {/* Opportunities & Campus Life */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Opportunities</h4>
            <ul className="space-y-2">
              <li><Link to="/opportunities" className="hover:text-white transition">Discover Opportunities</Link></li>
              <li><Link to="/hackathons" className="hover:text-white transition">National Hackathons</Link></li>
              <li><Link to="/events" className="hover:text-white transition">Event Calendar & PACE</Link></li>
              <li><Link to="/internships" className="hover:text-white transition">Engineering Internships</Link></li>
              <li><Link to="/scholarships" className="hover:text-white transition">AWES & PMSS Scholarships</Link></li>
            </ul>
          </div>

          {/* Student Identity & Excellence */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Student Hub</h4>
            <ul className="space-y-2">
              <li><Link to="/students" className="hover:text-white transition">Student Directory</Link></li>
              <li><Link to="/leaderboard" className="hover:text-white transition">Achievement Leaderboard</Link></li>
              <li><Link to="/hall-of-fame" className="hover:text-white transition">AIT Hall of Fame</Link></li>
              <li><Link to="/teams" className="hover:text-white transition">Teammate Matcher (94% Fit)</Link></li>
              <li><Link to="/research" className="hover:text-white transition">IEEE Publications & R&D</Link></li>
            </ul>
          </div>

          {/* Clubs & Governance */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">23 Official Clubs</h4>
            <ul className="space-y-2">
              <li><Link to="/clubs" className="hover:text-white transition">All 23 AIT Clubs Directory</Link></li>
              <li><Link to="/events?status=archive" className="hover:text-white transition">Historical Event Archive</Link></li>
              <li><Link to="/verification" className="hover:text-white transition">Faculty Verification Center</Link></li>
              <li><Link to="/club-dashboard" className="hover:text-white transition">Club Organizer Dashboard</Link></li>
              <li><Link to="/admin" className="hover:text-white transition">Super Admin Console</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Army Institute of Technology, Dighi Hills, Alandi Road, Pune 411015</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Independent Student Project • Data Verified per Research Standards • Onward to Glory</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
