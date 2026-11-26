import { afterEach, describe, expect, it, vi } from 'vitest'
import { reportAppError, setErrorReporter } from '../report'

afterEach(() => {
  setErrorReporter(undefined)
  vi.restoreAllMocks()
})

describe('reportAppError', () => {
  it('logs to the console until a reporter is connected', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('boom')

    reportAppError(error, { message: 'Could not load the staff profile' })

    expect(log).toHaveBeenCalledWith('Could not load the staff profile', error)
  })

  it('sends the error and its context to the connected reporter', () => {
    const reporter = vi.fn()
    setErrorReporter(reporter)
    const error = new Error('boom')

    reportAppError(error, { source: 'GET /admin/users/me/profile' })

    expect(reporter).toHaveBeenCalledWith(error, { source: 'GET /admin/users/me/profile' })
  })

  it('never throws when the reporter fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setErrorReporter(() => {
      throw new Error('reporter down')
    })

    expect(() => reportAppError(new Error('boom'))).not.toThrow()
  })
})
