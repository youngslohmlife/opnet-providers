import { u256 } from "as-bignum/assembly";
import { MemorySlotPointer } from '@btc-vision/btc-runtime/runtime/memory/MemorySlotPointer';
import { BinaryReader } from "@btc-vision/bsi-binary";

export function fromArrayBuffer(data: ArrayBuffer): MemorySlotPointer {
    if (data.byteLength === 0) return u256.Zero;
    const result = u256.fromBytes(changetype<u8[]>(Uint8Array.wrap(data)));
    return result;
}


export function b32decode(v: string): u256 {
    return fromArrayBuffer(fromWords(_b32decode(v).words)) as u256;
}

export function decodeResponse(result: any, returnType: string): any {
    const response = result.response as Uint8Array;
    const reader = new BinaryReader(response);

    switch (returnType.toLowerCase()) {
        case 'u256':
        case 'uint256':
            return reader.readU256();
        case 'u64':
        case 'uint64':
            return reader.readU64();
        case 'u32':
        case 'uint32':
            return reader.readU32();
        case 'u16':
        case 'uint16':
            return reader.readU16();
        case 'u8':
        case 'uint8':
            return reader.readU8();
        case 'string':
            return reader.readStringWithLength();
        case 'bytes':
            return reader.readBytesWithLength();
        case 'boolean':
            return reader.readBoolean();
        case 'address':
            return reader.readAddress();
        case 'u256[]':
        case 'uint256[]':
            return reader.readU256Array();
        case 'u64[]':
        case 'uint64[]':
            return reader.readU64Array();
        case 'u32[]':
        case 'uint32[]':
            return reader.readU32Array();
        case 'u16[]':
        case 'uint16[]':
            return reader.readU16Array();
        case 'u8[]':
        case 'uint8[]':
            return reader.readU8Array();
        case 'string[]':
            return reader.readStringArray();
        case 'bytes[]':
            return reader.readBytesArray();
        case 'tuple':
            return reader.readTuple();
        default:
            return response;
    }
}
