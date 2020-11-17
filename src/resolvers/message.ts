import { Message } from '../entities/Message';
import {
   Arg,
   Ctx,
   FieldResolver,
   Int,
   Mutation,
   Query,
   Resolver,
   Root,
} from 'type-graphql';
import { MyContext } from '../utilities/types';
import { User } from '../entities/User';
import { Match } from '../entities/Match';

@Resolver(Message)
export class MessageResolver {
   //Queries
   @FieldResolver(() => User)
   async user(@Root() message: Message): Promise<User | null> {
      const user = await User.findOne({
         where: { id: message.userId },
      });

      if (!user) {
         return null;
      }

      user.username =
         user!.username.charAt(0).toUpperCase() + user!.username.slice(1);

      return user;
   }

   @FieldResolver(() => User)
   async receiver(@Root() message: Message): Promise<User | null> {
      const user = await User.findOne({
         where: { id: message.receiverId },
      });

      if (!user) {
         return null;
      }

      user.username =
         user!.username.charAt(0).toUpperCase() + user!.username.slice(1);

      return user;
   }

   @Query(() => [Message])
   async conversation(
      @Arg('receiverId', () => Int) receiverId: number,
      @Ctx() { req }: MyContext
   ): Promise<Message[]> {
      return Message.find({
         where: [
            { userId: req.session.userId, receiverId },
            { userId: receiverId, receiverId: req.session.userId },
         ],
         order: {
            createdAt: 'ASC',
         },
      });
   }

   @Query(() => [Message])
   async getAllMessage(): Promise<Message[]> {
      return await Message.find();
   }

   //Mutations
   @Mutation(() => Boolean)
   async message(
      @Arg('message') text: string,
      @Arg('userId', () => Int) userId: number,
      @Ctx() { req }: MyContext
   ) {
      try {
         const match = await Match.findOne({
            where: [
               { user1: req.session.userId, user2: userId },
               { user2: req.session.userId, user1: userId },
            ],
            relations: ['user1', 'user2'],
         });

         if (!match) {
            return false;
         }

         if (match!.user1.id === req.session.userId) {
            await Message.create({
               text,
               user: match!.user1,
               receiver: match!.user2,
               match,
            }).save();
         } else {
            await Message.create({
               text,
               user: match!.user2,
               receiver: match!.user1,
               match,
            }).save();
         }

         return true;
      } catch (error) {
         console.log(error);
         return false;
      }
   }
}
