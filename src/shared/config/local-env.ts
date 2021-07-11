/**
 * @name:
 * @author: SunSeekerX
 * @Date: 2021-07-10 12:49:06
 * @LastEditors: SunSeekerX
 * @LastEditTime: 2021-07-11 11:52:02
 */

import { IsNotEmpty, Max, Min, ValidateIf } from 'class-validator'
import { Expose } from 'class-transformer'

const emptyList = [null, undefined]
export default class LocalEnv {
  /**
   * 系统服务配置
   */
  @Expose()
  @ValidateIf((o) => !emptyList.includes(o.SERVER_PORT))
  @Min(1)
  @Max(65535)
  readonly SERVER_PORT: number

  @Expose()
  @ValidateIf((o) => !emptyList.includes(o.PRO_DOC))
  readonly PRO_DOC: boolean

  @Expose()
  @IsNotEmpty()
  readonly WEB_OSS: boolean

  @Expose()
  @ValidateIf((o) => !emptyList.includes(o.TOKEN_SECRET))
  @IsNotEmpty()
  readonly TOKEN_SECRET: string

  @Expose()
  @ValidateIf((o) => !emptyList.includes(o.API_SIGN_RSA_PRIVATE_KEY))
  @IsNotEmpty()
  readonly API_SIGN_RSA_PRIVATE_KEY: string

  @Expose()
  @ValidateIf((o) => !emptyList.includes(o.API_SIGN_TIME_OUT))
  @Min(15)
  @IsNotEmpty()
  readonly API_SIGN_TIME_OUT: number

  /**
   * 阿里云 oss
   */
  @Expose()
  @IsNotEmpty()
  readonly ALIYUN_OSS_ENDPOINT: string

  @Expose()
  @IsNotEmpty()
  readonly ALIYUN_OSS_BUCKET: string

  /**
   * 阿里云账号
   */
  @Expose()
  @ValidateIf((o) => !o.WEB_OSS)
  @IsNotEmpty()
  readonly ALIYUN_ACCOUNT_ID: string

  @Expose()
  @ValidateIf((o) => !o.WEB_OSS)
  @IsNotEmpty()
  readonly ALIYUN_ACCOUNT_RAM_ROLE: string

  @Expose()
  @ValidateIf((o) => !o.WEB_OSS)
  @IsNotEmpty()
  readonly ALIYUN_RAM_ACCESS_KEY_ID: string

  @Expose()
  @ValidateIf((o) => !o.WEB_OSS)
  @IsNotEmpty()
  readonly ALIYUN_RAM_ACCESS_KEY_SECRET: string

  @Expose()
  @ValidateIf((o) => !o.WEB_OSS)
  @IsNotEmpty()
  readonly ALIYUN_RAM_TEMPORARY_EXPIRE: number

  /**
   * 数据库
   */
  @Expose()
  @IsNotEmpty()
  readonly DB_HOST: string

  @Expose()
  @Min(1)
  @Max(65535)
  @IsNotEmpty()
  readonly DB_PORT: number

  @Expose()
  @IsNotEmpty()
  readonly DB_USER: string

  @Expose()
  @IsNotEmpty()
  readonly DB_PASSWORD: string

  @Expose()
  @IsNotEmpty()
  readonly DB_DATABASE: string

  /**
   * Redis
   */
  @Expose()
  @IsNotEmpty()
  readonly REDIS_HOST: string

  @Expose()
  @Min(1)
  @Max(65535)
  @IsNotEmpty()
  readonly REDIS_PORT: number

  @Expose()
  @IsNotEmpty()
  readonly REDIS_DB: number

  @Expose()
  @IsNotEmpty()
  readonly REDIS_PASSWORD: string

  @Expose()
  @ValidateIf((o) => o.REDIS_PREFIX)
  @IsNotEmpty()
  readonly REDIS_PREFIX: string
}