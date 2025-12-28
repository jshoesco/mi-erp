import { useLayoutEffect } from 'react';
import { useUI } from '../../context/UIContext';

export const HeaderPortal = ({ children }) => {
    const { setHeaderActions } = useUI();

    useLayoutEffect(() => {
        setHeaderActions(() => children);

        return () => setHeaderActions(null);
    }, [setHeaderActions]);

    return null;
};

export default HeaderPortal