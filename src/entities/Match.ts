import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import {
   BaseEntity,
   CreateDateColumn,
   ManyToOne,
   PrimaryGeneratedColumn,
   UpdateDateColumn,
   OneToMany,
} from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { User } from './User';
import { Message } from './Message';

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

   @OneToMany(
      () => Message,
      (message) => message.match,
      { nullable: true }
   )
   messages?: Message[] | null;

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
