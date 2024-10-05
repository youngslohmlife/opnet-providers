import { BinaryWriter, ABICoder } from "@btc-vision/bsi-binary";
import {
  ContractRuntime,
  CallResponse,
  Blockchain,
  BytecodeManager
} from "opnet-unit-test";
import { decodeResponse } from "./utils.js";

export { BytecodeManager };

export type BlockchainBase = typeof Blockchain;

const coder = new ABICoder();

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

export function getContract(blockchain: BlockchainBase, who: string): ContractImpl {
  return blockchain.getContract(who) as unknown as ContractImpl;
}

export class BlockchainProvider {
  public blockchain: typeof Blockchain;
  public address: string;
  constructor(address: string, blockchain: typeof Blockchain) {
    this.address = address;
    this.blockchain = blockchain;
  }
  getAddress(): string {
    return this.address;
  }
  async readView(selector: number, opts: CallOptions): Promise<ArrayBuffer> {
    return await getContract(this.blockchain, opts.to).readView(selector, this.address, this.address);
  }
  async readMethod(selector: number, data: ArrayBuffer, opts: CallOptions): Promise<ArrayBuffer> {
    return await getContract(this.blockchain, opts.to).readMethod(selector, Buffer.from(Array.from(new Uint8Array(data))), opts && opts.sender || this.address, opts && opts.from || this.address);
  }
}

export interface IFragment {
  name: string;
  parameters: Array<string>;
  returnType: string;
  selector: number;
}

const ln = (v) => ((console.log(v)), v);

export class Contract extends ContractRuntime {
  public target: string;
  public fns: Array<IFragment>;
  public provider: IProviderOrSigner;
  public callStatic: {
    [key: string]: ContractMethod
  };
  [key: string]: any;
  static toFragment(s) {
    const [fullSignature, returnType] = s.split(':').map(part => part.trim());
    const firstParen = fullSignature.indexOf('(');
    const name = fullSignature.substr(0, firstParen);
    const params = fullSignature.substr(firstParen + 1, fullSignature.lastIndexOf(')') - firstParen - 1).split(',').map((v) => v.trim());
    return {
        name,
        selector: Number(`0x${coder.encodeSelector(name)}`),
        parameters: params,
        returnType: returnType || 'void'
    };
}
  static toFragments(fns: Array<string>): Array<IFragment> {
    return fns.map((v) => Contract.toFragment(v));
  }
  constructor(address: string, fns: Array<string>, provider: IProviderOrSigner) {
    super(address, provider.getAddress());
    this.provider = provider;
    this.fns = Contract.toFragments(fns);
    this.target = address;
    this.address = address;
    this.callStatic = {};
    this.fns.forEach((v: IFragment) => {
      this[v.name] = async (...args) => {
        const first = args.slice(0, typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.length - 1: args.length);
	const last = args.length === first.length ? {} : args[args.length - 1];
	last.to = this.target;
	const writer = new BinaryWriter();
	v.parameters.forEach((v, i) => {
          switch (v) {
            case 'Address':
              writer.writeAddress(args[i]);
	      break;
	    default:
              writer.writeU256(args[i]);
	      break;
          }
        });
	const result = await this.provider.readMethod(v.selector, writer.getBuffer(), last);
  const decoded = decodeResponse(result, v.returnType);
  result["response"] = decoded;
  return result;
      };
      this.callStatic[v.name] = async (...args) => {
        const first = args.slice(0, typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.length - 1: args.length);
	const last: CallOptions = (args.length === first.length ? {} : args[args.length - 1]) as CallOptions;
	last.to = this.target;
	return await this.provider.readView(v.selector, last);
      };
    });
  }
}
