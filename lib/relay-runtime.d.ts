import { c as verifyRoomEvent, i as RoomEventLedger, n as HALL_TOPIC, r as MAX_SYNC_EVENTS, t as HALL_SYNC_PROTOCOL } from "./protocol-DGRSBbTC.js";
//#region src/network/resource-budget.d.ts
/** Abort even when the remote sends no further bytes; checking inside a read
 * loop alone cannot expire a silent peer. Always clear the watchdog on exit. */
declare function withStreamDeadline<T>(stream: {
  abort(error: Error): void;
}, action: () => Promise<T>, timeoutMs?: number): Promise<T>;
//#endregion
export { HALL_SYNC_PROTOCOL, HALL_TOPIC, MAX_SYNC_EVENTS, RoomEventLedger, verifyRoomEvent, withStreamDeadline };
//# sourceMappingURL=relay-runtime.d.ts.map