// Generated catalog binding. Regenerate with Godot's commerce catalog when prices change.
export const CATALOG_HASH = '0220cb38b42726edf2fd18f7e859011b8911a3f80c11927d1078c8237826b19f'
export const COMMERCE_OPS = new Set(['BUY_ITEM', 'RECYCLE_ITEMS', 'UPGRADE_SECONDARY'])
export const DECLINES = new Set(['INSUFFICIENT_FUNDS','ALREADY_OWNED','INVENTORY_FULL','LEVEL_LIMIT','BALANCE_LIMIT','INCOMPATIBLE_SKIN','WRONG_SHOP'])
const integer = (v,min,max) => Number.isSafeInteger(v) && v>=min && v<=max
export function validCommerce(payload) {
 if (!payload || !COMMERCE_OPS.has(payload.operation)) return false
 const extra=payload.operation==='BUY_ITEM'?['itemId','quantity']:payload.operation==='RECYCLE_ITEMS'?['inventory','slotIndex','itemId','quantity']:['secondaryId','expectedLevel']
 const keys=['operation','baseRevision',...extra]
 if(Object.keys(payload).length!==keys.length || Object.keys(payload).some(key=>!keys.includes(key)))return false
 if(payload.operation==='UPGRADE_SECONDARY')return typeof payload.secondaryId==='string' && integer(payload.expectedLevel,0,5)
 return typeof payload.itemId==='string' && integer(payload.quantity,1,64) && (payload.operation!=='RECYCLE_ITEMS' || ['inventario_mochila','inventario_almacen'].includes(payload.inventory) && integer(payload.slotIndex,0,payload.inventory==='inventario_mochila'?7:47))
}
export function canonical(value){return value && typeof value==='object' ? Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}':JSON.stringify(value)}
export function checkCommerce(record,request) {
 const r=record.receipt
 if(!r || r.requestId!==request.requestId || r.operation!==request.operation || r.revision!==request.baseRevision+1 || canonical(r.request)!==canonical(request) || !integer(record.revision,r.revision,2147483647) || !integer(r.total,0,2147483647) || record.state?.schemaVersion!==1 || !record.state.historia || !record.state.forever || !integer(record.wallet?.balance,0,2147483647) || !integer(record.wallet.revision,0,2147483647)) throw Object.assign(new Error('Recibo de comercio no verificable. Se conserva el pendiente.'),{code:'INVALID_COMMERCE_RESPONSE'})
}
