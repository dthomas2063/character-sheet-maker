import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../api/axios'
import GameSidebar from './GameSidebar'
import GameNavBar from './GameNavBar'
import GamePresence from './GamePresence'
import './game-table.css'
import './game-inventory.css'

export default function GameInventory({ user }){
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', quantity: 1, notes: '', isContainer: false, parentItem: '', valueAmount: '', valueDenomination: 'GP' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ quantity: '', notes: '', isContainer: false, parentItem: '', valueAmount: '', valueDenomination: 'GP' })
  const [draggedId, setDraggedId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [editingCurrency, setEditingCurrency] = useState(false)
  const [currencyForm, setCurrencyForm] = useState({ pp: '0', gp: '0', sp: '0', cp: '0' })

  async function loadGame(){
    try{ setGame((await api.get(`/games/${id}`)).data) }
    catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not load party inventory.') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ loadGame() }, [id])

  useEffect(()=>{
    const token = localStorage.getItem('authToken')
    const socket = io(import.meta.env.VITE_API_URL || undefined, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    })
    function joinGame(){ socket.emit('joinGame', { gameId: id }) }
    socket.on('connect', joinGame)
    socket.on('reconnect', joinGame)
    socket.on('inventoryUpdated', ({ partyInventory })=>setGame(current => current ? { ...current, partyInventory } : current))
    socket.on('currencyUpdated', ({ partyCurrency })=>setGame(current => current ? { ...current, partyCurrency } : current))
    return ()=>{
      socket.emit('leaveGame', { gameId: id })
      socket.disconnect()
    }
  }, [id])

  const inventory = game?.partyInventory || []
  const containers = inventory.filter(item => item.isContainer)
  const topLevelItems = inventory.filter(item => !item.parentItem)
  const childrenOf = containerId => inventory.filter(item => String(item.parentItem) === String(containerId))

  async function addItem(e){
    e.preventDefault()
    if(!form.name.trim()) return
    try{
      await api.post(`/games/${id}/inventory`, {
        ...form,
        parentItem: form.isContainer ? '' : form.parentItem,
        value: form.valueAmount === '' ? null : { amount: form.valueAmount, denomination: form.valueDenomination }
      })
      setForm({ name: '', quantity: 1, notes: '', isContainer: false, parentItem: '', valueAmount: '', valueDenomination: 'GP' })
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not add item.') }
  }

  function startEdit(item){
    setEditingId(item._id)
    setEditForm({
      quantity: item.quantity,
      notes: item.notes || '',
      isContainer: !!item.isContainer,
      parentItem: item.parentItem || '',
      valueAmount: item.value?.amount ?? '',
      valueDenomination: item.value?.denomination || 'GP'
    })
  }

  async function saveEdit(itemId){
    try{
      await api.patch(`/games/${id}/inventory/${itemId}`, {
        ...editForm,
        parentItem: editForm.isContainer ? '' : editForm.parentItem,
        value: editForm.valueAmount === '' ? null : { amount: editForm.valueAmount, denomination: editForm.valueDenomination }
      })
      setEditingId(null)
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not update item.') }
  }

  async function removeItem(itemId){
    try{
      await api.delete(`/games/${id}/inventory/${itemId}`)
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not remove item.') }
  }

  function startEditCurrency(){
    const currency = game.partyCurrency || {}
    setCurrencyForm({
      pp: String(currency.pp ?? 0),
      gp: String(currency.gp ?? 0),
      sp: String(currency.sp ?? 0),
      cp: String(currency.cp ?? 0)
    })
    setEditingCurrency(true)
  }

  function updateCurrencyField(denomination, rawValue){
    const digitsOnly = rawValue.replace(/\D/g, '')
    setCurrencyForm(f => ({ ...f, [denomination]: digitsOnly }))
  }

  async function saveCurrency(){
    try{
      await api.patch(`/games/${id}/currency`, currencyForm)
      setEditingCurrency(false)
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not update party funds.') }
  }

  async function moveItem(itemId, parentItemId){
    console.log('move item started', { itemId, parentItemId })
    try{
      await api.patch(`/games/${id}/inventory/${itemId}`, { parentItem: parentItemId || '' })
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not move item.') }
  }

  function handleDragStart(e, item){
    e.stopPropagation()
    setDraggedId(item._id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item._id)
  }

  function handleDragEnd(){
    setDraggedId(null)
    setDropTargetId(null)
  }

  function canDropOn(targetContainer){
    if(!draggedId || !targetContainer) return false
    if(draggedId === targetContainer._id) return false
    const dragged = inventory.find(item => item._id === draggedId)
    if(!dragged || dragged.isContainer) return false
    return true
  }

  function handleContainerDragOver(e, container){
    if(!canDropOn(container)) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetId(container._id)
  }

  function handleContainerDrop(e, container){
    e.preventDefault()
    e.stopPropagation()
    setDropTargetId(null)
    const itemId = e.dataTransfer.getData('text/plain') || draggedId
    if(!itemId || itemId === container._id) { setDraggedId(null); return }
    const dragged = inventory.find(item => item._id === itemId)
    if(!dragged || dragged.isContainer){ setDraggedId(null); return }
    if(String(itemId) !== String(container._id)) moveItem(itemId, container._id)
    setDraggedId(null)
  }

  function handleRootDragOver(e){
    if(!draggedId) {
        console.log('No draggedId found during root drag over.')
        return
    }
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetId('root')
  }

  function handleRootDrop(e){
    e.preventDefault()
    setDropTargetId(null)
    const itemId = e.dataTransfer.getData('text/plain') || draggedId
    if(itemId) moveItem(itemId, null)
    setDraggedId(null)
  }

  function renderItem(item, isChild){
    const editing = editingId === item._id
    return <li
      key={item._id}
      className={`inventory-item${isChild ? ' inventory-item-child' : ''}${item.isContainer ? ' inventory-item-container' : ''}${draggedId === item._id ? ' inventory-item-dragging' : ''}${dropTargetId === item._id ? ' inventory-item-drop-target' : ''}`}
      draggable={!editing}
      onDragStart={e=>handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
      onDragOver={item.isContainer ? e=>handleContainerDragOver(e, item) : undefined}
      onDragLeave={item.isContainer ? ()=>setDropTargetId(current => current === item._id ? null : current) : undefined}
      onDrop={item.isContainer ? e=>handleContainerDrop(e, item) : undefined}
    >
      <div className="inventory-item-row">
        <div className="inventory-item-main">
          {!editing && <span className="inventory-drag-handle" aria-hidden="true" title="Drag to move">⠿</span>}
          {item.isContainer && <span className="inventory-container-badge" title="Container" aria-hidden="true">📦</span>}
          {editing ? (
            <>
              <span className="inventory-item-name">{item.name}</span>
              <input type="number" min="0" className="inventory-qty-input" value={editForm.quantity} onChange={e=>setEditForm(f=>({...f, quantity:e.target.value}))} />
              <input className="inventory-notes-input" placeholder="Notes" value={editForm.notes} onChange={e=>setEditForm(f=>({...f, notes:e.target.value}))} />
              <input type="number" min="0" className="inventory-value-input" placeholder="Value" value={editForm.valueAmount} onChange={e=>setEditForm(f=>({...f, valueAmount:e.target.value}))} />
              <select className="inventory-value-denomination" value={editForm.valueDenomination} onChange={e=>setEditForm(f=>({...f, valueDenomination:e.target.value}))}>
                <option value="CP">CP</option>
                <option value="SP">SP</option>
                <option value="GP">GP</option>
                <option value="PP">PP</option>
              </select>
            </>
          ) : (
            <>
              <span className="inventory-item-name">{item.name}</span>
              <span className="inventory-item-qty">x{item.quantity}</span>
              {item.value?.amount != null && <span className="inventory-item-value">{item.value.amount} {item.value.denomination}</span>}
              {item.notes && <span className="inventory-item-notes">{item.notes}</span>}
            </>
          )}
        </div>
        <div className="inventory-item-actions">
          {editing ? (
            <>
              <button type="button" className="inventory-icon-button" onClick={()=>saveEdit(item._id)} aria-label="Save item" title="Save">✔</button>
              <button type="button" className="inventory-icon-button" onClick={()=>setEditingId(null)} aria-label="Cancel edit" title="Cancel">✕</button>
            </>
          ) : (
            <>
              <button type="button" className="inventory-icon-button" onClick={()=>startEdit(item)} aria-label="Edit item" title="Edit">✏️</button>
              <button type="button" className="inventory-icon-button" onClick={()=>removeItem(item._id)} aria-label="Remove item" title="Remove">🗑️</button>
            </>
          )}
        </div>
      </div>
      {editing && (
        <div className="inventory-item-edit-options">
          <label className="inventory-container-toggle">
            <input type="checkbox" checked={editForm.isContainer} disabled={!!item.parentItem} onChange={e=>setEditForm(f=>({...f, isContainer:e.target.checked, parentItem: e.target.checked ? '' : f.parentItem}))} />
            Is a container
          </label>
          {!editForm.isContainer && (
            <select className="inventory-parent-select" value={editForm.parentItem || ''} onChange={e=>setEditForm(f=>({...f, parentItem:e.target.value}))}>
              <option value="">Not in a container</option>
              {containers.filter(container => container._id !== item._id).map(container => <option key={container._id} value={container._id}>Put in: {container.name}</option>)}
            </select>
          )}
        </div>
      )}
      {item.isContainer && (
        <ul className="inventory-list inventory-nested-list">
          {childrenOf(item._id).map(child => renderItem(child, true))}
          {childrenOf(item._id).length === 0 && <li className="inventory-empty inventory-empty-nested">Empty</li>}
        </ul>
      )}
    </li>
  }

  if(loading) return <p>Loading party inventory...</p>
  if(!game) return <p className="game-table-message">{message || 'Game not found.'}</p>

  return <div className="game-layout">
    <GamePresence gameId={id} />
    <GameSidebar gameName={game.name} gameId={id} />
    <div className="game-layout-content game-inventory-page">
      <GameNavBar gameName={game.name} dmName={game.owner?.name || game.owner?.email} />
      <p className="eyebrow">Shared party loot &amp; supplies</p>
      {message && <p className="game-table-message" role="status">{message}</p>}

      <section className="party-funds">
        <div className="party-funds-header">
          <h3>Party Funds</h3>
          {!editingCurrency && <button type="button" className="inventory-icon-button" onClick={startEditCurrency} aria-label="Edit party funds" title="Edit">✏️</button>}
        </div>
        {editingCurrency ? (
          <div className="party-funds-edit">
            {['pp', 'gp', 'sp', 'cp'].map(denomination => (
              <label key={denomination} className="party-funds-field">
                <span className="party-funds-label">{denomination.toUpperCase()}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="party-funds-input"
                  value={currencyForm[denomination]}
                  onChange={e=>updateCurrencyField(denomination, e.target.value)}
                />
              </label>
            ))}
            <div className="party-funds-actions">
              <button type="button" className="inventory-icon-button" onClick={saveCurrency} aria-label="Save party funds" title="Save">✔</button>
              <button type="button" className="inventory-icon-button" onClick={()=>setEditingCurrency(false)} aria-label="Cancel" title="Cancel">✕</button>
            </div>
          </div>
        ) : (
          <div className="party-funds-display">
            {['pp', 'gp', 'sp', 'cp'].map(denomination => (
              <span key={denomination} className="party-funds-field">
                <span className="party-funds-label">{denomination.toUpperCase()}</span>
                <span className="party-funds-value">{game.partyCurrency?.[denomination] ?? 0}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <form className="inventory-add-form" onSubmit={addItem}>
        <input placeholder="Item name" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} required />
        <input type="number" min="0" placeholder="Qty" value={form.quantity} onChange={e=>setForm(f=>({...f, quantity:e.target.value}))} />
        <input placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} />
        <input type="number" min="0" placeholder="Value (optional)" value={form.valueAmount} onChange={e=>setForm(f=>({...f, valueAmount:e.target.value}))} />
        <select value={form.valueDenomination} onChange={e=>setForm(f=>({...f, valueDenomination:e.target.value}))}>
          <option value="CP">CP</option>
          <option value="SP">SP</option>
          <option value="GP">GP</option>
          <option value="PP">PP</option>
        </select>
        <label className="inventory-container-toggle">
          <input type="checkbox" checked={form.isContainer} onChange={e=>setForm(f=>({...f, isContainer:e.target.checked, parentItem: e.target.checked ? '' : f.parentItem}))} />
          Container
        </label>
        {!form.isContainer && containers.length > 0 && (
          <select value={form.parentItem} onChange={e=>setForm(f=>({...f, parentItem:e.target.value}))}>
            <option value="">Not in a container</option>
            {containers.map(container => <option key={container._id} value={container._id}>Put in: {container.name}</option>)}
          </select>
        )}
        <button type="submit">Add Item</button>
      </form>

      <div className="inventory-list-wrapper">
        {topLevelItems.length ? (
          <ul className="inventory-list">
            {topLevelItems.map(item => renderItem(item, false))}
          </ul>
        ) : <p className="inventory-empty">No items in the party inventory yet.</p>}
        {containers.length > 0 && (
          <div
            className={`inventory-root-dropzone${dropTargetId === 'root' ? ' inventory-list-drop-target' : ''}`}
            onDragOver={handleRootDragOver}
            onDragLeave={()=>setDropTargetId(current => current === 'root' ? null : current)}
            onDrop={handleRootDrop}
          >
            Drag an item here to take it out of a container
          </div>
        )}
      </div>
    </div>
  </div>
}
