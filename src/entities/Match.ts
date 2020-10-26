import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import {
   BaseEntity,
   CreateDateColumn,
   ManyToOne,
   PrimaryColumn,
   UpdateDateColumn,
} from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { User } from './User';

@ObjectType()
@Entity()
export class Match extends BaseEntity {
   @Field()
   @PrimaryColumn()
   user1id!: number;

   @Field()
   @PrimaryColumn()
   user2id!: number;

   @Field()
   @Column({ default: 0 })
   userResponse1!: number;

   @Field()
   @Column({ default: 0 })
   userResponse2!: number;

   @ManyToOne(() => User, (user) => user.matches)
   initiator!: User;

   @ManyToOne(() => User)
   initiated!: User;

   @Field(() => String)
   @CreateDateColumn()
   createdAt: Date;

   @Field(() => String)
   @UpdateDateColumn()
   updatedAt: Date;
}
