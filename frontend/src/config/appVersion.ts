/** Libellé affiché pour les captures / jalons (défaut : v0). */
export function getAppVersionLabel(): string {
    const v = import.meta.env.VITE_APP_VERSION;
    if (v === undefined || v === '') return 'v0';
    return v.startsWith('v') ? v : `v${v}`;
}
