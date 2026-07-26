import { rawDataToAdminEgg } from '@/api/admin/transformers';
import type { AdminEgg, EggFormPayload } from '@/api/admin/types';
import http, { type FractalResponseData } from '@/api/http';

export const getAdminEgg = async (nestId: number, eggId: string): Promise<AdminEgg> => {
    const { data } = await http.get<FractalResponseData>(`/api/application/nests/${nestId}/eggs/${eggId}`);

    return rawDataToAdminEgg(data);
};

export const createAdminEgg = async (nestId: number, payload: EggFormPayload): Promise<AdminEgg> => {
    const { data } = await http.post<FractalResponseData>(`/api/application/nests/${nestId}/eggs`, payload);

    return rawDataToAdminEgg(data);
};

export const updateAdminEgg = async (nestId: number, eggId: number, payload: EggFormPayload): Promise<AdminEgg> => {
    const { data } = await http.patch<FractalResponseData>(`/api/application/nests/${nestId}/eggs/${eggId}`, payload);

    return rawDataToAdminEgg(data);
};

export const deleteAdminEgg = async (nestId: number, eggId: number): Promise<void> => {
    await http.delete(`/api/application/nests/${nestId}/eggs/${eggId}`);
};

export const importAdminEgg = async (nestId: number, file: File): Promise<AdminEgg> => {
    const form = new FormData();
    form.append('import_file', file);

    const { data } = await http.post<FractalResponseData>(`/api/application/nests/${nestId}/eggs/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return rawDataToAdminEgg(data);
};

export const importAdminEggFromUrl = async (nestId: number, url: string): Promise<AdminEgg> => {
    const { data } = await http.post<FractalResponseData>(`/api/application/nests/${nestId}/eggs/import-url`, {
        import_file_url: url,
    });

    return rawDataToAdminEgg(data);
};
