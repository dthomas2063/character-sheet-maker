const databaseName = 'character-sheet-maker'
const databaseVersion = 1

function openDatabase(){
  return new Promise((resolve, reject)=>{
    const request = indexedDB.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      const database = request.result
      if(!database.objectStoreNames.contains('responses')) database.createObjectStore('responses')
      if(!database.objectStoreNames.contains('queue')) database.createObjectStore('queue', { autoIncrement: true })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore(storeName, mode, operation){
  const database = await openDatabase()
  return new Promise((resolve, reject)=>{
    const transaction = database.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = operation(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

export function getCachedResponse(key){
  return withStore('responses', 'readonly', store => store.get(key))
}

export function cacheResponse(key, response){
  return withStore('responses', 'readwrite', store => store.put(response, key))
}

export function addQueuedRequest(request){
  return withStore('queue', 'readwrite', store => store.add(request))
}

export function getQueuedRequests(){
  return openDatabase().then(database => new Promise((resolve, reject)=>{
    const transaction = database.transaction('queue', 'readonly')
    const request = transaction.objectStore('queue').openCursor()
    const entries = []
    request.onsuccess = event => {
      const cursor = event.target.result
      if(cursor){
        entries.push({ id: cursor.key, request: cursor.value })
        cursor.continue()
      }else{
        resolve(entries)
        database.close()
      }
    }
    request.onerror = () => reject(request.error)
  }))
}

export function removeQueuedRequest(id){
  return withStore('queue', 'readwrite', store => store.delete(id))
}
