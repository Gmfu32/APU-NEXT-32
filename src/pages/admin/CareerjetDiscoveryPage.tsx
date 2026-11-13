import React, { useEffect, useMemo, useState } from 'react';
import { Archive, Check, ExternalLink, Eye, LoaderCircle, MapPin, RefreshCw, Search, X } from 'lucide-react';
import { apiRequest } from '../../services/apiClient';
import { Opportunity, ProgrammeCatalogEntry } from '../../types';

type CareerjetJob = {
  title: string;
  company: string;
  date: string;
  description: string;
  locations: string;
  salary: string;
  site?: string;
  url: string;
};

type SearchResults = {
  hits: number;
  totalHits: number;
  message: string;
  pages: number;
  page: number;
  hasMore: boolean;
  queries: string[];
  jobs: CareerjetJob[];
  locations: string[];
};

type ManagedOpportunity = {
  opportunity: Opportunity & {
    careerjetOriginalUrl?: string;
    careerjetDate?: string;
    availabilityStatus?: string;
    availabilityCheckMessage?: string;
  };
  status: string;
  importedAt: string | null;
  lastCheckedAt: string | null;
};

type ManagedResponse = {
  stats: { imported: number; pending: number; published: number };
  opportunities: ManagedOpportunity[];
};

type Tab = 'discover' | 'review' | 'published';

const LOCATIONS = ['Kuala Lumpur', 'Selangor', 'Petaling Jaya', 'Shah Alam', 'Cyberjaya', 'Subang Jaya', 'Putrajaya', 'Johor Bahru', 'Penang'];
const cleanText = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const safeUrl = (value: string) => /^https:\/\//i.test(value);

export const CareerjetDiscoveryPage: React.FC = () => {
  const [programmes, setProgrammes] = useState<ProgrammeCatalogEntry[]>([]);
  const [programmeId, setProgrammeId] = useState('');
  const [programmeQuery, setProgrammeQuery] = useState('');
  const [location, setLocation] = useState('Kuala Lumpur');
  const [skills, setSkills] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('discover');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [managed, setManaged] = useState<ManagedResponse>({ stats: { imported: 0, pending: 0, published: 0 }, opportunities: [] });
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [selectedDetails, setSelectedDetails] = useState<{ title: string; company: string; location: string; description: string; url: string; date: string; salary: string; status?: string; importedAt?: string | null; lastCheckedAt?: string | null; availabilityStatus?: string } | null>(null);
  const [loadingProgrammes, setLoadingProgrammes] = useState(true);
  const [loadingManaged, setLoadingManaged] = useState(true);
  const [searching, setSearching] = useState(false);
  const [importingUrl, setImportingUrl] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [manageError, setManageError] = useState('');
  const [notice, setNotice] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const programme = programmes.find((item) => item.id === programmeId);
  const existingUrls = useMemo(() => new Set(managed.opportunities.map((row) => row.opportunity.careerjetOriginalUrl).filter((value): value is string => typeof value === 'string').map((value) => value.toLowerCase().replace(/\/$/, ''))), [managed.opportunities]);
  const visibleManaged = managed.opportunities.filter((row) => {
    if (tab === 'published') return statusFilter === 'all' ? row.status === 'Approved' || row.status === 'Archived' : row.status === statusFilter;
    return statusFilter === 'all' || row.status === statusFilter;
  });

  const loadManaged = async () => {
    setLoadingManaged(true);
    setManageError('');
    try {
      const { data } = await apiRequest<ManagedResponse>('/admin/careerjet/opportunities');
      setManaged(data);
    } catch (reason) {
      setManageError(reason instanceof Error ? reason.message : 'Careerjet opportunities could not be loaded.');
    } finally {
      setLoadingManaged(false);
    }
  };

  useEffect(() => {
    let active = true;
    void apiRequest<ProgrammeCatalogEntry[]>('/programmes')
      .then(({ data }) => { if (active) setProgrammes(data); })
      .catch((reason) => { if (active) setManageError(reason instanceof Error ? reason.message : 'Programme catalogue could not be loaded.'); })
      .finally(() => { if (active) setLoadingProgrammes(false); });
    void loadManaged();
    return () => { active = false; };
  }, []);

  const discover = async (event?: React.FormEvent, nextPage = 1) => {
    event?.preventDefault();
    setNotice('');
    setSearchError('');
    if (!programme) { setSearchError('Select an APU programme from the catalogue.'); return; }
    if (location.trim().length < 2) { setSearchError('Enter a location with at least two characters.'); return; }
    setSearching(true);
    try {
      const { data } = await apiRequest<SearchResults>('/admin/careerjet/discover', {
        method: 'POST',
        body: JSON.stringify({ programme_id: programme.id, location: location.trim(), skills, page: nextPage }),
      });
      setResults(data);
    } catch (reason) {
      setSearchError(reason instanceof Error ? reason.message : 'Careerjet search failed.');
    } finally {
      setSearching(false);
    }
  };

  const importJob = async (job: CareerjetJob) => {
    if (!programme) { setSearchError('Select an APU programme before importing a listing.'); return; }
    setImportingUrl(job.url);
    setNotice('');
    setSearchError('');
    try {
      const { data } = await apiRequest<{ duplicate: boolean; opportunity: Opportunity; status: string }>('/admin/careerjet/import', {
        method: 'POST',
        body: JSON.stringify({ programme_id: programme.id, job }),
      });
      if (data.duplicate) {
        setNotice(`Duplicate: “${data.opportunity.title}” is already in APU NEXT (${data.status}).`);
      } else {
        setNotice(`“${data.opportunity.title}” was imported for Career Centre review.`);
      }
      await loadManaged();
    } catch (reason) {
      setSearchError(reason instanceof Error ? reason.message : 'The listing could not be imported.');
    } finally {
      setImportingUrl('');
    }
  };

  const decide = async (row: ManagedOpportunity, action: 'approve' | 'reject' | 'archive') => {
    setWorkingId(row.opportunity.id);
    setManageError('');
    setNotice('');
    try {
      const { data } = await apiRequest<{ status: string }>(`/admin/careerjet/opportunities/${encodeURIComponent(row.opportunity.id)}/decision`, {
        method: 'PUT',
        body: JSON.stringify({ action, reason: rejectionReasons[row.opportunity.id] || '' }),
      });
      setNotice(action === 'approve' ? 'Opportunity approved and published to student matches.' : action === 'reject' ? 'Opportunity rejected and retained for review history.' : 'Opportunity archived; its history is retained.');
      setRejectionReasons((current) => ({ ...current, [row.opportunity.id]: '' }));
      await loadManaged();
      if (action === 'approve') setTab('published');
    } catch (reason) {
      setManageError(reason instanceof Error ? reason.message : `Could not ${action} this opportunity.`);
    } finally {
      setWorkingId('');
    }
  };

  const refreshListing = async (row: ManagedOpportunity) => {
    setWorkingId(row.opportunity.id);
    setManageError('');
    try {
      const { data } = await apiRequest<{ availabilityStatus: string }>(`/admin/careerjet/opportunities/${encodeURIComponent(row.opportunity.id)}/refresh`, { method: 'POST' });
      setNotice(`Recheck complete: ${data.availabilityStatus}. A listing not found in search is not automatically considered expired.`);
      await loadManaged();
    } catch (reason) {
      setManageError(reason instanceof Error ? reason.message : 'Could not recheck this listing.');
    } finally {
      setWorkingId('');
    }
  };

  const openJobDetails = (job: CareerjetJob) => setSelectedDetails({
    title: job.title || 'Title not provided',
    company: job.company || 'Company not provided',
    location: job.locations || 'Location not provided',
    description: cleanText(job.description) || 'Description not provided by Careerjet.',
    url: job.url,
    date: job.date,
    salary: job.salary,
  });

  const openManagedDetails = (row: ManagedOpportunity) => setSelectedDetails({
    title: row.opportunity.title || 'Title not provided',
    company: row.opportunity.company || 'Company not provided',
    location: row.opportunity.location || 'Location not provided',
    description: row.opportunity.summary || 'Description not provided by Careerjet.',
    url: String(row.opportunity.careerjetOriginalUrl || row.opportunity.applicationUrl || ''),
    date: String(row.opportunity.careerjetDate || ''),
    salary: row.opportunity.allowance || '',
    status: row.status,
    importedAt: row.importedAt,
    lastCheckedAt: row.lastCheckedAt,
    availabilityStatus: String(row.opportunity.availabilityStatus || ''),
  });

  return <div className="mx-auto max-w-5xl space-y-5">
    <header className="rounded-2xl bg-gradient-to-br from-[#0D1526] via-[#152c60] to-blue-700 p-6 text-white shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">Career Centre</p>
      <h1 className="mt-2 text-2xl font-extrabold">Careerjet Discovery</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Discover internships, import selected listings for review, then publish approved roles to the unified student opportunity feed.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      {[['Imported', managed.stats.imported], ['Pending review', managed.stats.pending], ['Published', managed.stats.published]].map(([label, count]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{loadingManaged ? '—' : count}</p></article>)}
    </section>

    <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2" aria-label="Careerjet workflow">
      {([['discover', 'Discover Opportunities'], ['review', `Pending Review (${managed.stats.pending})`], ['published', `Published (${managed.stats.published})`]] as const).map(([id, label]) => <button key={id} type="button" onClick={() => { setTab(id); setStatusFilter(id === 'published' ? 'Approved' : 'Pending Review'); setManageError(''); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}
    </nav>

    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {manageError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{manageError}</p>}

    {tab === 'discover' ? <>
      <form onSubmit={(event) => void discover(event)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">APU academic programme
            <input list="careerjet-programmes" value={programmeQuery || programme?.name || ''} onChange={(event) => {
              const next = event.target.value;
              setProgrammeQuery(next);
              const match = programmes.find((item) => item.name.toLowerCase() === next.trim().toLowerCase());
              setProgrammeId(match?.id || '');
              setSkills([]);
              setResults(null);
            }} disabled={loadingProgrammes} placeholder="Search and select a programme" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            <datalist id="careerjet-programmes">{programmes.map((item) => <option key={item.id} value={item.name} />)}</datalist>
            {programme?.officiallyVerified === false && <span className="mt-1 block text-xs text-amber-700">This catalogue entry comes from existing APU NEXT records and still needs official catalogue verification.</span>}
          </label>
          <label className="text-sm font-semibold text-slate-700">Location
            <input list="careerjet-locations" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Search or enter a location" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            <datalist id="careerjet-locations">{LOCATIONS.map((item) => <option key={item} value={item} />)}</datalist>
          </label>
        </div>
        {programme && <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-700">Relevant skills <span className="font-normal text-slate-500">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">{programme.skills.map((skill) => <label key={skill} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${skills.includes(skill) ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><input className="sr-only" type="checkbox" checked={skills.includes(skill)} onChange={(event) => setSkills((current) => event.target.checked ? [...current, skill] : current.filter((value) => value !== skill))} />{skill}</label>)}</div>
        </fieldset>}
        <button type="submit" disabled={searching || loadingProgrammes || !programmeId} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{searching ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}Discover Internships</button>
      </form>

      {searchError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{searchError}</p>}
      {results && <>
        <section className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-bold text-slate-900">Discovery results</h2><p className="text-sm text-slate-500">{results.hits} distinct listings · {results.totalHits} total search hits</p></div><button type="button" onClick={() => void discover(undefined, results.page)} disabled={searching} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} />Refresh search</button></section>
        <p className="text-xs text-slate-500">Search terms: {results.queries.join(' · ')}</p>
        {results.jobs.length ? <div className="space-y-3">{results.jobs.map((job, index) => {
          const alreadyImported = existingUrls.has((job.url || '').toLowerCase().replace(/\/$/, ''));
          return <article key={`${job.url}-${index}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">{job.title || 'Title not provided'}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-700">{job.company || 'Company not provided'}</p>
                <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={13} />{job.locations || 'Location not provided'}</span>{job.date && <span>{job.date}</span>}{job.salary && <span>{job.salary}</span>}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{cleanText(job.description) || 'Description not provided by Careerjet.'}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => openJobDetails(job)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><Eye size={14} />View Details</button>
                <button type="button" onClick={() => void importJob(job)} disabled={Boolean(importingUrl) || alreadyImported} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{alreadyImported ? 'Already imported' : importingUrl === job.url ? 'Importing…' : 'Import for Review'}</button>
                {safeUrl(job.url) && <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Original listing <ExternalLink size={13} /></a>}
              </div>
            </div>
          </article>;
        })}</div> : <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No listings found. Try another location or programme.</section>}
        {results.hasMore && <div className="flex justify-center"><button type="button" onClick={() => void discover(undefined, results.page + 1)} disabled={searching} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50">{searching ? 'Loading…' : 'Load More'}</button></div>}
      </>}
    </> : <>
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-900">{tab === 'review' ? 'Review imported opportunities' : 'Published Careerjet opportunities'}</h2><p className="text-sm text-slate-500">Review details and keep the original listing available to students.</p></div>
        <label className="text-sm font-semibold text-slate-600">Status <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="all">All</option><option value="Pending Review">Pending Review</option><option value="Approved">Published</option><option value="Rejected">Rejected</option><option value="Archived">Archived</option></select></label>
      </section>
      {loadingManaged ? <div className="flex justify-center p-8"><LoaderCircle className="animate-spin text-blue-600" /></div> : visibleManaged.length ? <div className="space-y-3">{visibleManaged.map((row) => <article key={row.opportunity.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-slate-900">{row.opportunity.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : row.status === 'Pending Review' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{row.status === 'Approved' ? 'Published' : row.status}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-700">{row.opportunity.company || 'Company not provided'} · {row.opportunity.location || 'Location not provided'}</p>
            <p className="mt-1 text-xs text-slate-500">Source: Careerjet · Imported {row.importedAt ? new Date(row.importedAt).toLocaleString() : 'date unavailable'}{row.lastCheckedAt ? ` · Last checked ${new Date(row.lastCheckedAt).toLocaleString()}` : ''}</p>
            {row.opportunity.availabilityStatus && <p className="mt-1 text-xs text-amber-800">{row.opportunity.availabilityStatus}{row.opportunity.availabilityCheckMessage ? ` — ${row.opportunity.availabilityCheckMessage}` : ''}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openManagedDetails(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><Eye size={14} />View Details</button>
            <button type="button" onClick={() => void refreshListing(row)} disabled={workingId === row.opportunity.id} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw size={14} />Recheck</button>
            {row.status === 'Pending Review' && <>
              <button type="button" onClick={() => void decide(row, 'approve')} disabled={workingId === row.opportunity.id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14} />Approve and Publish</button>
              <button type="button" onClick={() => void decide(row, 'reject')} disabled={workingId === row.opportunity.id} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">Reject</button>
            </>}
            {row.status !== 'Archived' && <button type="button" onClick={() => void decide(row, 'archive')} disabled={workingId === row.opportunity.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><Archive size={14} />Archive</button>}
          </div>
        </div>
        {row.status === 'Pending Review' && <label className="mt-3 block text-xs font-semibold text-slate-600">Optional rejection reason<input value={rejectionReasons[row.opportunity.id] || ''} onChange={(event) => setRejectionReasons((current) => ({ ...current, [row.opportunity.id]: event.target.value }))} maxLength={1000} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>}
      </article>)}</div> : <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{tab === 'review' ? 'No imported opportunities match this status.' : 'No published opportunities match this status.'}</section>}
    </>}

    {selectedDetails && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDetails(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="careerjet-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Opportunity details</p><h2 id="careerjet-details-title" className="mt-1 text-xl font-bold text-slate-900">{selectedDetails.title}</h2></div><button type="button" aria-label="Close details" onClick={() => setSelectedDetails(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
        <p className="mt-2 text-sm font-semibold text-slate-700">{selectedDetails.company} · {selectedDetails.location}</p>
        {selectedDetails.status && <p className="mt-2 text-xs text-slate-500">Status: {selectedDetails.status}{selectedDetails.importedAt ? ` · Imported ${new Date(selectedDetails.importedAt).toLocaleString()}` : ''}{selectedDetails.lastCheckedAt ? ` · Last checked ${new Date(selectedDetails.lastCheckedAt).toLocaleString()}` : ''}</p>}
        {selectedDetails.availabilityStatus && <p className="mt-2 text-sm text-amber-800">{selectedDetails.availabilityStatus}</p>}
        {(selectedDetails.date || selectedDetails.salary) && <p className="mt-3 text-sm text-slate-600">{[selectedDetails.date, selectedDetails.salary].filter(Boolean).join(' · ')}</p>}
        <div className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedDetails.description}</div>
        {safeUrl(selectedDetails.url) && <a href={selectedDetails.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Open original listing <ExternalLink size={15} /></a>}
      </section>
    </div>}
  </div>;
};
