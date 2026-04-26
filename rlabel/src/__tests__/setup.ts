import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 全局清理
afterEach(() => {
  cleanup()
})

// 模拟 Tauri API
global.__TAURI__ = {
  core: {
    invoke: vi.fn(),
  },
  dialog: {
    open: vi.fn(),
    save: vi.fn(),
  },
  fs: {
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
  },
}

// 模拟 File API
global.File = class File {
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    // @ts-ignore
    this._bits = bits
    // @ts-ignore
    this._name = name
    // @ts-ignore
    this._options = options || {}
  }

  get name(): string {
    // @ts-ignore
    return this._name
  }

  get type(): string {
    // @ts-ignore
    return this._options.type || ''
  }

  get size(): number {
    // @ts-ignore
    return this._bits.reduce((acc: number, bit: BlobPart) => {
      if (typeof bit === 'string') {
        return acc + new Blob([bit]).size
      }
      // @ts-ignore
      return acc + bit.size || 0
    }, 0)
  }

  async text(): Promise<string> {
    // @ts-ignore
    return this._bits.join('')
  }
} as any

global.Blob = class Blob {
  constructor(bits: BlobPart[], options?: BlobPropertyBag) {
    // @ts-ignore
    this._bits = bits
    // @ts-ignore
    this._options = options || {}
  }

  async text(): Promise<string> {
    // @ts-ignore
    return this._bits.join('')
  }

  get size(): number {
    // @ts-ignore
    return this._bits.reduce((acc: number, bit: BlobPart) => {
      if (typeof bit === 'string') {
        return acc + new Blob([bit]).size
      }
      // @ts-ignore
      return acc + bit.size || 0
    }, 0)
  }
} as any
