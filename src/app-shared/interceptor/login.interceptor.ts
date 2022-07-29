/**
 * 登陆拦截器
 * @author: SunSeekerX
 * @Date: 2020-10-28 15:56:31
 * @LastEditors: SunSeekerX
 * @LastEditTime: 2021-09-14 20:00:21
 */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common'
import { Request } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

import { UpushyLogService } from 'src/app-upushy/upushy-log/upushy-log.service'
import { getIPLocation } from 'src/app-shared/utils/index'
import { getClientIp } from 'src/app-shared/utils/request-ip'

@Injectable()
export class LoginInterceptor implements NestInterceptor {
  constructor(private readonly upushyLogService: UpushyLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest<Request>()

    return next.handle().pipe(
      tap((data) => {
        // 解析ip地址
        const ip = getClientIp(req)
        getIPLocation(ip)
          .then((loginLocation) => {
            // 这里插入数据库有可能抛错误
            this.upushyLogService.createLoginLog({
              username: req.body.username,
              ipaddr: ip,
              loginLocation,
              browser: `${req.useragent.browser}:${req.useragent.version}`,
              os: req.useragent.os,
              status: data.statusCode === 200 ? '1' : '0',
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
