/**
 * @name:
 * @author: SunSeekerX
 * @Date: 2020-10-28 15:56:31
 * @LastEditors: SunSeekerX
 * @LastEditTime: 2021-07-09 16:35:50
 */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common'
import { Request } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

import { LogService } from 'src/log/log.service'
import { getIPLocation } from 'src/shared/utils/index'
import { getClientIp } from 'src/shared/utils/request-ip'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logService: LogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest<Request>()

    return next.handle().pipe(
      tap((data) => {
        // 解析ip地址
        const ip = getClientIp(req)
        getIPLocation(ip)
          .then((loginLocation) => {
            // 这里插入数据库有可能抛错误
            this.logService.createLoginLog({
              username: req.body.username,
              ipaddr: ip,
              loginLocation,
              browser: `${req.useragent.browser}:${req.useragent.version}`,
              os: req.useragent.os,
              status: data.success ? '1' : '0',
              msg: data.message,
              loginTime: new Date(),
            })
          })
          .catch((err) => {
            Logger.error(`---解析ip地址失败错误详情：${err.message}---`)
          })
      })
    )
  }
}
