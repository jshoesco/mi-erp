import React from 'react';
import { useOrders } from './hooks/useOrders';
import Button from '../ui/Button'; 
import Icon, { Spinner } from '../ui/Icon';
import OrderCard from './components/OrderCard';
import LogisticsCard from './components/LogisticsCard';
import OrdersModals from './components/OrdersModals';

const OrdersView = () => {
    const { loading, tab, searchText, setSearchText, selection, isDeleting, modals, kanbanData, ui, config, orders } = useOrders();

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <div className="h-full flex flex-col p-4 bg-gray-50 overflow-hidden">
            <header className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                    <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border">
                        {['sales', 'logistics'].map(t => (
                            <button key={t} onClick={() => ui.toggleTab(t)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${tab === t ? 'bg-brand-dark text-white' : 'text-gray-400'}`}>{t.toUpperCase()}</button>
                        ))}
                    </div>
                    {tab === 'sales' && <button onClick={ui.toggleSelectionMode} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border ${selection.mode ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{selection.mode ? 'CANCELAR' : 'SELECCIONAR'}</button>}
                    {selection.ids.length > 0 && <button onClick={ui.handleBatchDelete} disabled={isDeleting} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">{isDeleting ? <Spinner size={16}/> : <Icon name="Trash2" size={18} />}</button>}
                </div>
                <Button onClick={() => ui.openModal('form')} className="bg-brand-red text-white text-xs px-4 uppercase">Nuevo Pedido</Button>
            </header>

            <input className="w-full mb-4 p-2.5 rounded-xl border border-gray-200 text-sm shadow-sm outline-none" placeholder="Buscar..." value={searchText} onChange={e => setSearchText(e.target.value)} />

            <main className="flex-1 overflow-x-auto">
                <div className="flex h-full gap-4 min-w-[1200px]">
                    {Object.entries(tab === 'sales' ? kanbanData.sales : kanbanData.logistics).map(([key, list]) => (
                        <div key={key} className="flex-1 min-w-[260px] bg-gray-200/40 rounded-2xl p-3 flex flex-col h-full">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 px-2 flex justify-between">{key} <span>{list.length}</span></h4>
                            <div className="flex-1 overflow-y-auto space-y-3">
                                {list.map(item => (
                                    tab === 'sales' ? (
                                        <OrderCard key={item.id} order={item} isSelected={selection.ids.includes(item.id)} selectionMode={selection.mode} onSelect={ui.handleSelect} onOpen={(data) => ui.openModal('form', data)} />
                                    ) : (
                                        <LogisticsCard key={item.id} group={item} columnKey={key} onAction={(type, data) => type === 'guide' ? ui.openModal('guide', orders.find(o => o.id === data)) : ui.openModal(type, data)} />
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <OrdersModals modals={modals} onClose={ui.closeModal} config={config} />
        </div>
    );
};

export default OrdersView;