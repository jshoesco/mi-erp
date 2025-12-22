import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useData } from '../../../context/DataContext';
import { useUI } from '../../../context/UIContext';
import { db } from '../../../lib/firebase';
import { doc, writeBatch, collection } from 'firebase/firestore';
import { formatCurrency } from '../../../lib/utils';

const OrderFormModal = ({ isOpen, onClose, order }) => {
  const { products, shipping, orders } = useData();
  const { notify } = useUI();
  const isEditing = !!order;

  // ESTADO DEL CLIENTE
  const [client, setClient] = useState({
    nombre: '', telefono: '', direccion: '', ciudad_entrega: '', estrategia: 'Directo'
  });

  // ESTADO DEL CARRITO Y FECHA
  const [cart, setCart] = useState([]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  // ESTADOS DE BÚSQUEDA DE PRODUCTO
  const [productSearch, setProductSearch] = useState('');
  const [preSelected, setPreSelected] = useState(null);
  const [preConfig, setPreConfig] = useState({ talla: '', cantidad: 1 });

  // 1. ADAPTADOR DE CLIENTES (Para el autocompletado en el Select)
  const clientOptionsData = useMemo(() => {
    const unique = {};
    orders.forEach(o => {
      if (o.cliente?.nombre) {
        unique[o.cliente.nombre] = {
          nombre: o.cliente.nombre,
          telefono: o.cliente.telefono || '',
          direccion: o.cliente.direccion || '',
          ciudad: o.cliente.ciudad_entrega || ''
        };
      }
    });
    return Object.values(unique);
  }, [orders]);

  const clientNames = useMemo(() => clientOptionsData.map(c => c.nombre), [clientOptionsData]);

  const handleClientChange = (e) => {
    const name = e.target.value;
    const found = clientOptionsData.find(c => c.nombre === name);
    if (found) {
      setClient({ ...client, ...found, nombre: name });
    } else {
      setClient({ ...client, nombre: name });
    }
  };

  // 2. ADAPTADOR DE CIUDADES
  const cityOptions = useMemo(() => shipping.map(s => s.ciudad), [shipping]);

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    const found = shipping.find(s => s.ciudad === cityName);
    setClient({
      ...client,
      ciudad_entrega: cityName,
      estrategia: found?.tiene_acopio ? 'Acopio' : 'Directo'
    });
  };

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
      setProductSearch('');
    }
  }, [isOpen, order]);

  // LÓGICA DE BÚSQUEDA DE PRODUCTOS
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p =>
      p.modelo.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 8);
  }, [products, productSearch]);

  const addToCart = () => {
    if (!preSelected || !preConfig.talla) return notify("Selecciona talla", "warning");
    setCart([...cart, {
      ...preSelected,
      talla: preConfig.talla,
      cantidad: Number(preConfig.cantidad),
      total: Number(preSelected.precio) * Number(preConfig.cantidad),
      unique_id: crypto.randomUUID()
    }]);
    setPreSelected(null);
    setProductSearch('');
  };

  const handleSave = async () => {
    if (!client.nombre || cart.length === 0) return notify("Faltan datos", "error");
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const total = cart.reduce((s, i) => s + i.total, 0);
      const payload = {
        cliente: client,
        items: cart,
        total,
        fecha: orderDate,
        id_visual: order?.id_visual || Date.now().toString().slice(-6),
        estrategia: client.estrategia
      };

      const ref = isEditing ? doc(db, 'pedidos', order.id) : doc(collection(db, 'pedidos'));
      if (isEditing) batch.update(ref, payload);
      else batch.set(ref, { ...payload, estado: 'Pendiente', pago_cliente: 0 });

      await batch.commit();
      notify(isEditing ? "Pedido actualizado" : "Venta registrada");
      onClose();
    } catch (e) { notify(e.message, "error"); } finally { setLoading(false); }
  };

  const Label = ({ children }) => (
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">{children}</label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "EDITAR PEDIDO" : "NUEVO PEDIDO"}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">

        {/* SECCIÓN CLIENTE */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <Input type="date" label="Fecha de Venta" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
          <div>
            <Label>Nombre del Cliente</Label>
            <Select options={clientNames} value={client.nombre} onChange={handleClientChange} />
          </div>
          <Input label="Teléfono" value={client.telefono} onChange={e => setClient({ ...client, telefono: e.target.value })} />
          <div>
            <Label>Ciudad de Entrega</Label>
            <Select options={cityOptions} value={client.ciudad_entrega} onChange={handleCityChange} />
          </div>
        </div>

        {/* BUSCADOR DE PRODUCTOS */}
        <div className="relative">
          <Label>Agregar Productos</Label>
          <Input
            placeholder="BUSCAR POR MODELO O SKU..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
          />
          {productSearch && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-xl z-50 border border-gray-100 mt-2 overflow-hidden">
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => setPreSelected(p)} className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                  <img src={p.imagen} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase">{p.modelo}</div>
                    <div className="text-[9px] text-gray-400 font-mono">STOCK: {p.stock_actual} | {formatCurrency(p.precio)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONFIGURACIÓN DE ITEM SELECCIONADO */}
        {preSelected && (
          <div className="bg-brand-red/5 p-4 rounded-2xl border border-brand-red/20 animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-brand-red uppercase">Configurar Item</span>
              <button onClick={() => setPreSelected(null)}><Icon name="X" size={16} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Talla" value={preConfig.talla} onChange={e => setPreConfig({ ...preConfig, talla: e.target.value })} autoFocus />
              <Input label="Cantidad" type="number" value={preConfig.cantidad} onChange={e => setPreConfig({ ...preConfig, cantidad: e.target.value })} />
              <div className="flex items-end">
                <Button onClick={addToCart} className="w-full h-11 bg-brand-red text-white">AÑADIR</Button>
              </div>
            </div>
          </div>
        )}

        {/* LISTA DEL CARRITO */}
        <div className="space-y-2">
          {cart.map(item => (
            <div key={item.unique_id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <img src={item.imagen} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase text-gray-800">{item.modelo}</div>
                <div className="text-[9px] text-gray-500 font-bold uppercase">Talla: {item.talla} | Cant: {item.cantidad}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-gray-900">{formatCurrency(item.total)}</div>
                <button onClick={() => setCart(cart.filter(i => i.unique_id !== item.unique_id))} className="text-[10px] text-red-400 font-bold uppercase">Quitar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase block">Total a Cobrar</span>
          <span className="text-2xl font-black text-brand-red tracking-tighter">
            {formatCurrency(cart.reduce((s, i) => s + i.total, 0))}
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>CANCELAR</Button>
          <Button onClick={handleSave} isLoading={loading} className="px-8 bg-brand-dark text-white">GUARDAR PEDIDO</Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderFormModal;