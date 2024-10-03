import { BinaryWriter, ABICoder } from "@btc-vision/bsi-binary";
import { Blockchain } from "opnet-unit-test/build/blockchain/Blockchain.js";
import { CallResponse } from "opnet-unit-test/build/opnet/modules/ContractRuntime.js";

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
  readView(selector: string, opts: CallOptions): Promise<ArrayBuffer>;
  readMethod(selector: string, data: ArrayBuffer, opts: CallOptions): Promise<ArrayBuffer>;
}

export interface ContractImpl {
  readMethod(selector: string, calldata: Buffer, sender: string, from: string): Promise<ArrayBuffer>;
  readView(selector: string, sender: string, from: string): Promise<ArrayBuffer>;
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
  async readView(selector: string, opts: CallOptions): Promise<ArrayBuffer> {
    return await getContract(this.blockchain, opts.to).readView(selector, this.address, this.address);
  }
  async readMethod(selector: string, data: ArrayBuffer, opts: CallOptions): Promise<ArrayBuffer> {
    return await getContract(this.blockchain, opts.to).readMethod(selector, Buffer.from(Array.from(new Uint8Array(data))), opts && opts.sender || this.address, opts && opts.from || this.address);
  }
}

export interface IFragment {
  name: string;
  parameters: Array<string>;
  returnType: string;
  selector: string;
}

const ln = (v) => ((console.log(v)), v);

export class Contract {
  public target: string;
  public fns: Array<IFragment>;
  public provider: IProviderOrSigner;
  public callStatic: {
    [key: string]: ContractMethod
  };
  [key: string]: any;
  static toFragment(s: string): IFragment {
    const firstParen = s.indexOf('(');
    const name = s.substr(0, firstParen);
    const params = s.substr(firstParen + 1, s.lastIndexOf(')') - firstParen - 1).split(',').map((v) => v.trim());
    return ln({
      name,
      selector: coder.encodeSelector(name),
      parameters: params
    });
  }
  static toFragments(fns: Array<string>): Array<IFragment> {
    return fns.map((v) => Contract.toFragment(v));
  }
  constructor(address: string, fns: Array<string>, provider: IProviderOrSigner) {
    this.provider = provider;
    this.fns = Contract.toFragments(fns);
    this.target = address;
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
	return await this.readMethod(v.selector, writer.getBuffer(), last);
      };
      this.callStatic[v.name] = async (...args) => {
        const first = args.slice(0, typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.length - 1: args.length);
	const last: CallOptions = (args.length === first.length ? {} : args[args.length - 1]) as CallOptions;
	last.to = this.target;
	return await this.readView(v.selector, last);
      };
    });
  }
}
