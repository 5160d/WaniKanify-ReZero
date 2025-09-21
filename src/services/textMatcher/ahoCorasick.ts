export type AutomatonPayload = {
  key: string
  replacement: string
  source: string
  reading?: string
  priority: number
  length: number
  requiresBoundary: boolean
}

type Node = {
  transitions: Map<string, number>
  failure: number
  outputs: number[]
}

type Match = {
  start: number
  end: number
  payload: AutomatonPayload
}

const isWordLikeChar = (char: string): boolean => /[\p{L}\p{N}_'-]/u.test(char)

export class AhoCorasick {
  private nodes: Node[] = [{ transitions: new Map(), failure: 0, outputs: [] }]
  private payloads: AutomatonPayload[] = []

  add(pattern: string, payload: Omit<AutomatonPayload, "length">): void {
    const normalized = Array.from(pattern)
    let nodeIndex = 0

    normalized.forEach((segment) => {
      if (!this.nodes[nodeIndex].transitions.has(segment)) {
        const nextIndex = this.nodes.length
        this.nodes.push({ transitions: new Map(), failure: 0, outputs: [] })
        this.nodes[nodeIndex].transitions.set(segment, nextIndex)
      }
      nodeIndex = this.nodes[nodeIndex].transitions.get(segment)!
    })

    const payloadIndex = this.payloads.length
    this.payloads.push({ ...payload, length: normalized.length })
    this.nodes[nodeIndex].outputs.push(payloadIndex)
  }

  build(): void {
    const queue: number[] = []

    this.nodes[0].transitions.forEach((childIndex) => {
      this.nodes[childIndex].failure = 0
      queue.push(childIndex)
    })

    while (queue.length) {
      const current = queue.shift()!
      const currentNode = this.nodes[current]

      currentNode.transitions.forEach((targetIndex, segment) => {
        queue.push(targetIndex)

        let failure = this.nodes[current].failure
        while (failure > 0 && !this.nodes[failure].transitions.has(segment)) {
          failure = this.nodes[failure].failure
        }

        if (this.nodes[failure].transitions.has(segment)) {
          failure = this.nodes[failure].transitions.get(segment)!
        }

        this.nodes[targetIndex].failure = failure
        const failureOutputs = this.nodes[failure].outputs
        if (failureOutputs.length) {
          this.nodes[targetIndex].outputs.push(...failureOutputs)
        }
      })
    }
  }

  search(characters: string[]): Match[] {
    const matches: Match[] = []
    let nodeIndex = 0

    characters.forEach((char, position) => {
      while (nodeIndex > 0 && !this.nodes[nodeIndex].transitions.has(char)) {
        nodeIndex = this.nodes[nodeIndex].failure
      }

      if (this.nodes[nodeIndex].transitions.has(char)) {
        nodeIndex = this.nodes[nodeIndex].transitions.get(char)!
      }

      const node = this.nodes[nodeIndex]
      if (!node.outputs.length) {
        return
      }

      node.outputs.forEach((payloadIndex) => {
        const payload = this.payloads[payloadIndex]
        const startPosition = position - payload.length + 1
        if (startPosition < 0) {
          return
        }
        matches.push({ start: startPosition, end: position, payload })
      })
    })

    return matches
  }
}

export const checkWordBoundary = (
  textChars: string[],
  start: number,
  end: number
): boolean => {
  const before = start > 0 ? textChars[start - 1] : null
  if (before && isWordLikeChar(before)) {
    return false
  }

  const after = end + 1 < textChars.length ? textChars[end + 1] : null
  if (after && isWordLikeChar(after)) {
    return false
  }

  return true
}

export type AutomatonMatch = {
  start: number
  end: number
  payload: AutomatonPayload
}

export type AutomatonSearchResult = {
  matches: AutomatonMatch[]
  characters: string[]
  indexMap: number[]
}

export const computeIndexMap = (text: string): { characters: string[]; indexMap: number[] } => {
  const characters: string[] = []
  const indexMap: number[] = []
  let cursor = 0

  for (const segment of text) {
    characters.push(segment)
    indexMap.push(cursor)
    cursor += segment.length
  }

  return { characters, indexMap }
}
