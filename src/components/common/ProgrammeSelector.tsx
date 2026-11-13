import React, { useEffect, useId, useState } from 'react';
import { apiRequest } from '../../services/apiClient';
import { ProgrammeCatalogEntry } from '../../types';

interface ProgrammeSelectorProps {
  value: string;
  onChange: (programmeId: string, programme: ProgrammeCatalogEntry | null) => void;
  required?: boolean;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const ProgrammeSelector: React.FC<ProgrammeSelectorProps> = ({ value, onChange, required = false }) => {
  const listId = useId();
  const [programmes, setProgrammes] = useState<ProgrammeCatalogEntry[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void apiRequest<ProgrammeCatalogEntry[]>('/programmes')
      .then(({ data }) => { if (active) setProgrammes(data); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Programme catalogue could not be loaded.'); });
    return () => { active = false; };
  }, []);

  const selected = programmes.find((programme) => programme.id === value);
  useEffect(() => {
    if (selected) setQuery(selected.name);
  }, [selected?.id, selected?.name]);

  return <div>
    <input
      list={listId}
      value={query || selected?.name || ''}
      onChange={(event) => {
        const next = event.target.value;
        setQuery(next);
        const match = programmes.find((programme) => normalize(programme.name) === normalize(next));
        onChange(match?.id || '', match || null);
      }}
      required={required}
      autoComplete="off"
      placeholder="Search and select an APU programme"
      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
    />
    <datalist id={listId}>
      {programmes.map((programme) => <option key={programme.id} value={programme.name} />)}
    </datalist>
    {error ? <p role="alert" className="mt-1 text-xs text-red-700">{error}</p> : !programmes.length ? <p className="mt-1 text-xs text-slate-500">Loading programme catalogue…</p> : null}
  </div>;
};
