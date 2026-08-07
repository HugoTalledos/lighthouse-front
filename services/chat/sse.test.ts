import { describe, expect, it } from 'vitest'
import { readSseEvents } from './sse'

function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

async function collect<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const values: T[] = []
  for await (const value of generator) values.push(value)
  return values
}

describe('readSseEvents', () => {
  it('reassembles SSE frames split across stream chunks', async () => {
    const events = await collect(readSseEvents(streamFrom([
      'event: start\ndata: {"thread_id":"t-1"}\n\n',
      'event: message\ndata: {"content":"línea 1\\nlínea 2"}\n\n',
    ])))

    expect(events).toEqual([
      { event: 'start', data: { thread_id: 't-1' } },
      { event: 'message', data: { content: 'línea 1\nlínea 2' } },
    ])
  })

  it('ignores an SSE block with invalid JSON data', async () => {
    const events = await collect(readSseEvents(streamFrom([
      'event: message\ndata: {not-json}\n\n',
    ])))

    expect(events).toEqual([])
  })
})
