import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export function useUrlSelection() {
    const navigate = useNavigate();
    const location = useLocation();

    const selectItem = useCallback(
        (id: string) => {
            navigate({ ...location, search: `?selected=${id}` });
        },
        [navigate, location]
    );

    const selectedId = new URLSearchParams(location.search).get('selected');

    return { selectedId, selectItem };
}