import { Blockchain } from "opnet-unit-test/build/blockchain/Blockchain.js";
import { ContractRuntime } from "opnet-unit-test/build/opnet/modules/ContractRuntime.js";
export * from "opnet-unit-test/build/opnet/modules/GetBytecode.js";
export type BlockchainBase = typeof Blockchain;
export type ContractParameter = string | bigint | number;
export type ContractMethod = (...args: (ContractParameter | CallOptions)[]) => any;
export interface CallOptions {
    sender: string;
    from: string;
    to: string;
}
export interface IProviderOrSigner {
    readView(selector: number, opts: CallOptions): Promise<ArrayBuffer>;
    readMethod(selector: number, data: ArrayBuffer, opts: CallOptions): Promise<ArrayBuffer>;
    getAddress(): string;
}
export interface ContractImpl {
    readMethod(selector: number, calldata: Buffer, sender: string, from: string): Promise<ArrayBuffer>;
    readView(selector: number, sender: string, from: string): Promise<ArrayBuffer>;
}
export declare function getContract(blockchain: BlockchainBase, who: string): ContractImpl;
export declare class BlockchainProvider {
    blockchain: typeof Blockchain;
    address: string;
    constructor(address: string, blockchain: typeof Blockchain);
    getAddress(): string;
    readView(selector: number, opts: CallOptions): Promise<ArrayBuffer>;
    readMethod(selector: number, data: ArrayBuffer, opts: CallOptions): Promise<ArrayBuffer>;
}
export interface IFragment {
    name: string;
    parameters: Array<string>;
    returnType: string;
    selector: number;
}
export declare class Contract extends ContractRuntime {
    target: string;
    fns: Array<IFragment>;
    provider: IProviderOrSigner;
    callStatic: {
        [key: string]: ContractMethod;
    };
    [key: string]: any;
    static toFragment(s: string): IFragment;
    static toFragments(fns: Array<string>): Array<IFragment>;
    constructor(address: string, fns: Array<string>, provider: IProviderOrSigner);
}
