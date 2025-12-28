import React from 'react';
import { useSalesLogic } from './logic/useSalesLogic';
import OrderCard from './sections/OrderCard';

const SalesSection = ({ orders, search, selection, ui }) => {
    const { salesKanban } = useSalesLogic(orders, search);

    return (
        <div className="flex gap-6 h-full min-w-max">
            {Object.entries(salesKanban).map(([key, colOrders]) => (
                <div key={key} className="w-80 flex flex-col gap-4">
                    <header className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key}</span>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {colOrders.length}
                        </span>
                    </header>
                    <div className="flex flex-col gap-3">
                        {colOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isVisibleSelection={selection.isSelectionMode}
                                isSelected={selection.selectedIds.includes(order.id)}
                                onSelect={() => selection.toggle(order.id)}
                                onClick={() => ui.openModal('order', order)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SalesSection;