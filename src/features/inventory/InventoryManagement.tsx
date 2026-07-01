import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useInventory, useCreateInventoryItem } from '../../hooks/useQueries';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { Spinner } from '../../components/ui/spinner';

export const InventoryManagement: React.FC = () => {
  const { data: items = [], isLoading } = useInventory();
  const createItemMutation = useCreateInventoryItem();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'Asset' | 'Consumable' | 'Electronics' | 'Furniture'>('Electronics');
  const [qty, setQty] = useState('10');
  const [price, setPrice] = useState('250');
  const [supplier, setSupplier] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    await createItemMutation.mutateAsync({
      item_code: code,
      name,
      category,
      quantity: Number(qty) || 1,
      unit_price: Number(price) || 100,
      supplier: supplier || 'General Supplier',
      purchase_date: new Date().toISOString().split('T')[0],
      status: Number(qty) < 5 ? 'Needs Reorder' : 'In Stock',
    });
    setIsAddOpen(false);
    setName('');
    setCode('');
  };

  if (isLoading) return <Spinner size="lg" text="Loading Store & Asset Inventory..." />;

  const totalAssetValue = items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Inventory, Assets & Store Control</span>
            <Badge variant="primary">${totalAssetValue.toLocaleString()} Asset Value</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track high-value school assets, STEM consumables, laptops, purchase orders, suppliers, and maintenance needs.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Inventory Item</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it) => (
          <Card key={it.id} variant="default" className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <Badge variant={it.status === 'In Stock' ? 'success' : 'warning'}>
                {it.status === 'Needs Reorder' && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                {it.status}
              </Badge>
              <span className="text-xs font-mono font-bold text-slate-400">{it.item_code}</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{it.name}</h3>
              <p className="text-xs font-semibold text-[#08428C] dark:text-blue-400 mt-0.5">{it.category}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <span>Qty: <strong>{it.quantity}</strong> units</span>
              <span>Unit: ${it.unit_price}</span>
            </div>
            <div className="text-[11px] text-slate-500">Supplier: {it.supplier}</div>
          </Card>
        ))}
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Asset / Consumable to Inventory">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Item Name" placeholder="e.g. Dell Latitude 5430 Laptops" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Item Code / Barcode" placeholder="e.g. AST-LTP-105" required value={code} onChange={(e) => setCode(e.target.value)} />
          <Select
            label="Category"
            options={['Electronics', 'Asset', 'Consumable', 'Furniture', 'Sports'].map((c) => ({ value: c, label: c }))}
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" type="number" required value={qty} onChange={(e) => setQty(e.target.value)} />
            <Input label="Unit Price ($ USD)" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <Input label="Supplier / Vendor Name" placeholder="e.g. Apple Direct or Staples" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <Button type="submit" variant="primary" className="w-full" isLoading={createItemMutation.isPending}>Save Item</Button>
        </form>
      </Dialog>
    </div>
  );
};
