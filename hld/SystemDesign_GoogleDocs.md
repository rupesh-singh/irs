# System Design: Google Docs (Collaborative Editor)

## Goals
- Real-time collaborative editing
- Low latency typing experience
- Conflict resolution and consistency

## High-level Architecture
```
Client (Web)  <->  Realtime Gateway  <->  Collaboration Service  <->  Storage
```
- Realtime Gateway: WebSocket fan-out, auth, room management
- Collaboration Service: Operational Transform or CRDT engine
- Storage: Document snapshots + operation logs

## Key Components
- OT/CRDT Engine: merges concurrent edits
- Presence Service: cursors, selections
- Snapshotter: periodic compaction
- CDN: static assets

## Diagram
![OT vs CRDT](https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/OT_vs_CRDT.png/640px-OT_vs_CRDT.png)

## Considerations
- Sharding by document ID
- Backpressure & batching
- Security: ACLs, sharing links

## References
- Martin Kleppmann — Designing Data-Intensive Applications
