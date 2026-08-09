'use client';

import { useEffect, useRef, useState } from 'react';

type Station = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

type Location = {
  id: string;
  name: string;
  label: string;
  type: 'location' | 'station';
  stations?: Station[];
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (location: Location, station?: Station) => void;
  placeholder?: string;
  label?: string;
};

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Town, city, postcode or station',
  label,
}: Props) {
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    timer.current = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/locations?q=${encodeURIComponent(value.trim())}`
        );
        const data = await response.json();

        setResults(data.locations ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  return (
    <div className="relative">
      {label && (
        <label className="mb-2 block text-sm font-medium">
          {label}
        </label>
      )}

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border px-4 py-3 outline-none"
      />

      {open && (loading || results.length > 0) && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Searching UK locations…
            </div>
          )}

          {!loading &&
            results.map((location) => (
              <div key={location.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                  onClick={() => {
                    onChange(location.name);
                    onSelect?.(location);
                    setOpen(false);
                  }}
                >
                  <div className="font-medium">📍 {location.name}</div>
                  <div className="truncate text-xs text-gray-500">
                    {location.label}
                  </div>
                </button>

                {location.stations?.slice(0, 4).map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    className="block w-full border-t bg-gray-50 px-6 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() => {
                      onChange(station.name);
                      onSelect?.(location, station);
                      setOpen(false);
                    }}
                  >
                    🚆 {station.name}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
