import { useHistory, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

function useUrlSelection() {
    const history = useHistory();
    const location = useLocation();

    const selectItem = useCallback(
        (id: string) => {
            history.push({ ...location, search: `?selected=${id}` });
        },
        [history, location]
    );

    const selectedId = new URLSearchParams(location.search).get('selected');

    return { selectedId, selectItem };
}