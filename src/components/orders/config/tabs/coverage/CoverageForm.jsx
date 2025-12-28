import React from 'react';
import { Button } from '../../../../ui/display/Button';
import { Input } from '../../../../ui/forms/Input';


const CoverageForm = ({ form, setForm, onSubmit, isSaving, editingId, onCancel }) => (
    <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <header className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                {editingId ? 'MODO EDICIÓN' : 'NUEVO DESTINO'}
            </h3>
            {editingId && (
                <button onClick={onCancel} className="text-[9px] font-black text-red-500 uppercase">CANCELAR</button>
            )}
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-3">
                    <Input label="ID" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} />
                </div>
                <div className="col-span-9">
                    <Input label="CIUDAD" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="PAQUETERÍA" value={form.paqueteria} onChange={e => setForm({ ...form, paqueteria: e.target.value })} />
                <Input label="TARIFA $" type="number" value={form.tarifa} onChange={e => setForm({ ...form, tarifa: e.target.value })} />
            </div>
            <div className="flex items-center justify-between px-5 py-3 bg-white rounded-2xl border border-slate-100 transition-all hover:border-slate-300">
                <span className="text-[10px] font-black uppercase text-slate-700">MARCAR COMO ACOPIO</span>
                <input
                    type="checkbox"
                    checked={form.isAcopio}
                    onChange={e => setForm({ ...form, isAcopio: e.target.checked })}
                    className="w-6 h-6 accent-slate-900 cursor-pointer"
                />
            </div>
            <Button loading={isSaving} className="w-full h-14 uppercase tracking-widest text-[11px]">
                {editingId ? 'GUARDAR CAMBIOS' : 'REGISTRAR DESTINO'}
            </Button>
        </form>
    </section>
);

export default CoverageForm;