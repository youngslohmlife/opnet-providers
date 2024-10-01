import { Blockchain } from "opnet-unit-test/build/blockchain/Blockchain.js";
export type BlockchainBase = typeof Blockchain;
export type ContractParameter = string | bigint | number;
export type ContractMethod = (...args: (ContractParameter | CallOptions)[]) => any;
export interface CallOptions {
    sender: string;
    from: string;
    to: string;
}
export interface IProviderOrSigner {
    readView(selector: string, opts: CallOptions): ArrayBuffer;
    readMethod(selector: string, data: ArrayBuffer, opts: CallOptions): ArrayBuffer;
}
export interface ContractImpl {
    readMethod(selector: string, calldata: Buffer, sender: string, from: string): Promise<ArrayBuffer>;
    readView(selector: string, sender: string, from: string): Promise<ArrayBuffer>;
}
export declare function getContract(blockchain: BlockchainBase, who: string): ContractImpl;
export declare class BlockchainProvider {
    blockchain: typeof Blockchain;
    address: string;
    constructor(address: string, blockchain: typeof Blockchain);
    readView(selector: string, opts: CallOptions): Promise<ArrayBuffer>;
    readMethod(selector: string, data: ArrayBuffer, opts: CallOptions): Promise<ArrayBuffer>;
}
export interface IFragment {
    name: string;
    parameters: Array<string>;
    returnType: string;
    selector: string;
}
export declare class Contract {
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
