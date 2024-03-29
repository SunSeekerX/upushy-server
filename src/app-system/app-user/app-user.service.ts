/**
 * @name:
 * @author: SunSeekerX
 * @Date: 2020-06-25 23:08:07
 * @LastEditors: SunSeekerX
 * @LastEditTime: 2021-09-14 17:50:38
 */

import { Injectable, Inject, HttpException, HttpStatus, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DeleteResult } from 'typeorm'
import { validate } from 'class-validator'
import * as jwt from 'jsonwebtoken'

import { UserRO } from './interface'
import { UserEntity } from './entities'
import { LoginUserDto, CreateUserDto, UpdateUserDto } from './dto/index'
import { getEnv } from 'src/app-shared/config'
// import { USER_REPOSITORY } from 'src/app-shared/constant'

@Injectable()
export class AppUserService {
  constructor(
    // @InjectRepository(UserEntity)
    // private readonly userRepo: Repository<UserEntity>
    // @Inject(USER_REPOSITORY)
    // private userRepo: Repository<UserEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
  ) {}

  // 查找全部
  async findAll(): Promise<UserEntity[]> {
    return await this.userRepo.find()
  }

  // 查找单个用户
  async findOne({ username }: LoginUserDto): Promise<UserEntity> {
    return await this.userRepo.findOne({
      where: { username },
    })
  }

  // 创建用户
  async create({ username, password, nickname, email }: CreateUserDto): Promise<UserRO> {
    const user = await this.userRepo.findOne({
      where: { username },
    })
    if (user) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: '用户名已存在',
      })
    }
    // create new user
    const newUser = new UserEntity()
    newUser.username = username
    newUser.nickname = nickname
    newUser.password = password
    newUser.email = email

    const errors = await validate(newUser)
    if (errors.length > 0) {
      const _errors = { username: 'User input is not valid.' }
      throw new HttpException({ message: 'Input data validation failed', _errors }, HttpStatus.BAD_REQUEST)
    } else {
      const savedUser = await this.userRepo.save(newUser)
      return this.buildUserRO(savedUser)
    }
  }

  // 更新用户
  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const toUpdate = await this.userRepo.findOne({
      where: { id },
    })
    delete toUpdate.password

    const updated = Object.assign(toUpdate, dto)
    return await this.userRepo.save(updated)
  }

  // 删除用户
  async delete(username: string): Promise<DeleteResult> {
    return await this.userRepo.delete({ username: username })
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
    })
    if (!user) {
      throw new HttpException({ errors: { User: ' not found' } }, 401)
    }
    return user
    // return this.buildUserRO(user)
  }

  public generateJWT({ id, username }: UserEntity): string {
    // const today = new Date()
    // const exp = new Date(today)
    // exp.setDate(today.getDate() + 60)

    return jwt.sign(
      {
        id,
        username,
        // 过期时间
        // exp: Math.floor(Date.now() / 1000) + 1 * 24 * 60 * 60,
        // exp: Math.floor(Date.now() / 1000) + 5,
      },
      getEnv<string>('JWT_SECRET'),
      {
        // 过期时间/seconds
        expiresIn: 1 * 24 * 60 * 60,
        // expiresIn: 5,
      }
    )
  }

  // 生成 refreshToken
  public generateRefreshToken(user: UserEntity): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      getEnv<string>('JWT_SECRET'),
      {
        // 过期时间/seconds
        expiresIn: 30 * 24 * 60 * 60,
        // expiresIn: 20,
      }
    )
  }

  private buildUserRO(user: UserEntity) {
    const userRO = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      token: this.generateJWT(user),
    }
    return { user: userRO }
  }
}
