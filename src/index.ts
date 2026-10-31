import { retry } from './retry'

export type Options = retry.Options
export type RetryFunction<TRet, TErr = any> = retry.RetryFunction<TRet, TErr>
export { retry }
export default retry
