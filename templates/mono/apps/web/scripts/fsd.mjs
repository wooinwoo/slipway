import { dirname, relative, resolve } from "node:path"

const ranks = { shared: 0, entities: 1, features: 2, widgets: 3, routes: 4 }
const sliced = new Set(["entities", "features", "widgets"])

function layer(cwd, filename) {
  const parts = relative(resolve(cwd, "src"), filename).replaceAll("\\", "/").split("/")
  if (parts[0] === ".." || parts[0].includes(":")) return null
  return { name: parts[0], rank: ranks[parts[0]] ?? 5, slice: parts[1] }
}

export default {
  rules: {
    layers: {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          upward: "{{from}} cannot import the higher {{to}} layer. Move shared code down or pass it in.",
          sibling: "Slices in {{layer}} cannot import each other ({{from}} → {{to}}). Compose them in a higher layer.",
        },
      },
      create(context) {
        const cwd = context.cwd
        const filename = context.filename
        const from = layer(cwd, filename)
        function check(node, source) {
          const name = source?.value
          if (!from || typeof name !== "string" || (!name.startsWith("@/") && !name.startsWith("."))) return
          const target = name.startsWith("@/") ? resolve(cwd, "src", name.slice(2)) : resolve(dirname(filename), name)
          const to = layer(cwd, target)
          if (!to) return
          if (from.rank < to.rank) context.report({ node, messageId: "upward", data: { from: from.name, to: to.name } })
          else if (from.name === to.name && sliced.has(from.name) && from.slice !== to.slice)
            context.report({ node, messageId: "sibling", data: { layer: from.name, from: from.slice, to: to.slice } })
        }
        return {
          ImportDeclaration: node => check(node, node.source),
          ExportNamedDeclaration: node => check(node, node.source),
          ExportAllDeclaration: node => check(node, node.source),
          ImportExpression: node => check(node, node.source),
        }
      },
    },
  },
}
