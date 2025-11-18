import React, { useState } from "react";
import { router } from "@inertiajs/react";
import management from '@/routes/management';

type Pivot = { id:number; branch_id:number; price:number; cost?:number|null; tax_rate?:number|null; status:"listed"|"hidden"|"archived"; min_stock?:number|null; max_stock?:number|null; reorder_point?:number|null; barcode_override?:string|null; note?:string|null };
type Row = { id?:number; pivot?:Pivot };

export default function PricingTable({ productId, initialRows = [] as Row[] }:{ productId:number; initialRows:Row[] }){
  const [form,setForm]=useState({ branch_id:"", price:"", cost:"", tax_rate:"", status:"listed", min_stock:"", max_stock:"", reorder_point:"", barcode_override:"", note:"" });

  const createRow=(e:React.FormEvent)=>{ e.preventDefault();
    router.post(management.productBases.pricing.store.url(productId), form, {
      onSuccess:()=>setForm({ branch_id:"", price:"", cost:"", tax_rate:"", status:"listed", min_stock:"", max_stock:"", reorder_point:"", barcode_override:"", note:"" })
    });
  };

  const deleteRow=(pivotId:number)=>{
    if(!confirm("¿Eliminar precio?")) return;
    router.delete(management.productBases.pricing.destroy.url({ product:productId, id:pivotId }));
  };

  const updateRow=(pivotId:number, data:Record<string,any>)=>{
    router.put(management.productBases.pricing.update.url({ product:productId, id:pivotId }), data);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={createRow} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input className="input" placeholder="branch_id" value={form.branch_id} onChange={e=>setForm({...form, branch_id:e.target.value})}/>
        <input className="input" placeholder="price" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
        <input className="input" placeholder="cost" value={form.cost} onChange={e=>setForm({...form, cost:e.target.value})}/>
        <input className="input" placeholder="tax_rate" value={form.tax_rate} onChange={e=>setForm({...form, tax_rate:e.target.value})}/>
        <select className="input" value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})}>
          <option value="listed">listed</option><option value="hidden">hidden</option><option value="archived">archived</option>
        </select>
        <input className="input" placeholder="min_stock" value={form.min_stock} onChange={e=>setForm({...form, min_stock:e.target.value})}/>
        <input className="input" placeholder="max_stock" value={form.max_stock} onChange={e=>setForm({...form, max_stock:e.target.value})}/>
        <input className="input" placeholder="reorder_point" value={form.reorder_point} onChange={e=>setForm({...form, reorder_point:e.target.value})}/>
        <input className="input" placeholder="barcode_override" value={form.barcode_override} onChange={e=>setForm({...form, barcode_override:e.target.value})}/>
        <input className="input" placeholder="note" value={form.note} onChange={e=>setForm({...form, note:e.target.value})}/>
        <button className="px-3 py-2 rounded bg-green-600 text-white">Agregar</button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left">
            <th>branch_id</th><th>price</th><th>cost</th><th>tax</th><th>status</th><th>stocks</th><th>barcode_override</th><th>note</th><th></th>
          </tr></thead>
          <tbody>
          {initialRows.length===0 && <tr><td colSpan={9} className="py-3 text-gray-500">Sin precios.</td></tr>}
          {initialRows.map((b:any)=>(
            <tr key={b.pivot?.id ?? `${b.id}-np`} className="border-t">
              <td>{b.pivot?.branch_id ?? b.id}</td>
              <td><input defaultValue={b.pivot?.price ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{price:e.target.value})} className="input w-24"/></td>
              <td><input defaultValue={b.pivot?.cost ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{cost:e.target.value})} className="input w-24"/></td>
              <td><input defaultValue={b.pivot?.tax_rate ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{tax_rate:e.target.value})} className="input w-20"/></td>
              <td>
                <select defaultValue={b.pivot?.status ?? "listed"} onChange={e=>b.pivot?.id && updateRow(b.pivot.id,{status:e.target.value})} className="input w-28">
                  <option value="listed">listed</option><option value="hidden">hidden</option><option value="archived">archived</option>
                </select>
              </td>
              <td className="whitespace-nowrap">
                <input defaultValue={b.pivot?.min_stock ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{min_stock:e.target.value})} className="input w-16"/> /
                <input defaultValue={b.pivot?.max_stock ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{max_stock:e.target.value})} className="input w-16"/> /
                <input defaultValue={b.pivot?.reorder_point ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{reorder_point:e.target.value})} className="input w-16"/>
              </td>
              <td><input defaultValue={b.pivot?.barcode_override ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{barcode_override:e.target.value})} className="input w-28"/></td>
              <td><input defaultValue={b.pivot?.note ?? ""} onBlur={e=>b.pivot?.id && updateRow(b.pivot.id,{note:e.target.value})} className="input w-40"/></td>
              <td>{b.pivot?.id && <button className="text-red-600" onClick={()=>deleteRow(b.pivot.id)}>Eliminar</button>}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
