> lokijs is an in-memory database and does not persist the data by default (so each window currently has its own list of events).

🤦‍♂️I did not even realize that lokijs is in memory and doesn't persist.  Thanks for bringing that up!  A lesson to me to investigate tools more deeply.

> Use a global db instance for all the windows but move away from lokijs and use a system that ensures that multiple concurrent clients are handled correctly (even by accessing IndexedDB directly). This could cause some performance regressions if we have many events, since for every read/write we would need to access the storage system (and serialize/deserialize the data).

This seems simpler to implement, since I can imagine more concurrency bugs that might shake out of the other approach, if we have multiple windows that are writing to disk when they close, and also trying to send stats.

Since I don't love the plain indexdb api, I evaluated two other indexdb wrappers.
## pouchDB
### pros
- used in other Electron apps
- nice api for async transactions

### cons
- the docs don't mention explicit typescript support
- has a lot of features we don't necessarily need (like syncing to a couchdb instance) so might be overpowered for our purposes
- the docs tell you to `bower install` to get started.  what year is this, 2014? 😆 do these folks stan bower or are their docs just really out of date?
- bigger bundle size than dexie (113.6 kB unzipped) but tbh probably not big enough to matter

## dexie
https://dexie.org/docs/API-Reference#quick-reference
### pros
- explicit typescript support
- support for [parallel transactions](https://dexie.org/docs/Dexie/Dexie.transaction()#parallell-transactions)
- small bundle size (55.2 kB unzipped)

### cons
- ???

Dexie is the clear winner here, so I'll start implementing a move from lokijs to dexie.

@rafeca please let me know if I'm missing anything, or if you have any concerns about this approach.  Thanks for your help! 
