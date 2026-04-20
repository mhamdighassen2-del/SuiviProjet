import { api } from './api';
import { NomService } from '../types/models';

export const referentielService = {
    getServices: () =>
        api
            .get<{ data: { id: string; nom: NomService; description?: string }[] }>('/services')
            .then((r) => r.data.data),
};
