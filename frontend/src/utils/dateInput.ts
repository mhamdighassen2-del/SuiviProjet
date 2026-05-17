/**
 * Dates « jour » (sans heure) pour <input type="date"> et l’API.
 * Évite slice() fragile sur les ISO et les décalages d’affichage.
 */

const YMD = /^(\d{4})-(\d{2})-(\d{2})/;

/** Jour civil local — aligné sur <input type="date"> */
function ymdFromLocalDate(d: Date): string {
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
}

/** Valeur pour l’attribut value d’un input type="date" (yyyy-mm-dd) */
export function toDateInputValue(value: string | Date | null | undefined): string {
    if (value == null || value === '') return '';
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? '' : ymdFromLocalDate(value);
    }
    if (typeof value !== 'string') return '';

    const trimmed = value.trim();
    const m = YMD.exec(trimmed);
    if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);
        if (!(y >= 1 && y <= 9999 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return '';
        // ISO datetime (ex. ancienne API) : ne pas prendre seulement le préfixe UTC (décalage d’un jour)
        if (trimmed.length > 10 && trimmed[10] === 'T') {
            const t = Date.parse(trimmed);
            if (!Number.isNaN(t)) return ymdFromLocalDate(new Date(t));
        }
        return `${m[1]}-${m[2]}-${m[3]}`;
    }

    const t = Date.parse(trimmed);
    if (Number.isNaN(t)) return '';
    return ymdFromLocalDate(new Date(t));
}

/** Envoie null pour effacer la date côté serveur (ne pas omettre la clé). */
export function normalizeDateForApi(raw: string): string | null {
    const t = raw.trim();
    if (!t) return null;
    const m = YMD.exec(t);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return null;
}
