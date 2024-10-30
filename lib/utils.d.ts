import { u256 } from "as-bignum/assembly";
import { MemorySlotPointer } from '@btc-vision/btc-runtime/runtime/memory/MemorySlotPointer';
export declare function fromArrayBuffer(data: ArrayBuffer): MemorySlotPointer;
export declare function b32decode(v: string): u256;
export declare function decodeResponse(result: any, returnType: string): any;
