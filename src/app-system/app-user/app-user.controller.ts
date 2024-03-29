/**
 * 用户控制器
 * @author: SunSeekerX
 * @Date: 2020-06-25 23:08:25
 * @LastEditors: SunSeekerX
 * @LastEditTime: 2021-09-14 20:52:38
 */

import { Controller, Post, Body, HttpCode, Get, Logger, UseInterceptors, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { verify } from 'jsonwebtoken'
import * as argon2 from 'argon2'
import * as svgCaptcha from 'svg-captcha'

import { BaseResult } from 'src/app-shared/interface'
import { LoginInterceptor } from 'src/app-shared/interceptor'
import { LoginUserDto, CreateUserDto, RefreshTokenDto } from './dto/index'
import { AppUserService } from './app-user.service'
import { guid } from 'src/app-shared/utils/index'
import { getEnv } from 'src/app-shared/config'
import { AppCacheService } from 'src/app-system/app-cache/app-cache.service'
import { ApiResponseConstant } from 'src/app-shared/constant'

@ApiBearerAuth()
@ApiTags('系统模块 - 用户管理')
@Controller('user')
export class AppUserController {
  constructor(private readonly cacheManager: AppCacheService, private readonly appUserService: AppUserService) {}

  // 注册图片验证码
  @ApiOperation({ summary: '获取注册图片验证码' })
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_200)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_401)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_403)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_500)
  @Get('/register/captcha')
  async registerCodeImg(): Promise<BaseResult> {
    const captcha = svgCaptcha.create({
      ignoreChars: '0o1i',
      noise: 1,
      color: true,
    })

    const captchaKey = guid()
    try {
      // const redisClient = await this._getRedisClient()
      // await redisClient.set(`imgCaptcha:register:${captchaKey}`, captcha.text.toLowerCase(), 'ex', 60)

      await this.cacheManager.INSTANCE.set(`imgCaptcha:register:${captchaKey}`, captcha.text.toLowerCase(), {
        ttl: 60,
      })
      return {
        statusCode: 200,
        message: '获取验证码成功',
        data: {
          img: captcha.data,
          uuid: captchaKey,
        },
      }
    } catch (error) {
      return {
        statusCode: 400,
        message: '获取验证码失败',
        errors: [error.message],
      }
    }
  }

  // 注册
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_201)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_401)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_403)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_500)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<BaseResult> {
    if (!createUserDto.imgCaptcha) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: '非法请求',
      }
    }
    try {
      const captchaText = await this.cacheManager.INSTANCE.get<string>(
        `imgCaptcha:register:${createUserDto.imgCaptchaKey}`
      )
      if (captchaText === createUserDto.imgCaptcha) {
        const user = await this.appUserService.create(createUserDto)
        if (user) {
          return {
            statusCode: 200,
            message: '注册成功，请登录',
          }
        }
      } else {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: '验证码错误',
        }
      }
    } catch (error) {
      Logger.error(error.message)
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: error.message,
      }
    }
  }

  // 登录
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_200)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_401)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_403)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_500)
  @Post('/login')
  @UseInterceptors(LoginInterceptor)
  async login(@Body() loginUserDto: LoginUserDto): Promise<BaseResult> {
    if (!loginUserDto.loginCaptchaKey) {
      return {
        statusCode: 400,
        message: '非法请求',
      }
    }

    try {
      // const redisClient = await this._getRedisClient()
      // const loginCaptchaText = await redisClient.get(`imgCaptcha:login:${loginUserDto.loginCaptchaKey}`)
      const loginCaptchaText = await this.cacheManager.INSTANCE.get(`imgCaptcha:login:${loginUserDto.loginCaptchaKey}`)
      if (!loginCaptchaText) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '验证码已失效',
        }
      }

      if (loginCaptchaText === loginUserDto.imgCaptcha) {
        const _user = await this.appUserService.findOne(loginUserDto)

        if (!_user) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: `${loginUserDto.username}不存在`,
          }
        }
        // 检查密码
        if (await argon2.verify(_user.password, loginUserDto.password)) {
          const token = await this.appUserService.generateJWT(_user)
          const refreshToken = await this.appUserService.generateRefreshToken(_user)
          const { username, nickname } = _user
          // const user = { token, username, nickname }

          return {
            statusCode: 200,
            message: '登录成功',
            data: {
              token,
              refreshToken,
              userInfo: {
                username,
                nickname,
              },
            },
          }
        } else {
          return { statusCode: HttpStatus.FORBIDDEN, message: '密码错误' }
        }
      } else {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: '验证码错误',
        }
      }
    } catch (error) {
      Logger.error(error.message)
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '登录失败',
        errors: error.message,
      }
    }
  }

  // 登录图片验证码
  @ApiOperation({ summary: '登录验证码' })
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_200)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_401)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_403)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_500)
  @Get('/login/captcha')
  async loginCodeImg(): Promise<BaseResult> {
    const captcha = svgCaptcha.create({
      ignoreChars: '0o1il',
      noise: 1,
      color: true,
    })

    const captchaKey = guid()
    try {
      await this.cacheManager.INSTANCE.set(`imgCaptcha:login:${captchaKey}`, captcha.text.toLowerCase(), {
        ttl: 60,
      })

      return {
        statusCode: 200,
        message: '获取验证码成功',
        data: {
          img: captcha.data,
          uuid: captchaKey,
        },
      }
    } catch (error) {
      return {
        statusCode: 400,
        message: '获取验证码失败',
        errors: [error.message],
      }
    }
  }

  // 用 refreshToken 获取新的 Token
  @ApiOperation({ summary: '刷新token' })
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_200)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_401)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_403)
  @ApiResponse(ApiResponseConstant.RESPONSE_CODE_500)
  @Post('/token')
  async refreshToken(@Body() { refreshToken }: RefreshTokenDto): Promise<BaseResult> {
    try {
      // 解码 refreshToken
      const decoded: any = verify(refreshToken, getEnv<string>('JWT_SECRET'))
      // 获取用户
      const user = await this.appUserService.findById(decoded.id)
      const token = await this.appUserService.generateJWT(user)
      return {
        statusCode: 200,
        message: 'Success',
        data: token,
      }
    } catch (error) {
      return {
        statusCode: 401,
        message: 'refreshToken 过期',
        errors: [error.message],
      }
    }
  }
}
