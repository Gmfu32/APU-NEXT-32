import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Gift, Info, MailCheck, ShieldAlert } from 'lucide-react';
import { STUDENT_BENEFITS } from '../../data/careerFairAndBenefits';
import { CompanyLogo } from '../../components/common/CompanyLogo';
import { Modal } from '../../components/common/Modal';
import { StudentBenefit } from '../../types';

export const StudentPackagePage: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedBenefit, setSelectedBenefit] = useState<StudentBenefit | null>(null);

  const categories = [
    'All',
    'Developer Tools',
    'Cloud & AI',
    'Data & Certifications',
    'Design & Productivity',
  ];

  const visibleBenefits = STUDENT_BENEFITS.filter(
    (b) => categoryFilter === 'All' || b.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#0D1526] via-[#1B2854] to-[#2B2467] text-white p-6 sm:p-8 border border-slate-800">
        <div className="max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>University Email & Student Verification Benefits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            APU NEXT Student Package Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Your university student email address can unlock developer toolkits, cloud sandbox
            credits, interactive data-science courses, and certification pathways from global
            technology providers.
          </p>
        </div>
      </section>

      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Important Eligibility Notice:</strong> Student benefits, promotional cloud
          credits, and certification offers change periodically by region and provider policy. APU
          NEXT does not guarantee universal free access—always click{' '}
          <strong>Check Eligibility</strong> on the official provider page and review renewal terms.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-[#0D1526] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleBenefits.map((benefit) => (
          <article
            key={benefit.id}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-blue-400 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CompanyLogo logoKey={benefit.logoKey} companyName={benefit.provider} />
                  <div>
                    <p className="text-xs text-slate-500">
                      {benefit.provider} · {benefit.category}
                    </p>
                    <h2 className="text-sm font-bold text-slate-900 mt-0.5">{benefit.title}</h2>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">{benefit.description}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <p className="text-slate-700">
                  <strong>Verification:</strong>{' '}
                  {benefit.requiresUniEmail ? (
                    <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                      <MailCheck className="w-3.5 h-3.5" />
                      University email / academic status required
                    </span>
                  ) : (
                    <span className="text-slate-600">Open student registration (Uni email recommended)</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{benefit.verificationNote}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedBenefit(benefit)}
                className="text-xs font-semibold text-slate-700 hover:text-blue-600"
              >
                Activation Steps
              </button>

              <a
                href={benefit.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <span>Check Eligibility</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={Boolean(selectedBenefit)}
        onClose={() => setSelectedBenefit(null)}
        title={selectedBenefit?.title || 'Activation Guide'}
        subtitle={selectedBenefit ? `${selectedBenefit.provider} · Student Eligibility & Redemption` : ''}
      >
        {selectedBenefit && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-900">Eligibility Summary</p>
              <p className="text-slate-600 leading-relaxed">{selectedBenefit.eligibility}</p>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-2">How to Check Eligibility & Activate</p>
              <ol className="space-y-2.5">
                {selectedBenefit.redemptionSteps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-2.5 text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{selectedBenefit.verificationNote}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBenefit(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700"
              >
                Close
              </button>
              <a
                href={selectedBenefit.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1.5"
              >
                <span>Visit Official Provider Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
