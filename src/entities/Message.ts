import { Field, ObjectType } from 'type-graphql';
import {
   Entity,
   BaseEntity,
   PrimaryGeneratedColumn,
   Column,
   ManyToOne,
   CreateDateColumn,
   UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Match } from './Match';

@ObjectType()
@Entity()
export class Message extends BaseEntity {
   @Field()
   @PrimaryGeneratedColumn()
   id!: number;

   // GraphQL doesnt expose property if @Field is removed
   @Field()
   @Column()
   text!: string;

   @Field()
   @Column()
   userId!: number;

   @Field()
   @Column()
   receiverId!: number;

   @ManyToOne(() => User)
   user!: User;

   @ManyToOne(() => User)
   receiver!: User;

   @ManyToOne(
      () => Match,
      (match) => match.messages
   )
   match!: Match;

   @Field(() => String)
   @CreateDateColumn()
   createdAt: Date;

   @Field(() => String)
   @UpdateDateColumn()
   updatedAt: Date;
}
