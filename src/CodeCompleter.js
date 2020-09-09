export default class CodeCompleter {

    constructor(nodes) {
        this.nodes = nodes
    }

    getMatches = (term) =>
        this.nodes.filter(node => node.attributes.name.includes(term))
}