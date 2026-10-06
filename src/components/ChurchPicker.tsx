"use client";

import { useMemo, useState } from "react";
import { getCountries, getStates, getChurches } from "@/lib/churches";

type FieldLevel = "country" | "state" | "church";

export function ChurchPicker({
  required = false,
  fieldNames = { country: "country", state: "state", church: "church" },
  defaultValue,
}: {
  required?: boolean;
  fieldNames?: Record<FieldLevel, string>;
  defaultValue?: { country?: string; state?: string; church?: string };
}) {
  const [country, setCountry] = useState(defaultValue?.country ?? "");
  const [state, setState] = useState(defaultValue?.state ?? "");
  const [church, setChurch] = useState(defaultValue?.church ?? "");
  const [churchQuery, setChurchQuery] = useState(defaultValue?.church ?? "");
  const [showChurchList, setShowChurchList] = useState(false);

  const countries = useMemo(() => getCountries(), []);
  const states = useMemo(() => (country ? getStates(country) : []), [country]);
  const churchOptions = useMemo(
    () => (country && state ? getChurches(country, state) : []),
    [country, state]
  );
  const filteredChurches = useMemo(
    () => churchOptions.filter((c) => c.toLowerCase().includes(churchQuery.toLowerCase())),
    [churchOptions, churchQuery]
  );

  const inputClasses =
    "rounded-md border border-border bg-transparent p-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Country {required && <span className="text-red-500">*</span>}
        </label>
        <select
          name={fieldNames.country}
          required={required}
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setState("");
            setChurch("");
            setChurchQuery("");
          }}
          className={inputClasses}
        >
          <option value="">{required ? "Select a country" : "Prefer not to say"}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {(country || required) && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            State / Region {required && <span className="text-red-500">*</span>}
          </label>
          <select
            name={fieldNames.state}
            required={required}
            disabled={!country}
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setChurch("");
              setChurchQuery("");
            }}
            className={inputClasses}
          >
            <option value="">{required ? "Select a state/region" : "Not specified"}</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {(state || required) && (
        <div className="relative flex flex-col gap-1">
          <label className="text-sm font-medium">
            Church {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            disabled={!state}
            value={churchQuery}
            onChange={(e) => {
              setChurchQuery(e.target.value);
              setChurch("");
              setShowChurchList(true);
            }}
            onFocus={() => setShowChurchList(true)}
            onBlur={() => setTimeout(() => setShowChurchList(false), 150)}
            placeholder={required ? "Search for your church…" : "Search (optional)"}
            className={inputClasses}
          />
          {/* A plain "required" on this hidden input wouldn't be enforced by the
              browser (hidden fields are excluded from constraint validation) —
              the server-side schema is the real gate; this just carries the value. */}
          <input type="hidden" name={fieldNames.church} value={church} />
          {required && !church && (
            <p className="text-xs text-muted-foreground">Pick your church from the list below.</p>
          )}
          {showChurchList && state && (
            <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
              {filteredChurches.length === 0 ? (
                <li className="p-2 text-sm opacity-70">No matches.</li>
              ) : (
                filteredChurches.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setChurch(c);
                        setChurchQuery(c);
                        setShowChurchList(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent/10"
                    >
                      {c}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
