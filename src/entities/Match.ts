import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import {
   BaseEntity,
   CreateDateColumn,
   ManyToOne,
   OneToMany,
   PrimaryGeneratedColumn,
   UpdateDateColumn,
} from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { Message } from './Message';
import { User } from './User';

@ObjectType()
@Entity()
export class Match extends BaseEntity {
   @Field()
   @PrimaryGeneratedColumn()
   id!: number;

   @Field()
   @Column({ default: 0 })
   userResponse1!: number;

   @Field()
   @Column({ default: 0 })
   userResponse2!: number;

   @ManyToOne(() => User)
   user1!: User;

   @ManyToOne(() => User)
   user2!: User;

   @Field(() => String)
   @CreateDateColumn()
   createdAt: Date;

   @Field(() => String)
   @UpdateDateColumn()
   updatedAt: Date;
}
