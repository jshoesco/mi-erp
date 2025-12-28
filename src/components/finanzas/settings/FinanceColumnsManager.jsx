import React from 'react';
import TableConfigurator from '../../ui/TableConfigurator';

const FinanceColumnsManager = ({ columns, availableKeys, onSave }) => {
    return (
        <TableConfigurator
            columns={columns}
            availableKeys={availableKeys}
            onSave={onSave}
            saveLabel="ACTUALIZAR TABLA"
        />
    );
};

export default FinanceColumnsManager;