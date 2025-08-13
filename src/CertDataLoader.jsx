import React, { useEffect, useState } from "react";

/**
 * CertDataLoader.jsx
 * Additive data loader that merges external JSON cert and roadmap files
 * with whatever your app already has.
 *
 * Usage:
 *   import { useCertDataLoader } from "./CertDataLoader";
 *   const { certs, roadmaps, loading, error, reload } = useCertDataLoader();
 *
 * Your existing arrays remain intact. Merge them:
 *   const ALL_CERTS = useMemo(() => [...BASE_CERTS, ...certs], [BASE_CERTS, certs]);
 *   const ALL_ROADMAPS = useMemo(() => [...BUILT_IN_ROADMAPS, ...roadmaps], [BUILT_IN_ROADMAPS, roadmaps]);
 */

const CERTS_BASE = "/data/certs";
const ROADS_BASE = "/data/roadmaps";

export function useCertDataLoader() {
  const [state, setState] = useState({ certs: [], roadmaps: [], loading: true, error: null });

  const load = async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));

      // Load certs
      const cm = await fetch(`${CERTS_BASE}/manifest.json`).then(r => r.json());
      const certs = await Promise.all(
        (cm.certs || []).map(id => fetch(`${CERTS_BASE}/${id}.json`).then(r => r.json()))
      );

      // Load roadmaps
      const rm = await fetch(`${ROADS_BASE}/manifest.json`).then(r => r.json());
      const roadmaps = await Promise.all(
        (rm.roadmaps || []).map(slug => fetch(`${ROADS_BASE}/${slug}.json`).then(r => r.json()))
      );

      setState({ certs, roadmaps, loading: false, error: null });
    } catch (err) {
      setState({ certs: [], roadmaps: [], loading: false, error: String(err) });
    }
  };

  useEffect(() => { load(); }, []);

  return { ...state, reload: load };
}
