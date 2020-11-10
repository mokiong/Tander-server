import { TransformRootFields } from 'apollo-server-express';
import { Field, ObjectType } from 'type-graphql';
import {
   Entity,
   BaseEntity,
   PrimaryGeneratedColumn,
   Column,
   ManyToOne,
} from 'typeorm';
import { Match } from './Match';
import { User } from './User';

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
}
