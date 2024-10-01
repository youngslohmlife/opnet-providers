import { BinaryWriter, ABICoder } from "@btc-vision/bsi-binary";
const coder = new ABICoder();
export function getContract(blockchain, who) {
    return blockchain.getContract(blockchain, who);
}
export class BlockchainProvider {
    blockchain;
    address;
    constructor(address, blockchain) {
        this.address = address;
        this.blockchain = blockchain;
    }
    async readView(selector, opts) {
        return await getContract(this.blockchain, opts.to).readView(selector, this.address, this.address);
    }
    async readMethod(selector, data, opts) {
        return await getContract(this.blockchain, opts.to).readMethod(selector, Buffer.from(Array.from(new Uint8Array(data))), opts && opts.sender || this.address, opts && opts.from || this.address);
    }
}
const ln = (v) => ((console.log(v)), v);
export class Contract {
    target;
    fns;
    provider;
    callStatic;
    static toFragment(s) {
        const firstParen = s.indexOf('(');
        const name = s.substr(0, firstParen);
        const params = s.substr(firstParen + 1, s.lastIndexOf(')') - firstParen - 1).split(',').map((v) => v.trim());
        return ln({
            name,
            selector: coder.encodeSelector(name),
            parameters: params
        });
    }
    static toFragments(fns) {
        return fns.map((v) => Contract.toFragment(v));
    }
    constructor(address, fns, provider) {
        this.provider = provider;
        this.fns = Contract.toFragments(fns);
        this.target = address;
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
                return await this.readMethod(v.selector, writer.getBuffer(), last);
            };
            this.callStatic[v.name] = async (...args) => {
                const first = args.slice(0, typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.length - 1 : args.length);
                const last = (args.length === first.length ? {} : args[args.length - 1]);
                last.to = this.target;
                return await this.readView(v.selector, last);
            };
        });
    }
}
//# sourceMappingURL=contract.js.map