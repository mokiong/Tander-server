import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import {
   BaseEntity,
   CreateDateColumn,
   OneToMany,
   PrimaryGeneratedColumn,
   UpdateDateColumn,
} from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { Match } from './Match';

@ObjectType()
@Entity()
export class User extends BaseEntity {
   @Field()
   @PrimaryGeneratedColumn()
   id!: number;

   // GraphQL doesnt expose property if @Field is removed
   @Field()
   @Column({ unique: true })
   username!: string;

   @Field()
   @Column({ unique: true })
   email!: string;

   @Column()
   password!: string;

   @Field(() => String)
   @CreateDateColumn()
   createdAt: Date;

   @Field(() => String)
   @UpdateDateColumn()
   updatedAt: Date;
}
