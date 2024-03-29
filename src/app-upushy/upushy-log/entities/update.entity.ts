/**
 * 更新日志实体
 * @author: SunSeekerX
 * @Date: 2020-11-03 09:39:35
 * @LastEditors: SunSeekerX
 * @LastEditTime: 2021-09-14 22:21:20
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('app_log_update')
export class UpdateLogEntity {
  @PrimaryGeneratedColumn({
    comment: 'id',
    unsigned: true,
  })
  id: number

  @Column({
    type: 'varchar',
    length: 36,
    default: '',
    comment: '设备唯一标识',
  })
  uuid: string

  @Column({
    type: 'varchar',
    name: 'wgt_version',
    length: 50,
    default: '',
    comment: 'wgt版本名',
  })
  wgtVersion: string

  @Column({
    type: 'int',
    name: 'wgt_version_code',
    nullable: false,
    unsigned: true,
    default: 0,
    comment: 'wgt版本号',
  })
  wgtVersionCode: number

  @Column({
    type: 'varchar',
    name: 'native_version',
    length: 50,
    default: '',
    comment: '原生版本名',
  })
  nativeVersion: string

  @Column({
    type: 'int',
    name: 'native_version_code',
    default: 0,
    comment: '原生版本号',
  })
  nativeVersionCode: number

  @Column({
    type: 'varchar',
    length: 50,
    default: '',
    comment: '接口提示信息',
  })
  message: string

  @Column({
    type: 'int',
    name: 'status_code',
    default: 0,
    comment: '接口提示状态码',
  })
  statusCode: number

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_time',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: '创建时间',
  })
  createdTime: Date

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_time',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: '更新时间',
  })
  updatedTime: Date
}
