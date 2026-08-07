export interface ChatSseEvent {
  event: string
  data: Record<string, unknown>
}

export async function* readSseEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatSseEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })

    if (done) break

    let separatorIndex = buffer.search(/\r?\n\r?\n/)
    while (separatorIndex !== -1) {
      const separator = buffer.match(/\r?\n\r?\n/)!
      const block = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + separator[0].length)
      const event = parseSseBlock(block)
      if (event) yield event
      separatorIndex = buffer.search(/\r?\n\r?\n/)
    }
  }

  const event = parseSseBlock(buffer)
  if (event) yield event
}

function parseSseBlock(block: string): ChatSseEvent | undefined {
  let eventName = ''
  const dataLines: string[] = []

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }

  if (!eventName || dataLines.length === 0) return undefined

  try {
    const data: unknown = JSON.parse(dataLines.join('\n'))
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return undefined
    return { event: eventName, data: data as Record<string, unknown> }
  } catch {
    return undefined
  }
}
