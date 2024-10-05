import { BinaryWriter, ABICoder } from "@btc-vision/bsi-binary";
import { ContractRuntime } from "opnet-unit-test/build/opnet/modules/ContractRuntime.js";
import { decodeResponse } from "./utils.js";
export * from "opnet-unit-test/build/opnet/modules/GetBytecode.js";
const coder = new ABICoder();
export function getContract(blockchain, who) {
    return blockchain.getContract(who);
}
export class BlockchainProvider {
    blockchain;
    address;
    constructor(address, blockchain) {
        this.address = address;
        this.blockchain = blockchain;
    }
    getAddress() {
        return this.address;
    }
    async readView(selector, opts) {
        return await getContract(this.blockchain, opts.to).readView(selector, this.address, this.address);
    }
    async readMethod(selector, data, opts) {
        return await getContract(this.blockchain, opts.to).readMethod(selector, Buffer.from(Array.from(new Uint8Array(data))), opts && opts.sender || this.address, opts && opts.from || this.address);
    }
}
const ln = (v) => ((console.log(v)), v);
export class Contract extends ContractRuntime {
    target;
    fns;
    provider;
    callStatic;
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
    static toFragments(fns) {
        return fns.map((v) => Contract.toFragment(v));
    }
    constructor(address, fns, provider) {
        super(address, provider.getAddress());
        this.provider = provider;
        this.fns = Contract.toFragments(fns);
        this.target = address;
        this.address = address;
        this.callStatic = {};
        this.fns.forEach((v) => {
            this[v.name] = async (...args) => {
                const first = args.slice(0, typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.length - 1 : args.length);
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
                const first = args.slice(0, typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.length - 1 : args.length);
                const last = (args.length === first.length ? {} : args[args.length - 1]);
                last.to = this.target;
                return await this.provider.readView(v.selector, last);
            };
        });
    }
}
//# sourceMappingURL=contract.js.map