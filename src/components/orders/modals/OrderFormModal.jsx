import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button'; 
import Icon from '../../ui/Icon';     
import { Input } from '../../ui/Inputs'; 
import SmartSelect from '../../ui/SmartSelect';
import ImageUploader from '../../ui/ImageUploader';
import { useData } from '../../../context/DataContext';
import { useUI } from '../../../context/UIContext';
import { db } from '../../../lib/firebase';
import { doc, writeBatch, collection, deleteDoc } from 'firebase/firestore';
import { formatCurrency } from '../../../lib/utils';

const OrderFormModal = ({ isOpen, onClose, order }) => {
  const { products, shipping, orders } = useData();
  const { notify } = useUI();
  const isEditing = !!order;

  const [client, setClient] = useState({ 
    nombre: '', telefono: '', direccion: '', ciudad_entrega: '', estrategia: 'Directo' 
  });
  const [cart, setCart] = useState([]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const [preSelected, setPreSelected] = useState(null);
  const [preConfig, setPreConfig] = useState({ talla: '', cantidad: 1 });

  const clientOptions = useMemo(() => {
    const unique = {};
    orders.forEach(o => {
      if (o.cliente?.telefono) {
        unique[o.cliente.telefono] = { 
          nombre: o.cliente.nombre, 
          telefono: o.cliente.telefono, 
          direccion: o.cliente.direccion, 
          ciudad: o.cliente.ciudad_entrega 
        };
      }
    });
    return Object.values(unique);
  }, [orders]);

  useEffect(() => {
    if (isOpen) {
      if (order) {
        setClient(order.cliente || { nombre: '', telefono: '', direccion: '', ciudad_entrega: '', estrategia: 'Directo' });
        setCart(order.items || []);
        setOrderDate(order.fecha?.slice(0, 10) || new Date().toISOString().slice(0, 10));
      } else {
        setClient({ nombre: '', telefono: '', direccion: '', ciudad_entrega: '', estrategia: 'Directo' });
        setCart([]);
        setOrderDate(new Date().toISOString().slice(0, 10));
      }
      setPreSelected(null);
    }
  }, [isOpen, order]);

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar este pedido?")) return;
    setLoading(true);
    try {
        await deleteDoc(doc(db, 'pedidos', order.id));
        notify("Pedido eliminado");
        onClose();
    } catch (e) { notify(e.message, "error"); }
    finally { setLoading(false); }
  };

  const handleClientSelect = (e) => {
    const obj = e.target.object;
    if (obj) {
      const cityConfig = shipping.find(s => s.ciudad === obj.ciudad);
      setClient({
        nombre: obj.nombre,
        telefono: obj.telefono,
        direccion: obj.direccion || '',
        ciudad_entrega: obj.ciudad || '',
        estrategia: cityConfig?.tiene_acopio ? 'Acopio' : 'Directo'
      });
    } else {
      setClient({ ...client, [e.target.name]: e.target.value });
    }
  };

  const handleProductSelect = (e) => {
    const p = e.target.object;
    if (!p) return;
    setPreSelected(p);
    setPreConfig({ talla: '', cantidad: 1 });
  };

  const confirmAddToCart = () => {
    if (!preConfig.talla) return notify("Debes ingresar una talla", "error");
    const price = Number(preSelected.precio) || 0;
    const qty = Number(preConfig.cantidad) || 1;
    setCart([...cart, { ...preSelected, talla: preConfig.talla, cantidad: qty, total: price * qty, unique_id: crypto.randomUUID() }]);
    setPreSelected(null);
  };

  const handleSave = async () => {
    if (!client.nombre || !client.ciudad_entrega || cart.length === 0) return notify("Faltan datos obligatorios", "error");
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const payload = {
        cliente: client,
        items: cart,
        total: cart.reduce((s, i) => s + Number(i.total), 0),
        fecha: orderDate,
        id_visual: order?.id_visual || Date.now().toString().slice(-6),
        estrategia: client.estrategia
      };
      if (isEditing) batch.update(doc(db, 'pedidos', order.id), payload);
      else batch.set(doc(collection(db, 'pedidos')), { ...payload, estado: 'Pendiente', pago_cliente: 0 });
      await batch.commit();
      onClose();
    } catch (e) { notify(e.message, "error"); }
    finally { setLoading(false); }
  };

  const currentCityHasAcopio = shipping.find(s => s.ciudad === client.ciudad_entrega)?.tiene_acopio;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editando #${order?.id_visual}` : "Nuevo Pedido"}>
      <div className="space-y-5 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="bg-gray-50 p-4 rounded-2xl border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Fecha" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
            <SmartSelect 
              label="Nombre Cliente"
              options={clientOptions}
              value={client.nombre}
              onChange={(e) => { e.target.name = 'nombre'; handleClientSelect(e); }}
              displayProp="nombre"
              searchFields={['nombre', 'telefono']}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SmartSelect 
              label="Teléfono"
              options={clientOptions}
              value={client.telefono}
              onChange={(e) => { e.target.name = 'telefono'; handleClientSelect(e); }}
              displayProp="telefono"
              searchFields={['telefono', 'nombre']}
            />
            <Input label="Dirección" value={client.direccion} onChange={e => setClient({...client, direccion: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <SmartSelect 
                label="Ciudad de Entrega"
                options={shipping}
                value={client.ciudad_entrega}
                onChange={(e) => {
                  const s = e.target.object;
                  // CORRECCIÓN: Si el usuario escribe manualmente y no hay objeto, solo actualizamos el texto
                  if (!s) {
                    setClient({...client, ciudad_entrega: e.target.value});
                    return;
                  }
                  // Si selecciona una opción, aplicamos la lógica de estrategia
                  setClient({
                    ...client, 
                    ciudad_entrega: s.ciudad, 
                    estrategia: s.tiene_acopio ? 'Acopio' : 'Directo'
                  });
                }}
                displayProp="ciudad"
            />
            {currentCityHasAcopio && (
                <div className="flex gap-1 p-1 bg-white border rounded-lg h-[42px]">
                    {['Acopio', 'Directo'].map(est => (
                        <button
                            key={est}
                            type="button"
                            onClick={() => setClient({...client, estrategia: est})}
                            className={`flex-1 text-[10px] font-black rounded-md transition-all ${client.estrategia === est ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            {est.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {!preSelected ? (
            <SmartSelect 
              placeholder="Buscar por SKU o Modelo..."
              options={products}
              onChange={handleProductSelect}
              displayProp="modelo"
              searchFields={['sku', 'modelo']}
              renderItem={(p) => (
                <div className="flex items-center gap-3 p-1">
                  <img src={p.imagen} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 text-xs font-bold">{p.modelo} <span className="text-gray-400 block font-normal font-mono">{p.sku}</span></div>
                  <div className="text-xs font-black text-brand-red">{formatCurrency(p.precio)}</div>
                </div>
              )}
            />
          ) : (
            <div className="bg-brand-dark text-white p-4 rounded-2xl shadow-xl animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <img src={preSelected.imagen} className="w-12 h-12 rounded-lg object-cover border" />
                  <div>
                    <div className="text-sm font-bold">{preSelected.modelo}</div>
                    <div className="text-[10px] opacity-60 font-mono">{preSelected.sku}</div>
                  </div>
                </div>
                <button onClick={() => setPreSelected(null)}><Icon name="X" size={18}/></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Input label="Talla" value={preConfig.talla} onChange={e => setPreConfig({...preConfig, talla: e.target.value})} autoFocus />
                <Input label="Cantidad" type="number" value={preConfig.cantidad} onChange={e => setPreConfig({...preConfig, cantidad: e.target.value})} />
              </div>
              <Button onClick={confirmAddToCart} className="w-full bg-brand-red text-white py-3 font-bold">Agregar al Carrito</Button>
            </div>
          )}
        </div>

        <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-gray-50">
              {cart.map((it, i) => (
                <tr key={it.unique_id}>
                  <td className="p-3 flex items-center gap-3">
                    <img src={it.imagen} className="w-10 h-10 rounded-lg object-cover border" />
                    <span className="font-bold">{it.modelo} <span className="text-gray-400 font-normal">x{it.cantidad}</span></span>
                  </td>
                  <td className="p-3 text-center font-bold">Talla: {it.talla}</td>
                  <td className="p-3 text-right font-black">{formatCurrency(it.total)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setCart(cart.filter(x => x.unique_id !== it.unique_id))} className="text-red-300 hover:text-red-600"><Icon name="X" size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="text-lg font-black text-brand-red">{formatCurrency(cart.reduce((s, i) => s + Number(i.total), 0))}</div>
            {isEditing && (
              <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 transition-colors"><Icon name="Trash2" size={18}/></button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={loading} className="bg-brand-dark text-white px-8">Guardar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderFormModal;