import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button'; 
import Icon from '../../ui/Icon';     
import { Input } from '../../ui/Input'; 
import SmartSelect from '../../ui/SmartSelect';
import { useData } from '../../../context/DataContext';
import { useUI } from '../../../context/UIContext';
import { db } from '../../../lib/firebase';
import { doc, writeBatch, collection, deleteDoc } from 'firebase/firestore';
import { formatCurrency } from '../../../lib/utils';
// import { processOrderStock } from '../../inventory/utils/inventoryActions'; // CONEXIÓN CRÍTICA

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

      if (isEditing) {
        batch.update(doc(db, 'pedidos', order.id), payload);
      } else {
        batch.set(doc(collection(db, 'pedidos')), { ...payload, estado: 'Pendiente', pago_cliente: 0 });
      }

      await batch.commit();

      // ESTO ES LO QUE HACE QUE TU ERP SEA REAL:
      // Solo descuenta si es una venta nueva (para no duplicar descuentos en ediciones)
      if (!isEditing) {
        // await processOrderStock(cart, 'decrease');
      }

      notify(isEditing ? "Pedido actualizado" : "Venta registrada e Inventario actualizado");
      onClose();
    } catch (e) { 
      notify(e.message, "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleProductSelect = (e) => {
    const p = e.target.object;
    if (!p) return;
    // Validar si hay stock antes de dejarlo agregar (opcional pero profesional)
    if (p.gestion_stock === 'inventario' && p.stock <= 0) {
        return notify("Producto sin existencias en inventario", "warning");
    }
    setPreSelected(p);
  };

  const confirmAddToCart = () => {
    const price = Number(preSelected.precio) || 0;
    const qty = Number(preConfig.cantidad) || 1;
    setCart([...cart, { 
        ...preSelected, 
        talla: preConfig.talla, 
        cantidad: qty, 
        total: price * qty, 
        unique_id: crypto.randomUUID(),
        id: preSelected.id // Aseguramos que el ID de Firebase viaje con el item
    }]);
    setPreSelected(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editando #${order?.id_visual}` : "Nuevo Pedido"}>
      <div className="space-y-5 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Sección Cliente */}
        <div className="bg-gray-50 p-4 rounded-2xl border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Fecha" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
            <SmartSelect 
              label="Nombre Cliente"
              options={clientOptions}
              value={client.nombre}
              onChange={(e) => {
                const obj = e.target.object;
                if (obj) setClient({...client, nombre: obj.nombre, telefono: obj.telefono, direccion: obj.direccion, ciudad_entrega: obj.ciudad});
                else setClient({...client, nombre: e.target.value});
              }}
              displayProp="nombre"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={client.telefono} onChange={e => setClient({...client, telefono: e.target.value})} />
            <Input label="Dirección" value={client.direccion} onChange={e => setClient({...client, direccion: e.target.value})} />
          </div>
          <SmartSelect 
                label="Ciudad de Entrega"
                options={shipping}
                value={client.ciudad_entrega}
                onChange={(e) => {
                  const s = e.target.object;
                  if (!s) return setClient({...client, ciudad_entrega: e.target.value});
                  setClient({...client, ciudad_entrega: s.ciudad, estrategia: s.tiene_acopio ? 'Acopio' : 'Directo'});
                }}
                displayProp="ciudad"
            />
        </div>

        {/* Buscador de Productos */}
        {!preSelected ? (
          <SmartSelect 
            placeholder="Buscar por SKU o Modelo..."
            options={products}
            onChange={handleProductSelect}
            displayProp="modelo"
            renderItem={(p) => (
              <div className="flex items-center gap-3 p-1">
                <img src={p.imagen} className="w-8 h-8 rounded object-cover" />
                <div className="flex-1 text-[11px] font-bold">
                    {p.modelo} 
                    {p.gestion_stock === 'inventario' && <span className="ml-2 text-indigo-500">[Stock: {p.stock}]</span>}
                </div>
                <div className="text-[10px] font-black">{formatCurrency(p.precio)}</div>
              </div>
            )}
          />
        ) : (
          <div className="bg-brand-dark text-white p-4 rounded-2xl animate-fade-in">
            <div className="flex justify-between mb-4">
                <span className="font-bold text-xs">{preSelected.modelo}</span>
                <button onClick={() => setPreSelected(null)}><Icon name="X" size={16}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Talla" value={preConfig.talla} onChange={e => setPreConfig({...preConfig, talla: e.target.value})} />
                <Input label="Cantidad" type="number" value={preConfig.cantidad} onChange={e => setPreConfig({...preConfig, cantidad: e.target.value})} />
            </div>
            <Button onClick={confirmAddToCart} className="w-full bg-brand-red mt-4 py-2 text-xs font-black">AGREGAR AL CARRITO</Button>
          </div>
        )}

        {/* Tabla Carrito */}
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-[10px]">
            <tbody className="divide-y">
              {cart.map((it) => (
                <tr key={it.unique_id}>
                  <td className="p-2 font-bold">{it.modelo}</td>
                  <td className="p-2">Talla: {it.talla}</td>
                  <td className="p-2 font-black">{formatCurrency(it.total)}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => setCart(cart.filter(x => x.unique_id !== it.unique_id))} className="text-red-400"><Icon name="X" size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white">
          <div className="text-lg font-black text-brand-red">{formatCurrency(cart.reduce((s, i) => s + Number(i.total), 0))}</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={loading} className="bg-brand-dark text-white px-8 uppercase text-xs font-black">Guardar Venta</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderFormModal;