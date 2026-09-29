/** Debug panel (SPEC §13): dev builds only; starts open with ?debug=1, collapsed otherwise. */
export const DEBUG_ENABLED = import.meta.env.DEV;
export const DEBUG_OPEN_BY_DEFAULT = new URLSearchParams(location.search).has('debug');
