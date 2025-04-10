import { expect, test } from 'vitest'

const name = 'foo'

test("should not be null or undefined", () => {
  expect(name).toBeDefined()
  // assert.exists(name, 'foo is neither null nor undefined')
})
