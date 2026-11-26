// Character sets for a generated temporary password. Look-alikes (I, l, O, 0, 1) are left out so
// the password survives being read aloud or retyped; the symbols all count toward PASSWORD_RULES.
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%^&*-_=+?'
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

/** A uniform random index below `max`, from the browser's CSPRNG (rejection sampling, no modulo bias). */
function randomIndex(max: number) {
  const limit = Math.floor(0x1_0000_0000 / max) * max
  const buffer = new Uint32Array(1)
  do crypto.getRandomValues(buffer)
  while (buffer[0]! >= limit)
  return buffer[0]! % max
}

function pick(set: string) {
  return set[randomIndex(set.length)]!
}

/** A random password that meets every PASSWORD_RULES rule: one of each class, the rest from all, shuffled. */
export function generatePassword(length = 16) {
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]
  while (chars.length < length) chars.push(pick(ALL))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}
