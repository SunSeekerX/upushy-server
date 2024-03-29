/**
 * Token 校验中间件
 * @author: SunSeekerX
 * @Date: 2020-07-10 14:55:14
 * @LastEditors: SunSeekerX
 * @LastEditTime: 2021-09-14 22:06:13
 */

import { NestMiddleware, HttpStatus, Injectable, HttpException, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { verify } from 'jsonwebtoken'

import { AppUserService } from 'src/app-system/app-user/app-user.service'
import { getEnv } from 'src/app-shared/config'

@Injectable()
export class TokenAuthMiddleware implements NestMiddleware {
  private readonly ctxPrefix: string = TokenAuthMiddleware.name
  private readonly logger: Logger = new Logger(this.ctxPrefix)

  constructor(private readonly appUserService: AppUserService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void | Error> {
    const { method, originalUrl, ip } = req
    const authorization: string = req.headers.authorization
    if (!authorization) {
      this.logger.warn(
        `code: ${HttpStatus.UNAUTHORIZED} | method: ${method} | path: ${originalUrl} | ip: ${ip} | message: 未登录！`
      )
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED)
    }
    const token = authorization.split(' ')[1]

    try {
      const decoded: any = verify(token, getEnv<string>('JWT_SECRET'))
      const user = await this.appUserService.findById(decoded.id)
      // if (!user) {
      //   throw new HttpException('User not found.', HttpStatus.UNAUTHORIZED)
      // }
      req.user = user
      next()
    } catch (error) {
      this.logger.warn(
        `code: ${HttpStatus.UNAUTHORIZED} | method: ${method} | path: ${originalUrl} | ip: ${ip} | message: ${error.message}`
      )
      res.json({
        statusCode: 401,
        message: 'UNAUTHORIZED',
      })
    }
  }
}
