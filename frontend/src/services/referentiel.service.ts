import { api } from './api';
import { NomService } from '../types/models';
import { CauseRetard } from '../constants/causesRetard';

export const referentielService = {
    getServices: () =>
        api
            .get<{ data: { id: string; nom: NomService; description?: string }[] }>('/services')
            .then((r) => r.data.data),

    getCausesRetard: () =>
        api
            .get<{ data: CauseRetard[] }>('/referentiels/causes-retard')
            .then((r) => r.data.data),
};
