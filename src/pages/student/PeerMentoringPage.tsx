import React, { useState } from 'react';
import { CheckCircle2, Clock, Info, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PEER_MENTORS } from '../../data/communityAndAlumni';
import { DemoAvatar } from '../../components/common/DemoAvatar';
import { Modal } from '../../components/common/Modal';
import { PeerMentor } from '../../types';

export const PeerMentoringPage: React.FC = () => {
  const { requestedPeerIds, submitPeerMentorRequest } = useApp();

  const [selectedPeer, setSelectedPeer] = useState<PeerMentor | null>(null);
  const [requestNote, setRequestNote] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeer || !requestNote.trim()) return;
    submitPeerMentorRequest(selectedPeer.id, requestNote);
    setRequestNote('');
    setSelectedPeer(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Peer-to-Peer Student Mentoring</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Learn from final-year students who recently completed industrial placements, hackathons,
          and technical portfolio reviews.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Demonstration Peer Mentors:</strong> Profiles below are sample student personas
          demonstrating peer knowledge sharing across programmes.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PEER_MENTORS.map((peer) => {
          const isRequested = requestedPeerIds.includes(peer.id);
          return (
            <article
              key={peer.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <DemoAvatar seed={peer.avatarSeed} name={peer.name} size="lg" showDemoTag />
                  <div>
                    <p className="text-xs font-medium text-blue-600">{peer.year}</p>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{peer.name}</h2>
                    <p className="text-xs text-slate-600">{peer.programme}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{peer.pastInternship}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{peer.bio}</p>

                <div className="text-xs space-y-1">
                  <p className="text-slate-700">
                    <strong>Mentoring Areas:</strong> {peer.expertise.join(' · ')}
                  </p>
                  <p className="text-slate-500">
                    <strong className="text-slate-700">Technical Skills:</strong>{' '}
                    {peer.skills.join(' · ')}
                  </p>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {peer.availability}
                </span>

                {isRequested ? (
                  <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Request Sent
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPeer(peer)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Request Mentoring</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(selectedPeer)}
        onClose={() => setSelectedPeer(null)}
        title={`Request Peer Session with ${selectedPeer?.name}`}
        subtitle={selectedPeer?.programme}
      >
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              What would you like peer advice on? *
            </label>
            <textarea
              rows={3}
              required
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="e.g. Reviewing my Year 2 GitHub projects before applying for internships..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedPeer(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
            >
              Send Peer Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
